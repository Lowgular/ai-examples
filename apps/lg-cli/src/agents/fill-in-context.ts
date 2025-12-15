import { createAgent } from "langchain";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function fillInContextExample(fields: Record<string, string | number> = {}) {
  const fieldsEntries = Object.entries(fields);
  const fieldsString = fieldsEntries.length > 0 ? fieldsEntries.map(([key, value]) => `- ${key}: ${value}`).join("\n") : "There are no fields that are already filled up.";
  // const contextSchema = z.object({
  //   application_kind: z.string().nullable(),
  //   interior_or_exterior: z.enum(["interior", "exterior"]).nullable(),
  //   surface_area_m2: z.number().nullable(),
  //   coats: z.number().nullable(),
  //   color_preference:  z.enum(["bialy", "kolor"]).nullable(),
  //   finish_preference: z.enum(["mat", "satyna", "polmat", "polysk"]).nullable(),
  // });

  const systemPrompt = `You are a color painter assistant that asks questions to the user to fill in the context.

The context schema is:

\`\`\`json
{
  application_kind: string;
  interior_or_exterior: "interior" | "exterior" | null;
  surface_area_m2: number | null;
  coats: number | null;
  color_preference: "bialy" | "kolor" | null;
  finish_preference: "mat" | "satyna" | "polmat" | "polysk" | null;
}
\`\`\`

INSTRUCTIONS:
1. Read the fields that are already filled up and the fields that are not yet filled up.
2. Compare what we already have with the context schema and the fields that are not yet filled up.
3. Think about the next questions to ask.
4. Output the next questions in correct json format.

Fields that are already filled up should not be asked again.

${fieldsString}

RULES:
You must answer only in polish language.

`
// console.log(systemPrompt);

  const agent = await createAgent({
    model: "openai:gpt-4o-mini",
    systemPrompt,
    // contextSchema,
  });

  let result = await agent.invoke(
    {
      messages: [
        { role: "user", content: "Ask me the questions to fill in the context" },
      ],
    },
  );

  return result;
  // return { messages: []};
}
