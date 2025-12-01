import { tool } from "ai";
import type { FactSearchEngine } from "./fact-search-engine.ts";
import {
  searchFactsInputSchema,
  searchFactsOutputSchema,
} from "./fact-search-engine.ts";

export function createSearchFactsTool(searchEngine: FactSearchEngine) {
  return tool({
    name: "search_facts",
    description:
      "Search for facts in the knowledge base using full-text and vector search. Use this to find entities when you don't know their exact IRI or to explore broad topics.",
    inputSchema: searchFactsInputSchema,
    outputSchema: searchFactsOutputSchema,
    execute: async ({ query, limit }) => {
      return await searchEngine.searchFacts(query, limit ?? 10);
    },
  });
}
