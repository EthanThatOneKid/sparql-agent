import { tool } from "ai";
import { z } from "zod/v4";
import {
  quadSchema,
  termSchema,
} from "#/rdfjs/data-model/data-model-schema.ts";

/**
 * SparqlEngine executes a SPARQL query and returns the structured result.
 */
export interface SparqlEngine {
  executeSparql: (query: string) => Promise<ExecuteSparqlOutput>;
}

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

/**
 * SparqlBindings represents a set of variable/value bindings.
 */
export type SparqlBindings = z.infer<typeof sparqlBindingsSchema>;

export const sparqlBindingsSchema = z.record(
  z.string(),
  termSchema.optional(),
);

/**
 * ExecuteSparqlOutput represents a SPARQL query output.
 */
export type ExecuteSparqlOutput = z.infer<typeof executeSparqlOutputSchema>;

export const executeSparqlOutputSchema = z.union([
  z.string(),
  z.boolean(),
  z.array(z.map(z.string(), termSchema)),
  z.array(quadSchema),
]);

/**
 * ExecuteSparqlInput represents a SPARQL query input.
 */
export type ExecuteSparqlInput = z.infer<typeof executeSparqlInputSchema>;

export const executeSparqlInputSchema = z.object({
  query: z.string(),
});
