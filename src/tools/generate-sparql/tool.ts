import { tool } from "ai";
import { z } from "zod/v4";
import type { GenerateSparqlOptions } from "./generate-sparql.ts";
import { generateSparql } from "./generate-sparql.ts";

export const generateSparqlInputSchema = z.object({
  prompt: z.string(),
});

export const generateSparqlOutputSchema = z.object({
  query: z.string(),
});

/**
 * createGenerateSparqlTool creates a tool that generates a SPARQL query for
 * a prompt.
 */
export function createGenerateSparqlTool(options: GenerateSparqlOptions) {
  return tool({
    name: "generateSparql",
    description: "Generates a SPARQL query for a given prompt",
    inputSchema: generateSparqlInputSchema,
    outputSchema: generateSparqlOutputSchema,
    execute: async ({ prompt }) => {
      const result = await generateSparql(prompt, options);
      return { query: result.text };
    },
  });
}
