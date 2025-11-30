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
    description:
      `Execute a SPARQL query against the knowledge base and return structured results. Use this tool to:
- Research existing data: Run SELECT, ASK, CONSTRUCT, or DESCRIBE queries to explore the knowledge base structure and find existing entities, properties, and relationships
- Modify the knowledge base: Run INSERT, UPDATE, or DELETE queries to add, modify, or remove information
- Answer questions: Query the knowledge base to retrieve information needed to answer user questions

The result format depends on the query type:
- SELECT: Returns an array of binding objects (variable/value pairs)
- ASK: Returns a boolean
- CONSTRUCT: Returns an array of RDF quads (subject, predicate, object, graph)
- DESCRIBE: Returns a string representation of the described resource`,
    inputSchema: executeSparqlInputSchema,
    outputSchema: executeSparqlOutputSchema,
    execute: async ({ query }) => {
      return await sparqlEngine.executeSparql(query);
    },
  });
}
