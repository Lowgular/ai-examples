import { Command, MemorySaver } from "@langchain/langgraph";
import { createAgent, humanInTheLoopMiddleware, initChatModel, tool } from "langchain";

export async function humanInTheLoopExample() {
const searchTool = tool(
  () => ['angular.txt', 'react.txt'],
  {
    name: "search",
    description: "Search the web for information",
  }
);

const model = await initChatModel('ollama:llama3.2:3b');

const agent = createAgent({
  model,
  systemPrompt: `You are a helpful assistant.
  You have access to the search tool.
  You must use the search tool to find the files.
  You must respond only with the files that you found.
  `,
  tools: [searchTool],
  middleware: [
    humanInTheLoopMiddleware({
      interruptOn: {
        search: true,
      }
    }),
  ],
  checkpointer: new MemorySaver(),
});

// Human-in-the-loop requires a thread ID for persistence
const config = { configurable: { thread_id: "some_id" } };

// Agent will pause and wait for approval before executing sensitive tools
let result = await agent.invoke(
  { messages: [{ role: "user", content: "I need you to search for the files" }] },
  config
);

console.log(JSON.stringify(result['__interrupt__'], null, 2), config);

result = await agent.invoke(
  new Command({ resume: { decisions: [{ type: "edit" }] } }),
  config  // Same thread ID to resume the paused conversation
);

return [];
}