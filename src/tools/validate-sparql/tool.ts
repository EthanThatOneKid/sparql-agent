import { tool } from "ai";
import type { SparqlValidator } from "./sparql-validator.ts";
import {
  validateSparqlInputSchema,
  validateSparqlOutputSchema,
} from "./sparql-validator.ts";

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
