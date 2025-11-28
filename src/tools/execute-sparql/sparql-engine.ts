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
    z.array(z.map(z.string(), termSchema)),
    z.array(quadSchema),
  ]).describe(
    "The result of executing the SPARQL query (string for DESCRIBE, boolean for ASK, array of bindings for SELECT, array of quads for CONSTRUCT)",
  ),
});

/**
 * ExecuteSparqlInput represents a SPARQL query input.
 */
export type ExecuteSparqlInput = z.infer<typeof executeSparqlInputSchema>;

export const executeSparqlInputSchema = z.object({
  query: z.string().describe("The SPARQL query to execute."),
});
