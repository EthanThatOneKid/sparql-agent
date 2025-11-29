import type { SparqlEngine } from "#/tools/execute-sparql/sparql-engine.ts";
import { createExecuteSparqlTool } from "#/tools/execute-sparql/tool.ts";
import type { FactSearchEngine } from "#/tools/search-facts/fact-search-engine.ts";
import { createSearchFactsTool } from "#/tools/search-facts/tool.ts";
import type { IriGenerator } from "#/tools/generate-iri/iri-generator.ts";
import { createGenerateIriTool } from "#/tools/generate-iri/tool.ts";

export interface SparqlOptions {
  sparqlEngine: SparqlEngine;
  searchEngine: FactSearchEngine;
  iriGenerator: IriGenerator;
}

export function createSparqlTools(options: SparqlOptions) {
  return {
    sparqlEngine: createExecuteSparqlTool(options.sparqlEngine),
    searchEngine: createSearchFactsTool(options.searchEngine),
    iriGenerator: createGenerateIriTool(options.iriGenerator),
  };
}
