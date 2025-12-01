import { tool } from "ai";
import type { SparqlEngine } from "#/sparql-engine/sparql-engine.ts";
import {
  executeSparqlOutputSchema,
  modifySparqlInputSchema,
} from "#/sparql-engine/sparql-engine.ts";

/**
 * createUpdateSparqlTool creates a tool that executes modification SPARQL queries.
 */
export function createUpdateSparqlTool(sparqlEngine: SparqlEngine) {
  return tool({
    name: "update_sparql",
    description:
      `Execute a MODIFICATION SPARQL query against the knowledge base.
Use this tool to:
- Insert new facts (INSERT DATA, INSERT {})
- Delete obsolete facts (DELETE DATA, DELETE {})
- Update information
- Supports: INSERT, DELETE, LOAD, CLEAR`,
    inputSchema: modifySparqlInputSchema,
    outputSchema: executeSparqlOutputSchema,
    execute: async ({ query }) => {
      return await sparqlEngine.executeSparql(query);
    },
  });
}
