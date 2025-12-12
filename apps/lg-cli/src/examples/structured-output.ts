import { initChatModel } from "langchain";
import { z } from "zod";

export async function structuredOutputExample() {
  // const modelName = 'ollama:qwen:0.5b';
  const modelName = 'openai:gpt-5-mini';
  // const systemPrompt = `
  // You are a SQL expert with knowledge about Typescript AST.

  // Your task is to create an SQL query to insert the data into the database.

  // The SQL schema is:

  // \`\`\`sql
  // CREATE TABLE class_declaration (
  //   id INT PRIMARY KEY AUTO_INCREMENT,
  //   name VARCHAR(255) NOT NULL,
  // );
  // \`\`\`

  // You must only respond with the SQL query.
  // `;

  // const model = await initChatModel(modelName);
  // const response = await model.invoke([{
  //   role: 'system',
  //   content: systemPrompt
  // }, {
  //   role: 'user',
  //   content: `
  //  Generate sql query to get all classes
  //   `
  // }]);
  // const systemPrompt = `
  // You are a expert with knowledge about Typescript AST.

  // Your task is to answer user question

  // \`\`\`typescript
  // export class MyClass {
  //   constructor(public name: string) {
  //   }
  // }

  // class SecondClass {
  
  // }
  // \`\`\`

  // You must only respond with the SQL query.
  // `;

  // const model = await initChatModel(modelName);
  // const response = await model.invoke([{
  //   role: 'system',
  //   content: systemPrompt
  // }, {
  //   role: 'user',
  //   content: `
  // How many classes do you see?
  //   `
  // }]);

  const systemPrompt = `
  You are a weather expert. Your task is to return the weather information for the given city.
  `;
  const model = await initChatModel(modelName);

  const structuredModel = model.withStructuredOutput(z.object({
    weather: z.string()
  }));

  return await structuredModel.invoke([{
    role: 'system',
    content: systemPrompt
  }, {
    role: 'user',
    content: `
    What is the weather in Tokyo?
    `
  }]);
}