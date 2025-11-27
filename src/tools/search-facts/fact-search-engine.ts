import { z } from "zod/v4";

/**
 * FactSearchEngine searches for facts and returns the structured result.
 */
export interface FactSearchEngine {
  searchFacts: (query: string, limit: number) => Promise<SearchFactsOutput>;
}

/**
 * SearchFactsInput represents a search for facts input.
 */
export type SearchFactsInput = z.infer<typeof searchFactsInputSchema>;

export const searchFactsInputSchema = z.object({
  query: z.string(),
  limit: z.number().min(1).max(100).optional(),
});

/**
 * SearchFactsOutput represents a search for facts output.
 */
export type SearchFactsOutput = z.infer<typeof searchFactsOutputSchema>;

export const searchFactsOutputSchema = z.array(z.object({
  subject: z.string(),
  predicate: z.string(),
  object: z.string(),
  score: z.number(),
}));
