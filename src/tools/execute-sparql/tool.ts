import { tool } from "ai";
import type { SparqlEngine } from "./sparql-engine.ts";
import {
  executeSparqlInputSchema,
  executeSparqlOutputSchema,
} from "./sparql-engine.ts";

/**
 * createExecuteSparqlTool creates a tool that executes a SPARQL query using
 * a given SPARQL engine.
 */
export function createExecuteSparqlTool(sparqlEngine: SparqlEngine) {
  return tool({
    name: "executeSparql",
    description: "Execute a SPARQL query and return the result.",
    inputSchema: executeSparqlInputSchema,
    outputSchema: executeSparqlOutputSchema,
    execute: async ({ query }) => {
      return await sparqlEngine.executeSparql(query);
    },
  });
}
