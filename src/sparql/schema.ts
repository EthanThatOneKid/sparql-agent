import { z } from "zod/v4";

/**
 * RDFTerm represents an RDF term.
 */
export type RDFTerm = z.infer<typeof rdfTermSchema>;

export const rdfTermSchema = z.object({
  termType: z.enum([
    "NamedNode",
    "BlankNode",
    "Literal",
    "Variable",
    "DefaultGraph",
  ]),
  value: z.string(),
  language: z.string().optional(),
  datatype: z.string().optional(),
});

/**
 * RDFQuad represents an RDF quad/triple.
 */
export type RDFQuad = z.infer<typeof rdfQuadSchema>;

export const rdfQuadSchema = z.object({
  subject: rdfTermSchema,
  predicate: rdfTermSchema,
  object: rdfTermSchema,
  graph: rdfTermSchema.optional(),
});

/**
 * SparqlBindings represents a set of variable/value bindings.
 */
export type SparqlBindings = z.infer<typeof sparqlBindingsSchema>;

export const sparqlBindingsSchema = z.record(
  z.string(),
  rdfTermSchema.optional(),
);

/**
 * SparqlBindingsResult represents a SELECT query result (bindings output).
 */
export type SparqlBindingsResult = z.infer<typeof sparqlBindingsResultSchema>;

export const sparqlBindingsResultSchema = z.object({
  type: z.literal("bindings"),
  bindings: z.array(sparqlBindingsSchema),
});

/**
 * SparqlQuadsResult represents a CONSTRUCT or DESCRIBE query result (quads output).
 */
export type SparqlQuadsResult = z.infer<typeof sparqlQuadsResultSchema>;

export const sparqlQuadsResultSchema = z.object({
  type: z.literal("quads"),
  quads: z.array(rdfQuadSchema),
});

/**
 * SparqlBooleanResult represents an ASK query result (boolean output).
 */
export type SparqlBooleanResult = z.infer<typeof sparqlBooleanResultSchema>;

export const sparqlBooleanResultSchema = z.object({
  type: z.literal("boolean"),
  boolean: z.boolean(),
});

/**
 * SparqlVoidResult represents an UPDATE query result (void output).
 */
export type SparqlVoidResult = z.infer<typeof sparqlVoidResultSchema>;

export const sparqlVoidResultSchema = z.object({
  type: z.literal("void"),
  success: z.boolean(),
  message: z.string().optional(),
});

/**
 * SparqlQueryResult represents a SPARQL query result.
 */
export type SparqlQueryResult = z.infer<typeof sparqlQueryResultSchema>;

export const sparqlQueryResultSchema = z.discriminatedUnion("type", [
  sparqlBindingsResultSchema,
  sparqlQuadsResultSchema,
  sparqlBooleanResultSchema,
  sparqlVoidResultSchema,
]);
