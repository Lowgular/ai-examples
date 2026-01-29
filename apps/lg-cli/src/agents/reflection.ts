import { createAgent } from "langchain";

export async function reflectionExample() {
  const generatorAgent = createAgent({
    model: 'ollama:llama3.2:3b',
    systemPrompt: `You are a TypeScript/Angular expert. 
    Write clean, well-structured code following Angular best practices.
    Include proper TypeScript types and Angular patterns.
    Provide complete, runnable code examples.
    
    If the user provides critique, respond with a revised version of your previous attempts.
  `,
  });

  const criticAgent = createAgent({
    model: 'openai:gpt-4o',
    systemPrompt: `You are a senior code reviewer specializing in TypeScript and Angular.
    Your task is to review code and improve it based on:
    1. Angular best practices and patterns
    2. TypeScript type safety and proper typing
    3. Code organization and readability
    4. Error handling and edge cases
    5. Performance considerations
    
    Provide detailed recommendations for the code to be improved in a form of a list for up to 5 most severe improvements.
    Each item on the list should include:
    - error description
    - recommnedation for improvement
    - severity of the error
    `,
  });

  const userRequest = "Write an event bus in Angular";
  
  const generatorResult = await generatorAgent.invoke({
    messages: [
      { role: "user", content: userRequest }
    ]
  });

  const generatedCode = generatorResult.messages[generatorResult.messages.length - 1]?.content || '';
  
  const criticResult = await criticAgent.invoke({
    messages: [
      { 
        role: "user", 
        content: `Review the following code and provide a list of up to 5 most severe improvements:
        ${generatedCode}`

      }
    ]
  });

  const critiqueMessage = criticResult.messages[criticResult.messages.length - 1]?.content || '';
  
  const finalGeneratorResult = await generatorAgent.invoke({
    messages: [...generatorResult.messages, { role: "user", content: critiqueMessage }]
  });

  return finalGeneratorResult.messages;
}
