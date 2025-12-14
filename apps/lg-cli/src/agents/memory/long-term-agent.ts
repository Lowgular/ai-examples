import { BaseStore, InMemoryStore } from "@langchain/langgraph";
import { createAgent, tool, type ToolRuntime } from "langchain";
import * as z from "zod";

export async function longTermAgentExample() {

  // InMemoryStore saves data to an in-memory dictionary. Use a DB-backed store in production.
const store = new InMemoryStore();
const contextSchema = z.object({
  userId: z.string(),
});

const UserInfo = z.object({
  name: z.string(),
  language: z.string(),
});

// Write sample data to the store using the put method
await store.put( 
  ["users"], // Namespace to group related data together (users namespace for user data)
  "user_123", // Key within the namespace (user ID as key)
  {
    name: "John Smith",
    language: "English",
  } // Data to store for the given user
);

const getUserInfo = tool(
  // Look up user info.
  async (_, runtime: ToolRuntime<unknown, z.infer<typeof contextSchema>>) => {
    // Access the store - same as that provided to `createAgent`
    const userId = runtime.context.userId;
    if (!userId) {
      throw new Error("userId is required");
    }
    // Retrieve data from store - returns StoreValue object with value and metadata
    const userInfo = await (runtime.store as unknown as BaseStore).get(["users"], userId);
    // const userInfo = await store.get(["users"], userId);
    return userInfo?.value ? JSON.stringify(userInfo.value) : "Unknown user";
  },
  {
    name: "getUserInfo",
    description: "Look up user info by userId from the store.",
    schema: z.object({}),
  }
);

const saveUserInfo = tool(
  async (
    userInfo: z.infer<typeof UserInfo>,
    runtime: ToolRuntime<unknown, z.infer<typeof contextSchema>>
  ) => {
    const userId = runtime.context.userId;
    if (!userId) {
      throw new Error("userId is required");
    }
    // Store data in the store (namespace, key, data)
    await (runtime.store as unknown as BaseStore).put(["users"], userId, userInfo);
    return "Successfully saved user info.";
  },
  {
    name: "save_user_info",
    description: "Save user info",
    schema: UserInfo,
  }
);

const agent = createAgent({
  // model: "gpt-4o-mini",
  model: "ollama:mistral:7b",
  tools: [getUserInfo, saveUserInfo],
  contextSchema,
  // Pass store to agent - enables agent to access store when running tools
  store,
});

let result = await agent.invoke(
  { messages: [{ role: "user", content: "Given user: John Smith with language: English, save the user information" }] },
  { context: { userId: "user_123" } } 
);
// console.log(result);

// Run the agent
result = await agent.invoke(
  { messages: [
    ...result.messages,
    { role: "user", content: "look up user information" }] },
  { context: { userId: "user_123" } } 
);
return result;
}