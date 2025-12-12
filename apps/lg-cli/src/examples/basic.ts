import { initChatModel } from "langchain";

export async function basicExample() {
  const modelName = 'openai:o4-mini';
  // const modelName = 'ollama:qwen:0.5b';
  // const modelName = 'ollama:smollm2:135m';
  const prompt = `
    You are a typescript expert.

    Your task is to explain the following code:

    \`\`\`javascript
    const add = (a: number, b: number) => a + b;
    \`\`\`

    You must respond in a friendly tone
  `;

  const model = await initChatModel(modelName);

  return await model.invoke(prompt);
}