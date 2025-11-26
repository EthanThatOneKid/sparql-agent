import { create, search } from "@orama/orama";
import type {
  FactSearchEngine,
  SearchFactsOutput,
} from "#/tools/search-facts/tool.ts";

/**
 * OramaFactSearchEngine is a fact search engine that uses Orama.
 */
export class OramaFactSearchEngine implements FactSearchEngine {
  public constructor(
    private readonly orama: OramaTripleStore,
  ) {}

  public async searchFacts(
    query: string,
    limit: number,
  ): Promise<SearchFactsOutput> {
    const results = await search(this.orama, {
      term: query,
      limit,
      properties: ["object"],
    });

    return results.hits.map((hit) => {
      return {
        subject: hit.document.subject,
        predicate: hit.document.predicate,
        object: hit.document.object,
        score: hit.score,
      };
    });
  }
}

/**
 * OramaTripleStore is an Orama triple store for RDF triples.
 */
export type OramaTripleStore = ReturnType<typeof createOramaTripleStore>;

/**
 * createOramaTripleStore creates an Orama triple store.
 */
export function createOramaTripleStore() {
  return create({
    schema: {
      subject: "string",
      predicate: "string",
      object: "string",
      graph: "string",
    },
  });
}
