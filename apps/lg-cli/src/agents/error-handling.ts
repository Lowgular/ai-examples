import { createAgent, initChatModel, tool } from "langchain";
import * as z from "zod";

/**
 * This example demonstrates how agents can handle errors and recover from failures.
 * The agent will:
 * 1. Try to fetch user data (which may randomly fail)
 * 2. If it fails, the agent will detect the error and retry
 * 3. Once successful, calculate the name length
 * 
 * This showcases the agent's ability to reason about errors and self-correct.
 */
export async function errorHandlingExample() {
  let count = 0;
  // Simulate a database lookup that can randomly fail
  const getUserNameTool = tool(
    async () => {
      // Simulate network/database failure 40% of the time
      if (count === 0) {
        count++;
        return {
          status: 'error',
          message: 'Database connection failed. Please try again.'
        }
      }
      // Simulate different names
      const names = ['Johnnatan', 'Tom', 'Sarah', 'Michael'];
      return {
        status: 'success',
        name: names[Math.floor(Math.random() * names.length)]
      }
    },
    {
      name: "get_user_name",
      description: "Get the user's name from the database. This tool may occasionally fail due to network issues. If it fails, try calling it again. The tool will return a status that can be either 'success' or 'error'.",
      schema: z.object({}),
    }
  );

  const model = await initChatModel('ollama:devstral-small-2:24b');

  const agent = createAgent({
    model,
    systemPrompt: `You are a helpful assistant that can handle errors gracefully.
    
    When using tools:
    1. If a tool call fails with an error, read the error message carefully
    2. If the error suggests retrying (like "try again"), call the tool again
    3. Once you successfully get the user's name, use the get_user_name_length tool to calculate its length
    4. Always provide the final answer to the user
    
    Be persistent - if a tool fails, try again before giving up.
    
    At the end use the tool tool response that return
    \`\`\`json
    {
      "status": "success | error",
      "name": "string"
    }
    \`\`\`

    and use the name from the response to answer the user's question.
    `,
    tools: [getUserNameTool],
  });

  const result = await agent.invoke(
    {
      messages: [
        { role: "user", content: "What is the user's name?" }
      ]
    }
  );

  return result;
}