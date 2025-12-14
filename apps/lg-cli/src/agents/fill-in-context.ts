import { MemorySaver } from "@langchain/langgraph";
import { createAgent, createMiddleware, tool } from "langchain";
import * as z from "zod";

export async function fillInContextExample() {
  /**
   * CONTEXT SCHEMA: Defines the template/structure of what needs to be filled.
   * This is passed per invocation and tells the agent what fields exist.
   * It's NOT persisted - it's like a blueprint.
   */
  const contextSchema = z.object({
    name: z.string().optional(),
    age: z.number().optional(),
    email: z.string().email().optional(),
  });

  /**
   * STATE SCHEMA: Stores the actual data being collected.
   * This IS persisted across invocations when using a checkpointer.
   * This is where we store the values as they're collected.
   */
  const stateSchema = z.object({
    collectedData: z
      .object({
        name: z.string().optional(),
        age: z.number().optional(),
        email: z.string().email().optional(),
      })
      .default({}),
    isComplete: z.boolean().default(false),
  });

  /**
   * TOOL: Updates the state with collected values.
   * Tools can only return values - they can't directly modify state.
   * Middleware will handle state updates based on tool results.
   */
  const updateDataTool = tool(
    (args: { field: string; value: string | number }) => {
      // Tool just returns the data - middleware will handle state update
      return JSON.stringify({
        success: true,
        field: args.field,
        value: args.value,
        message: `Updated ${args.field} with value: ${args.value}`,
      });
    },
    {
      name: "update_data",
      description: `Updates the collected data with a field value. 
        Use this tool when you extract information from the user's response.
        Available fields: ${Object.keys(contextSchema.shape).join(", ")}`,
      schema: z.object({
        field: z.enum(["name", "age", "email"]).describe("The field name to update"),
        value: z
          .union([z.string(), z.number()])
          .describe("The value for the field"),
      }),
    }
  );

  /**
   * TOOL: Checks which fields still need to be filled.
   * This tool reads from state to inform the agent.
   */
  const checkStatusTool = tool(
    () => {
      // This will be populated by middleware with current state
      return JSON.stringify({
        message: "Use this tool to check what fields are still missing",
      });
    },
    {
      name: "check_status",
      description:
        "Check which fields have been filled and which are still missing. Use this before asking questions.",
      schema: z.object({}),
    }
  );

  /**
   * MIDDLEWARE: This is where state management happens!
   * 
   * Key concepts:
   * - wrapToolCall: Intercepts tool calls, can modify results
   * - afterModel: Runs after model call, can update state based on messages
   * - beforeModel: Runs before model call, can modify state or prompt
   * 
   * State is accessed via: state parameter (in hooks like afterModel, beforeModel)
   */
  const stateManagementMiddleware = createMiddleware({
    name: "StateManagementMiddleware",
    stateSchema: stateSchema,
    contextSchema: contextSchema,

    /**
     * Wrap tool calls to modify results with state information
     */
    wrapToolCall: async (request, handler) => {
      const toolName = request.tool.name;
      const result = await handler(request);

      // If it's check_status tool, add current state info
      if (toolName === "check_status") {
        const currentState = request.state as any;
        const currentData = currentState?.collectedData || {};
        const schemaKeys = Object.keys(contextSchema.shape);

        const missingFields = schemaKeys.filter(
          (key) => currentData[key as keyof typeof currentData] === undefined
        );
        const filledFields = schemaKeys.filter(
          (key) => currentData[key as keyof typeof currentData] !== undefined
        );

        // Modify the result's content
        if (result && typeof result === 'object' && 'content' in result) {
          return {
            ...result,
            content: JSON.stringify({
              missingFields,
              filledFields,
              isComplete: missingFields.length === 0,
              currentData,
            }),
          } as typeof result;
        }
      }

      return result;
    },

    /**
     * After model call, update state based on tool results
     */
    afterModel: async (state, runtime) => {
      // Look for update_data tool results in the messages
      const messages = (runtime as any).state?.messages || [];
      const lastToolMessages = messages
        .slice(-10)
        .filter((msg: any) => msg.getType?.() === "tool");

      for (const toolMsg of lastToolMessages) {
        try {
          const content = JSON.parse(toolMsg.content as string);
          if (content.field && content.value !== undefined) {
            // Update state
            const currentData = (state as any)?.collectedData || {};
            const updatedData = {
              ...currentData,
              [content.field]: content.value,
            };

            // Check if all fields are filled
            const schemaKeys = Object.keys(contextSchema.shape);
            const allFieldsFilled = schemaKeys.every(
              (key) => updatedData[key as keyof typeof updatedData] !== undefined
            );

            return {
              ...state,
              collectedData: updatedData,
              isComplete: allFieldsFilled,
            };
          }
        } catch {
          // Not JSON or not update_data result, skip
        }
      }

      return state;
    },

    /**
     * Before model call, ensure state is initialized
     */
    beforeModel: async (state) => {
      // Ensure state is initialized
      if (!state || !(state as any).collectedData) {
        return {
          ...state,
          collectedData: {},
          isComplete: false,
        };
      }
      return state;
    },
  });

  /**
   * CREATE AGENT: Combines all pieces together
   * 
   * How it all fits:
   * 1. model: The LLM that reasons and decides actions
   * 2. stateSchema: Defines what data persists (collectedData, isComplete)
   * 3. contextSchema: Defines the structure template (passed per invocation)
   * 4. tools: Functions the agent can call (update_data, check_status)
   * 5. middleware: Intercepts tool calls and updates state
   * 6. checkpointer: Enables state persistence across invocations
   * 7. systemPrompt: Guides the agent's behavior
   */
  const agent = await createAgent({
    model: "ollama:qwen3:0.6B",
    systemPrompt: `You are a helpful assistant that collects information from users.

Your task is to fill in an object with the following fields: name, age, email.

INSTRUCTIONS:
1. First, use the check_status tool to see what's missing.
2. Ask ONE question at a time about ONE missing field.
3. After the user responds, use the update_data tool to save their answer.
4. Continue until all fields are filled.
5. Be natural and conversational - don't sound robotic.

When you have collected all information, inform the user that the form is complete.`,
    tools: [updateDataTool, checkStatusTool],
    stateSchema: stateSchema,
    contextSchema: contextSchema,
    middleware: [stateManagementMiddleware],
    checkpointer: new MemorySaver(), // Enables state persistence
  });

  /**
   * USAGE: How to invoke the agent
   * 
   * Key points:
   * 1. Use the same thread_id to maintain state across invocations
   * 2. Provide initial state values (collectedData, isComplete) on first call
   * 3. State persists automatically via checkpointer - subsequent calls don't need state
   * 4. Context can be passed via config.context (optional)
   */
  const threadId = "form-filling-session-1";
  const config = { configurable: { thread_id: threadId } };

  // First invocation - start the conversation
  // Provide initial state values
  let result = await agent.invoke(
    {
      messages: [
        { role: "user", content: "Let's start filling out the form" },
      ],
      collectedData: {},
      isComplete: false,
    },
    config
  );

  console.log("Agent:", result.messages[result.messages.length - 1].content);
  console.log("State:", result.collectedData);

  // Simulate user responses (in real app, this would be interactive)
  // The state persists, so we can continue the conversation
  // Note: TypeScript requires state to be provided, but defaults will be used if not provided
  result = await agent.invoke(
    {
      messages: [
        ...result.messages,
        { role: "user", content: "My name is John" },
      ],
      collectedData: result.collectedData || {},
      isComplete: result.isComplete || false,
    },
    config // Same thread_id = same state
  );

  console.log("\nAgent:", result.messages[result.messages.length - 1].content);
  console.log("State:", result.collectedData);

  result = await agent.invoke(
    {
      messages: [
        ...result.messages,
        { role: "user", content: "I'm 30 years old" },
      ],
      collectedData: result.collectedData || {},
      isComplete: result.isComplete || false,
    },
    config
  );

  console.log("\nAgent:", result.messages[result.messages.length - 1].content);
  console.log("State:", result.collectedData);

  result = await agent.invoke(
    {
      messages: [
        ...result.messages,
        { role: "user", content: "My email is john@example.com" },
      ],
      collectedData: result.collectedData || {},
      isComplete: result.isComplete || false,
    },
    config
  );

  console.log("\nAgent:", result.messages[result.messages.length - 1].content);
  console.log("Final State:", result.collectedData);
  console.log("Is Complete:", result.isComplete);

  return result;
}
