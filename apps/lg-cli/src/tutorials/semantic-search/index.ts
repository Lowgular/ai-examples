import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { resolveEmbeddings } from "@lg-chatbot/shared";
import { Document } from "langchain";



const loadDocuments = async (): Promise<Document[]> => {
  // const documents = [
  //   new Document({
  //     pageContent:
  //       "Dogs are great companions, known for their loyalty and friendliness.",
  //     metadata: { source: "mammal-pets-doc" },
  //   }),
  //   new Document({
  //     pageContent: "Cats are independent pets that often enjoy their own space.",
  //     metadata: { source: "mammal-pets-doc" },
  //   }),
  // ];
  // return Promise.resolve(documents);

  const loader = new PDFLoader('/Users/greg/Desktop/projects/lowgular/vibe-projects/lg-chatbot/apps/lg-cli/src/tutorials/semantic-search/data/nke-10k-2023.pdf');

  const docs = await loader.load();
  return docs;
}

const splitDocuments = async (docs: Document[]): Promise<Document[]> => {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  return await textSplitter.splitDocuments(docs);
}

export async function semanticSearchExample() {
  const docs = await loadDocuments();
  
  const allSplits = await splitDocuments(docs);

  const embeddings = resolveEmbeddings('huggingface:Xenova/bge-small-en-v1.5');

  // const vector1 = await embeddings.embedQuery(allSplits[0].pageContent);
  // const vector2 = await embeddings.embedQuery(allSplits[1].pageContent);

  // console.log("Are vectors equal?", vector1.length === vector2.length);
  // console.log(`Generated vectors of length ${vector1.length}\n`);
  // console.log(vector1.slice(0, 10));


  const vectorStore = new MemoryVectorStore(embeddings);

  await vectorStore.addDocuments(allSplits);

  // const results1 = await vectorStore.similaritySearch(
  //   "When was Nike incorporated?"
  // );

  // const embedding = await embeddings.embedQuery(
  //   "How were Nike's margins impacted in 2023?"
  // );
  
  // const results3 = await vectorStore.similaritySearchVectorWithScore(
  //   embedding,
  //   1
  // );

  const retriever = vectorStore.asRetriever({
    searchType: "mmr",
    searchKwargs: {
      fetchK: 1,
    },
  });
  
  const results2 = await retriever.batch([
    "When was Nike incorporated?",
    "What was Nike's revenue in 2023?",
  ]);

  return results2;
}