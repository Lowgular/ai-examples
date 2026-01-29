import { initChatModel } from "langchain";

export async function checkReasoning() {
  // const modelName = 'openai:gpt-4.1';
  // const modelName = 'ollama:qwen2.5:latest';
  const modelName = 'ollama:deepseek-r1:8b';
  // const modelName = 'ollama:smollm2:135m';
  const systemPrompt = `
  You are a calculator. Your role is to calculate the result of the user question.

  You must respond only with the result of the calculation.
  `;



const model = await initChatModel(modelName);
const response = await model.invoke(`${systemPrompt}

  ## Response
  Respond first with a long reasoning process and then the result of the calculation.

  Then respond in json format with the result of the calculation.
  \`\`\`json
  {
    "result": 4
  }
  \`\`\`


  ## User Question
  How much is 2 * 2?
  `);
// const response = await model.invoke([{role: 'system', content: systemPrompt}, {role: 'user', content: `How much is 2 * 2?`}]);

return response;
}




const prefix = "console.log('hello ";
const suffix = "');";

const prompt = `<!fim-prefix>${prefix}<!fim-suffix>${suffix}<!fim-middle>`;

const middle = 'world'