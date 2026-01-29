import { createAgent, initChatModel, tool } from "langchain";
import * as z from "zod";

export async function getUserName() {
const getUserNameTool = tool(
  (_) => {
    return "John Smith"
  },
  {
    name: "get_user_name",
    description: "Get the user's name. Use this tool when you need to retrieve the user's name.",
    schema: z.object({}),
  }
);

const model = await initChatModel('ollama:llama3.2:3b');

const agent = createAgent({
  model,
  systemPrompt: `You are a helpful assistant.
  You have access to tools.
  When asked about the user's name, you MUST use the get_user_name tool to retrieve it.
  Always use tools when you need information.
  
  You must respond with data from the tool call
  `, 
  tools: [getUserNameTool],
});

const result = await agent.invoke(
  {
    messages: [
      { role: "user", content: "What is my name? You must respond only with the name." }
    ]
  },
);

return result;
}