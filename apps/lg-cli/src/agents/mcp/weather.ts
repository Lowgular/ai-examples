import { MultiServerMCPClient } from "@langchain/mcp-adapters";

export async function mcpExample() {
  const client = new MultiServerMCPClient({  
    codeGraph: {
        transport: "stdio",  // Local subprocess communication
        command: "node",
        // Replace with absolute path to your math_server.js file
        args: ["/Users/greg/Desktop/projects/lowgular/lowgular-internal/dist/apps/mcp/code-graph/main.js"],
        env: {
          "TSCONFIG_PATH": "/Users/greg/Desktop/projects/lowgular/lowgular-tests/greg+007/eda-pub-sub/tsconfig.json"
        }
    },
    // weather: {
    //     transport: "streamable_http",  // HTTP-based remote server
    //     // Ensure you start your weather server on port 8000
    //     url: "http://localhost:8000/mcp",
    // },
});

// const tools = await client.getTools();
const resources = await client.listResources();
console.log(resources);

// const agent = createAgent({
//     model: "ollama:gpt-oss:20b",
//     tools,  
// });

// const result = await agent.invoke({
//     messages: [{ role: "user", content: "Summarize code graph MCP resource about basic match in cypher." }],
// });

// // const weatherResponse = await agent.invoke({
// //     messages: [{ role: "user", content: "what is the weather in nyc?" }],
// // });
// return result;
return 1;
}