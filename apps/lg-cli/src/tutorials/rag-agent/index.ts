import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { VectorStore } from "@langchain/core/vectorstores";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { resolveEmbeddings } from "@lg-chatbot/shared";
import { createAgent, Document, dynamicSystemPromptMiddleware, SystemMessage, tool } from "langchain";
import * as z from "zod";

const loadDocuments = async (): Promise<Document[]> => {
  const pTagSelector = "p";
  const cheerioLoader = new CheerioWebBaseLoader(
    "https://lilianweng.github.io/posts/2023-06-23-agent/",
    {
      selector: pTagSelector,
    }
  );
  
  const docs = await cheerioLoader.load();
  return docs;
}

const toolAgent = (model: string, vectorStore: VectorStore) => {
  const retrieveSchema = z.object({ query: z.string() });
  const retrieveTool = tool(
    async ({ query }) => {
      const retrievedDocs = await vectorStore.similaritySearch(query, 2);
      const serialized = retrievedDocs
        .map(
          (doc) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`
        )
        .join("\n");
      return [serialized, retrievedDocs];
    },
    {
      name: "retrieve",
      description: "Retrieve information related to a query.",
      schema: retrieveSchema,
      responseFormat: "content_and_artifact",
    }
  );
  const systemPrompt = new SystemMessage(
      "You have access to a tool called 'retrieve' that retrieves context from a blog post. " +
      "Use the tool to help answer user queries."
  );

  const agent =  createAgent({ model, tools: [retrieveTool], systemPrompt });

  return agent;
}

const twoChainAgent = (model: string, vectorStore: VectorStore) => {
  const agent = createAgent({
    model,
    tools: [],
    middleware: [
      dynamicSystemPromptMiddleware(async (state) => {
          const lastQuery = state.messages[state.messages.length - 1].content;
  
          const retrievedDocs = await vectorStore.similaritySearch(lastQuery as string, 2);
  
          const docsContent = retrievedDocs
          .map((doc) => doc.pageContent)
          .join("\n\n");
  
          // Build system message
          const systemMessage = new SystemMessage(
          `You are a helpful assistant. Use the following context in your response:\n\n${docsContent}`
          );
  
          // Return only the system message, not an array
          return systemMessage;
      })
    ]
  });
  
  return agent;
  }

export async function ragAgentExample() {
  const embeddings = resolveEmbeddings('ollama:mxbai-embed-large');

  const vectorStore = new MemoryVectorStore(embeddings);

  const docs = await loadDocuments();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const allSplits = await splitter.splitDocuments(docs);

  await vectorStore.addDocuments(allSplits);

  let inputMessage = `What is the standard method for Task Decomposition?
  Once you get the answer, look up common extensions of that method.`;

  let agentInputs = { messages: [{ role: "user", content: inputMessage }] };

  const agent = twoChainAgent("ollama:gpt-oss:20b", vectorStore);

  const stream = await agent.stream(agentInputs, {
    streamMode: "values",
  });
  for await (const step of stream) {
    const lastMessage = step.messages[step.messages.length - 1];
    console.log(`[${lastMessage._getType()}]: ${lastMessage.content}`);
    console.log("-----\n");
  }
}