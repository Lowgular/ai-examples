import { initChatModel, tool } from "langchain";

export async function chatmlExample() {
  const modelName = 'openai:gpt-4o-mini';
  // const modelName = 'ollama:qwen2.5-coder:32b';
  // const modelName = 'ollama:deepseek-r1:8b';'
  const model = await initChatModel(modelName);
  const modelWithTools = model.bindTools([tool(() => '', {
    name: 'listFiles', 
    description: 'List the files in the folder',
    schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Required path to the folder to list files from.'
        }
      },
      required: ['path']
    }
  })]);
  const response = await modelWithTools.invoke([
//     { role: 'system', content: `You are a typescript expert

// You must respond only with the code.
//       `},
      { role: 'user', content: `Show me the files in the current directory`},
      // Potential GPT-4o-mini assistant message asking for tool
      {
        role: 'assistant',
        content: '',
        tool_calls: [
          {
            id: 'call_abc123',
            name: 'listFiles',
            args: {
              path: '.'
            }
          }
        ]
      },
      // Potential tool message pretending the answer from the tool
      {
        role: 'tool',
        content: `Error: the path is invalid: always start with slash`,
        tool_call_id: 'call_abc123'
      }
  ]);

  return response;
}

export async function fewShotExample() {
  // const modelName = 'openai:gpt-4o-mini';
  // const modelName = 'ollama:qwen2.5-coder:32b';
  const modelName = 'ollama:deepseek-r1:8b';
  const model = await initChatModel(modelName);
  
  const response = await model.invoke([
    { role: 'system', content: `You are a typescript expert

You must respond only with the code.
      `},
      { role: 'user', content: `write me a good example of model called User` },
      { role: 'assistant', content: `\`\`\`typescript
export interface UserModel {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}
\`\`\`
` },
      { role: 'user', content: `write me a model called Product` },
//       { role: 'assistant', content: `\`\`\`typescript
// export interface ProductModel {
//   readonly id: string;
//   readonly name: string;
//   readonly price_value: number;
// }
// \`\`\`` },
//       { role: 'user', content: `Write a angular model called User` },
      
  ]);
  return response;
}