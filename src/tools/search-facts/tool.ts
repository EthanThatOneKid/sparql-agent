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
    description:
      `Search the knowledge base for existing facts and entities using full-text and semantic search. Use this tool BEFORE creating new entities to:
- Check if an entity already exists (avoid duplicates)
- Find existing IRIs for entities mentioned in user queries
- Discover related facts and relationships
- Understand the structure of existing data before generating SPARQL queries

Returns matching facts with relevance scores. Each fact includes subject, predicate, object, and a score (higher = more relevant). Use the subject IRIs from results when building SPARQL queries for existing entities.`,
    inputSchema: searchFactsInputSchema,
    outputSchema: searchFactsOutputSchema,
    execute: async ({ query, limit = 10 }) => {
      return await searchEngine.searchFacts(query, limit);
    },
  });
}
