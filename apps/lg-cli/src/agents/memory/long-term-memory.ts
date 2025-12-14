import { Embeddings } from "@langchain/core/embeddings";
import { InMemoryStore } from "@langchain/langgraph";

// Simple Embeddings implementation for testing
// Replace with an actual embedding model (e.g., OpenAIEmbeddings) in production
class SimpleEmbeddings extends Embeddings {
  constructor() {
    super({});
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return texts.map(() => [1.0, 2.0]);
  }

  async embedQuery(text: string): Promise<number[]> {
    return [1.0, 2.0];
  }
}

export async function longTermMemoryExample() {

// InMemoryStore saves data to an in-memory dictionary. Use a DB-backed store in production use.
const store = new InMemoryStore({ index: { embeddings: new SimpleEmbeddings(), dims: 2 } }); 
const userId = "my-user";
const applicationContext = "chitchat";
const namespace = [userId, applicationContext]; 

await store.put( 
    namespace,
    "a-memory",
    {
        rules: [
            "User likes short, direct language",
            "User only speaks English & TypeScript",
        ],
        "my-key": "my-value",
    }
);

// get the "memory" by ID
const item = await store.get(namespace, "a-memory"); 

// search for "memories" within this namespace, filtering on content equivalence, sorted by vector similarity
const items = await store.search( 
    namespace,
    {
        filter: { "my-key": "my-value" },
        query: "language preferences"
    }
);
return {item, items};
}