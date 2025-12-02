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

export const executeSparqlOutputSchema = z.object({
  result: z.union([
    z.string(),
    z.boolean(),
    z.array(sparqlBindingsSchema),
    z.array(quadSchema),
  ]).describe(
    "The query result: string for DESCRIBE queries, boolean for ASK queries, array of variable bindings for SELECT queries, or array of RDF quads for CONSTRUCT queries.",
  ),
});

export const querySparqlInputSchema = z.object({
  query: z.string().describe(
    "A read-only SPARQL query (SELECT, ASK, CONSTRUCT, DESCRIBE). Use this to research the graph structure, find existing entities, or check properties. DO NOT use INSERT/DELETE here.",
  ),
});

export const updateSparqlInputSchema = z.object({
  query: z.string().describe(
    "A modification SPARQL query (INSERT, DELETE, LOAD, CLEAR). Use this to persist new facts or update existing ones. Ensure you have validated the schema and prefixes before executing.",
  ),
});
