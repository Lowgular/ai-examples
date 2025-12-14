import { createAgent, createMiddleware, tool } from "langchain";
import * as z from "zod";

export async function featureFlagsExample() {
const contextSchema = z.object({
  enabledTools: z.array(z.string()).optional(),
});

const storeBasedTools = createMiddleware({
  name: "StoreBasedTools",
  contextSchema,
  wrapModelCall: async (request, handler) => {
    // Read enabled tools from context
    const enabledTools = request.runtime.context.enabledTools;
    console.log('Enabled tools:', enabledTools);
    
    let filteredTools = request.tools;
    console.log('Total tools:', filteredTools.length);
    
    if (enabledTools && enabledTools.length > 0) {
      filteredTools = request.tools.filter(t => enabledTools.includes(t.name as string));  
    }
    console.log('Filtered tools:', filteredTools.length);
    
    return handler({ ...request, tools: filteredTools });  
  },
});

const agent = createAgent({
  model: "ollama:qwen3:0.6B",
  systemPrompt: "You are a helpful tool caller.",
  tools: [tool(() => '', { name: 'test' }), tool(() => '', { name: 'test2' })],
  middleware: [storeBasedTools],
  contextSchema,
});

const result = await agent.invoke(
  { messages: [{ role: "user", content: "Call test tool" }] },
  { context: { enabledTools: ["test"] } }
);

return result.messages.length;
}