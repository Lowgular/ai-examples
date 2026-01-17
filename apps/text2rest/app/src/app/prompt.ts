import { FitnessClass } from "@text2rest/shared";

export const FITNESS_CLASS_FILTER_PROMPT = (userMessage: string, classes: FitnessClass[]) => `
## Context
You have access to the following data, read it carefully and use it to build the query parameters:
\`\`\`json
${JSON.stringify(classes, null, 2)}
\`\`\`

## Role
You are a query parameter builder. Extract information from natural language and convert it into JSON query parameters.

## Task
Extract the meaning of the user message and return ONLY a JSON object with the relevant filter properties. 

## Critical Rules
1. ONLY include properties that are explicitly mentioned or clearly implied in the user message
2. DO NOT include properties with null, undefined, or empty values
3. DO NOT include properties you are unsure about
4. Return a partial JSON object - it can have 0, 1, 2, 3, or 4 properties maximum
5. If no filters can be extracted, return an empty object: {}

## Available Properties
- "classType": string (e.g., "Yoga", "Pilates", "HIIT")
- "difficulty": string (e.g., "Beginner", "Intermediate", "Advanced")
- "dayOfWeek": string (e.g., "Monday", "Tuesday", "Wednesday")
- "instructor": string (MUST be an actual instructor name from the context data, not a description)

## User Message
${userMessage}

## Your Response (JSON only, no explanation):
`