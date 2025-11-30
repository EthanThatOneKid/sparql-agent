// Copied from:
// https://github.com/EthanThatOneKid/sparqljs-zod
//

import { z } from "zod/v4";
import {
  blankNodeSchema,
  defaultGraphSchema,
  literalSchema,
  namedNodeSchema,
  variableSchema,
} from "#/rdfjs/data-model/data-model-schema.ts";
import type {
  BgpPattern,
  GraphQuads,
  PropertyPath,
  Quads,
  QuadTerm,
  Term,
  Triple,
} from "./sparqljs.d.ts";

export const valuePatternRowSchema = z.record(
  z.string(),
  z.union([namedNodeSchema, blankNodeSchema, literalSchema, z.undefined()]),
);

export const graphOrDefaultSchema = z.object({
  type: z.literal("graph"),
  name: z.union([namedNodeSchema, z.undefined()]).optional(),
  default: z.union([z.boolean(), z.undefined()]).optional(),
});

export const copyMoveAddOperationSchema = z.object({
  type: z.union([z.literal("copy"), z.literal("move"), z.literal("add")]),
  silent: z.boolean(),
  source: graphOrDefaultSchema,
  destination: graphOrDefaultSchema,
});

export const loadOperationSchema = z.object({
  type: z.literal("load"),
  silent: z.boolean(),
  source: namedNodeSchema,
  destination: z.union([namedNodeSchema, z.literal(false)]),
});

export const createOperationSchema = z.object({
  type: z.literal("create"),
  silent: z.boolean(),
  graph: graphOrDefaultSchema,
});

export const graphReferenceSchema = graphOrDefaultSchema.extend({
  named: z.union([z.boolean(), z.undefined()]).optional(),
  all: z.union([z.boolean(), z.undefined()]).optional(),
});

export const valuesPatternSchema = z.object({
  type: z.literal("values"),
  values: z.array(valuePatternRowSchema),
});

export const negatedPropertySetSchema = z.object({
  type: z.literal("path"),
  pathType: z.literal("!"),
  items: z.array(z.union([
    namedNodeSchema,
    z.object({
      type: z.literal("path"),
      pathType: z.literal("^"),
      items: z.tuple([namedNodeSchema]),
    }),
  ])),
});

export const propertyPathSchema: z.ZodSchema<PropertyPath> = z.lazy(() =>
  z.union([
    negatedPropertySetSchema,
    z.object({
      type: z.literal("path"),
      pathType: z.union([
        z.literal("|"),
        z.literal("/"),
        z.literal("^"),
        z.literal("+"),
        z.literal("*"),
        z.literal("?"),
      ]),
      items: z.array(z.union([namedNodeSchema, propertyPathSchema])),
    }),
  ])
);

export const baseExpressionSchema = z.object({
  type: z.string(),
  distinct: z.union([z.boolean(), z.undefined()]).optional(),
});

export const clearDropOperationSchema = z.object({
  type: z.union([z.literal("clear"), z.literal("drop")]),
  silent: z.boolean(),
  graph: graphReferenceSchema,
});

export const managementOperationSchema = z.union([
  copyMoveAddOperationSchema,
  loadOperationSchema,
  createOperationSchema,
  clearDropOperationSchema,
]);

export const quadTermSchema: z.ZodSchema<QuadTerm> = z.lazy(() =>
  z.object({
    termType: z.literal("Quad"),
    value: z.literal(""),
    subject: termSchema,
    predicate: termSchema,
    object: termSchema,
    graph: termSchema,
  })
);

export const termSchema: z.ZodSchema<Term> = z.lazy(() =>
  z.union([
    variableSchema,
    namedNodeSchema,
    literalSchema,
    blankNodeSchema,
    quadTermSchema,
    defaultGraphSchema,
  ])
);

export const tripleSchema: z.ZodSchema<Triple> = z.lazy(() =>
  z.object({
    subject: z.union([
      namedNodeSchema,
      blankNodeSchema,
      variableSchema,
      quadTermSchema,
    ]),
    predicate: z.union([namedNodeSchema, variableSchema, propertyPathSchema]),
    object: termSchema,
  })
);

export const quadsSchema: z.ZodSchema<Quads> = z.lazy(() =>
  z.union([bgpPatternSchema, graphQuadsSchema])
);

export const bgpPatternSchema: z.ZodSchema<BgpPattern> = z.lazy(() =>
  z.object({
    type: z.literal("bgp"),
    triples: z.array(tripleSchema),
  })
);

export const graphQuadsSchema: z.ZodSchema<GraphQuads> = z.lazy(() =>
  z.object({
    type: z.literal("graph"),
    name: z.union([namedNodeSchema, variableSchema]),
    triples: z.array(tripleSchema),
  })
);
