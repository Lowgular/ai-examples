import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { OllamaEmbeddings } from "@langchain/ollama";
import { OpenAIEmbeddings } from "@langchain/openai";

/**
 * https://docs.langchain.com/oss/javascript/integrations/text_embedding
 * openai:text-embedding-3-large
 * ollama:mxbai-embed-large
 * huggingface:Xenova/bge-small-en-v1.5
 * huggingface:Xenova/bge-base-en-v1.5
 */
export const resolveEmbeddings = (providerString: string) => {
  
  const [provider, model] = providerString.split(':');

  if (provider === 'openai') {
    return new OpenAIEmbeddings({
      model: model
    });
  } else if (provider === 'ollama') {
    return new OllamaEmbeddings({
      model: model
    });
  } else if (provider === 'huggingface') {
    return new HuggingFaceTransformersEmbeddings({
      model: model
    });
  }

  throw new Error(`Unsupported provider: ${provider}`);
}