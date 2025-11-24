import type { LanguageModel } from "ai";
import { generateText, tool } from "ai";
import { z } from "zod/v4";

export interface GenerateSparqlOptions {
  model: LanguageModel;
  prompt: string;
  validate: (query: string) => boolean;
}

export async function generateSparql(options: GenerateSparqlOptions) {
  return await generateText({
    model: options.model,
    prompt:
      `Generate a SPARQL query for the following prompt: ${options.prompt}`,
    system:
      `You are a helpful assistant that generates a SPARQL query for a given prompt.
    Always use the \`validateSparql\` tool to validate the query.
    Return the query only if it is valid, otherwise try again.`,
    tools: {
      validateSparql: validateSparqlTool(options.validate),
    },
  });
}

export function validateSparqlTool(validate: (query: string) => boolean) {
  return tool({
    name: "validateSparql",
    description: "Validate a SPARQL query",
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.object({ isValid: z.boolean() }),
    execute: ({ query }) => {
      return { isValid: validate(query) };
    },
  });
}
