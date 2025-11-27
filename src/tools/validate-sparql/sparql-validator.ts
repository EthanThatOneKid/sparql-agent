import { z } from "zod/v4";

/**
 * SparqlValidator validates a SPARQL query.
 */
export interface SparqlValidator {
  validateSparql: (query: string) => boolean;
}

export const validateSparqlInputSchema = z.object({
  query: z.string(),
});

export const validateSparqlOutputSchema = z.object({
  success: z.boolean(),
});
