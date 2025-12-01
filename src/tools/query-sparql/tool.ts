import { tool } from "ai";
import type { SparqlEngine } from "#/sparql-engine/sparql-engine.ts";
import {
  executeSparqlOutputSchema,
  readSparqlInputSchema,
} from "#/sparql-engine/sparql-engine.ts";

/**
 * createQuerySparqlTool creates a tool that executes read-only SPARQL queries.
 */
export function createQuerySparqlTool(sparqlEngine: SparqlEngine) {
  return tool({
    name: "query_sparql",
    description: `Execute a READ-ONLY SPARQL query against the knowledge base.
Use this tool to:
- Research existing data and schema structure
- Find existing entities before creating new ones
- Verify if facts already exist
- Supports: SELECT, ASK, CONSTRUCT, DESCRIBE`,
    inputSchema: readSparqlInputSchema,
    outputSchema: executeSparqlOutputSchema,
    execute: async ({ query }) => {
      // In a more advanced implementation, you could enforce read-only logic here
      return await sparqlEngine.executeSparql(query);
    },
  });
}
