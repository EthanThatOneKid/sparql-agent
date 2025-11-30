import { z } from "zod/v4";

/**
 * IriGenerator generates a unique IRI for an entity.
 */
export interface IriGenerator {
  generateIri: () => string;
}

export const generateIriInputSchema = z.object({
  name: z.string().optional().describe(
    "Optional name or description of the entity (for logging/debugging purposes). The IRI generation doesn't depend on this value.",
  ),
});

export const generateIriOutputSchema = z.object({
  iri: z.string().describe(
    "A unique IRI that can be used as a subject or object in SPARQL queries. Use this IRI when creating new entities with INSERT queries.",
  ),
});
