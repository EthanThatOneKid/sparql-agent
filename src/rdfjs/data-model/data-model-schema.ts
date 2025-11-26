// Copied from:
// https://github.com/EthanThatOneKid/rdfjs-schema/blob/0835f8e07abf50cc3023e5b0cc4829e86ea7072b/src/rdfjs/data-model-schema.ts
//

import { z } from "zod/v4";
import {
  type BaseQuad,
  type Quad,
  type Quad_Object,
  type Quad_Subject,
  type Term,
} from "./data-model-schema.d.ts";

export const namedNodeSchema = z.object({
  termType: z.literal("NamedNode"),
  value: z.string(),
});

export const blankNodeSchema = z.object({
  termType: z.literal("BlankNode"),
  value: z.string(),
});

export const literalSchema = z.object({
  termType: z.literal("Literal"),
  value: z.string(),
  language: z.string(),
  direction: z.union([z.literal("ltr"), z.literal("rtl"), z.literal("")])
    .optional().nullable(),
  datatype: namedNodeSchema,
});

export const variableSchema = z.object({
  termType: z.literal("Variable"),
  value: z.string(),
});

export const defaultGraphSchema = z.object({
  termType: z.literal("DefaultGraph"),
  value: z.literal(""),
});

export const quadPredicateSchema = z.union([namedNodeSchema, variableSchema]);

export const quadGraphSchema = z.union([
  defaultGraphSchema,
  namedNodeSchema,
  blankNodeSchema,
  variableSchema,
]);

export const directionalLanguageSchema = z.object({
  language: z.string(),
  direction: z.union([z.literal("ltr"), z.literal("rtl"), z.literal("")])
    .optional().nullable(),
});

export const termSchema: z.ZodSchema<Term> = z.lazy(() =>
  z.union([
    namedNodeSchema,
    blankNodeSchema,
    literalSchema,
    variableSchema,
    defaultGraphSchema,
    baseQuadSchema,
  ])
);

export const baseQuadSchema: z.ZodSchema<BaseQuad> = z.lazy(() =>
  z.object({
    termType: z.literal("Quad"),
    value: z.literal(""),
    subject: termSchema,
    predicate: termSchema,
    object: termSchema,
    graph: termSchema,
  })
);

export const quadSubjectSchema: z.ZodSchema<Quad_Subject> = z.lazy(() =>
  z.union([namedNodeSchema, blankNodeSchema, quadSchema, variableSchema])
);

export const quadSchema: z.ZodSchema<Quad> = z.lazy(() =>
  baseQuadSchema.and(z.object({
    subject: quadSubjectSchema,
    predicate: quadPredicateSchema,
    object: quadObjectSchema,
    graph: quadGraphSchema,
  }))
);

export const quadObjectSchema: z.ZodSchema<Quad_Object> = z.lazy(() =>
  z.union([
    namedNodeSchema,
    literalSchema,
    blankNodeSchema,
    quadSchema,
    variableSchema,
  ])
);
