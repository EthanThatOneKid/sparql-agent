import { tool } from "ai";
import { z } from "zod/v4";

export const validateSparqlInputSchema = z.object({
  query: z.string(),
});

export const validateSparqlOutputSchema = z.object({
  success: z.boolean(),
});

export interface SparqlValidator {
  validateSparql: (query: string) => boolean;
}

export function createValidateSparqlTool(sparqlValidator: SparqlValidator) {
  return tool({
    name: "validateSparql",
    description: "Validate syntax of a SPARQL query",
    inputSchema: validateSparqlInputSchema,
    outputSchema: validateSparqlOutputSchema,
    execute: ({ query }) => {
      const success = sparqlValidator.validateSparql(query);
      return { success };
    },
  });
}
