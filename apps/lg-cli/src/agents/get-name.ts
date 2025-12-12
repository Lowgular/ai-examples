import { createAgent, initChatModel, tool } from "langchain";
import * as z from "zod";

export async function getUserName() {
const getUserNameTool = tool(
  (_, config) => {
    return config.context.user_name
  },
  {
    name: "get_user_name",
    description: "Get the user's name. Use this tool when you need to retrieve the user's name.",
    schema: z.object({}),
  }
);

const contextSchema = z.object({
  user_name: z.string(),
});

// Try a larger model that better supports tool calling
// Options: 'ollama:qwen2.5:7b', 'ollama:qwen2.5:14b', 'ollama:llama3.2:3b'
// Smaller models like qwen3:0.6B often don't support native tool calling
const model = await initChatModel('ollama:qwen3:0.6B');

const agent = createAgent({
  model,
  systemPrompt: `You are a helpful assistant.
  You have access to tools.
  When asked about the user's name, you MUST use the get_user_name tool to retrieve it.
  Always use tools when you need information.`, 
  tools: [getUserNameTool],
  contextSchema,
});

const result = await agent.invoke(
  {
    messages: [
      { role: "user", content: "What is my name? You must respond only with the name." }
    ]
  },
  {
    context: { user_name: "John Smith" }
  }
);

// Debug: Check if tool was called by looking for tool message types
const toolMessages = result.messages.filter(msg => msg.getType() === 'tool');
if (toolMessages.length === 0) {
  console.warn('⚠️  No tool calls detected. The model may not support native tool calling.');
  console.warn('💡 Try using a larger model like: ollama:qwen2.5:7b or ollama:llama3.2:3b');
  console.log('📝 Model response:', result.messages[result.messages.length - 1]?.content);
}

return result;
}