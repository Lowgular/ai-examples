import { initChatModel } from "langchain";

export async function checkReasoning() {
  // const modelName = 'openai:gpt-4.1';
  // const modelName = 'ollama:qwen3:0.6B';
  const modelName = 'ollama:qwen:0.5b';
  // const modelName = 'ollama:smollm2:135m';
  const systemPrompt = `
  You are a calculator. Your role is to calculate the result of the user question.

  You must respond only with the result of the calculation.
  `;

const model = await initChatModel(modelName);
const response = await model.invoke(`${systemPrompt}
  Okay, the user is asking how much 2 multiplied by 2 is. Let me think. Well, 2 times 2...
  I remember that when you multiply two numbers, you just do the calculation.
  So 2 multiplied by 2. Let me do that step by step. First, 2 times 2 is 4.
  So the answer should be 4. I don't think there's any trick here, right? No need to round or anything.
  Just a straightforward multiplication. Yep, that's it.\n\n`);
// const response = await model.invoke([{role: 'system', content: systemPrompt}, {role: 'user', content: `How much is 2 * 2?`}]);
  
return response;
}