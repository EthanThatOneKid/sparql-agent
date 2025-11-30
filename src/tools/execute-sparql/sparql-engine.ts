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
    "The query result: string for DESCRIBE queries, boolean for ASK queries, array of variable bindings for SELECT queries (each binding is an object with variable names as keys and RDF terms as values), or array of RDF quads for CONSTRUCT queries.",
  ),
});

/**
 * ExecuteSparqlInput represents a SPARQL query input.
 */
export type ExecuteSparqlInput = z.infer<typeof executeSparqlInputSchema>;

export const executeSparqlInputSchema = z.object({
  query: z.string().describe(
    "A complete SPARQL query string. Supports SELECT, ASK, CONSTRUCT, DESCRIBE (read-only), and INSERT, UPDATE, DELETE (modification). Use standard vocabularies (Schema.org, FOAF, RDF, etc.) and include PREFIX declarations for any vocabularies used.",
  ),
});
