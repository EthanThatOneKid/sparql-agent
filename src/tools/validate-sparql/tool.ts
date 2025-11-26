import { tool } from "ai";
import { z } from "zod/v4";

/**
 * SparqlValidator validates a SPARQL query.
 */
export interface SparqlValidator {
  validateSparql: (query: string) => boolean;
}

/**
 * createValidateSparqlTool creates a tool that validates a SPARQL query
 * using a given SPARQL validator.
 */
export function createValidateSparqlTool(sparqlValidator: SparqlValidator) {
  return tool({
    name: "validateSparql",
    description: "Validates syntax of a SPARQL query",
    inputSchema: validateSparqlInputSchema,
    outputSchema: validateSparqlOutputSchema,
    execute: ({ query }) => {
      const success = sparqlValidator.validateSparql(query);
      return { success };
    },
  });
}

export const validateSparqlInputSchema = z.object({
  query: z.string(),
});

export const validateSparqlOutputSchema = z.object({
  success: z.boolean(),
});
