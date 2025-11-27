import { z } from "zod/v4";

/**
 * IriGenerator generates a unique IRI for an entity.
 */
export interface IriGenerator {
  generateIri: () => string;
}

export const generateIriInputSchema = z.object({
  name: z.string(),
});

export const generateIriOutputSchema = z.object({
  iri: z.string(),
});
