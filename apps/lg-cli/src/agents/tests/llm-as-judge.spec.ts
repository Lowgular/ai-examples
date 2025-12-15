import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { convertMessagesToCompletionsMessageParams } from "@langchain/openai";
import { ChatCompletionMessage, createTrajectoryLLMAsJudge, TRAJECTORY_ACCURACY_PROMPT, TRAJECTORY_ACCURACY_PROMPT_WITH_REFERENCE } from "agentevals";
import { createAgent } from "langchain";
import * as z from "zod";

const getWeather = tool(
  async ({ city }: { city: string }) => {
    return `It's 75 degrees and sunny in ${city}.`;
  },
  {
    name: "get_weather",
    description: "Get weather information for a city.",
    schema: z.object({ city: z.string() }),
  }
);

const agent = createAgent({
  // model: "gpt-4o",
  model: "ollama:mistral:7b",
  tools: [getWeather]
});



it('should test trajectory accuracy without reference', async () => {
  const result = await agent.invoke({
    messages: [new HumanMessage("What's the weather in Seattle?")]
  });

  const evaluator = createTrajectoryLLMAsJudge({  
    // model: "openai:o3-mini",
    model: "ollama:qwen3:0.6B",
    prompt: TRAJECTORY_ACCURACY_PROMPT,  
  });  

  const evaluation = await evaluator({
    outputs: convertMessagesToCompletionsMessageParams(result) as ChatCompletionMessage[],
  });
  // {
  //     'key': 'trajectory_accuracy',
  //     'score': true,
  //     'comment': 'The provided agent trajectory is reasonable...'
  // }
  expect(evaluation.score).toBe(true);
});

it('should test trajectory accuracy with reference', async () => {
  const result = await agent.invoke({
    messages: [new HumanMessage("What's the weather in Seattle?")]
  });

  const evaluator = createTrajectoryLLMAsJudge({  
    // model: "openai:o3-mini",
    model: "ollama:qwen3:0.6B",
    prompt: TRAJECTORY_ACCURACY_PROMPT_WITH_REFERENCE,  
  });  

  const evaluation = await evaluator({
    outputs: convertMessagesToCompletionsMessageParams(result) as ChatCompletionMessage[],
    referenceOutputs: convertMessagesToCompletionsMessageParams(result) as ChatCompletionMessage[]
  });
  // {
  //     'key': 'trajectory_accuracy',
  //     'score': true,
  //     'comment': 'The provided agent trajectory is reasonable...'
  // }
  expect(evaluation.score).toBe(true);
});