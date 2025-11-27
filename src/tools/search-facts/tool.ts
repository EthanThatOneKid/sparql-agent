import { tool } from "ai";
import type { FactSearchEngine } from "./fact-search-engine.ts";
import {
  searchFactsInputSchema,
  searchFactsOutputSchema,
} from "./fact-search-engine.ts";

/**
 * createSearchFactsTool creates a tool that searches for facts using
 * a given fact search engine.
 */
export function createSearchFactsTool(
  searchEngine: FactSearchEngine,
) {
  return tool({
    name: "searchFacts",
    description: "Search for facts and return the result.",
    inputSchema: searchFactsInputSchema,
    outputSchema: searchFactsOutputSchema,
    execute: async ({ query, limit = 10 }) => {
      return await searchEngine.searchFacts(query, limit);
    },
  });
}
