import type { LanguageModel } from "ai";
import { generateText } from "ai";
import type { IriGenerator } from "./tools/generate-iri/iri-generator.ts";
import { createGenerateIriTool } from "./tools/generate-iri/tool.ts";
import type { SparqlEngine } from "./tools/execute-sparql/sparql-engine.ts";
import { createExecuteSparqlTool } from "./tools/execute-sparql/tool.ts";
import type { SparqlValidator } from "./tools/validate-sparql/sparql-validator.ts";
import { createValidateSparqlTool } from "./tools/validate-sparql/tool.ts";
import type { FactSearchEngine } from "./tools/search-facts/fact-search-engine.ts";
import { createSearchFactsTool } from "./tools/search-facts/tool.ts";

export interface GenerateSparqlOptions {
  model: LanguageModel;
  prompt: string;
  tools: GenerateSparqlTools;
}

export interface GenerateSparqlTools {
  iriGenerator: IriGenerator;
  searchEngine: FactSearchEngine;
  sparqlEngine: SparqlEngine;
  sparqlValidator: SparqlValidator;
}

// TODO: Create tool that generates structured output based on SPARQL.js types and avoids `validateSparql` tool.
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/ac331df94f856a6c353de171a01bddc9dcbb463b/types/sparqljs/index.d.ts
//

/**
 * generateSparql generates a SPARQL query for a given prompt.
 */
export async function generateSparql(options: GenerateSparqlOptions) {
  return await generateText({
    model: options.model,
    prompt:
      `Generate a SPARQL query for the following prompt: ${options.prompt}`,
    system:
      `You are a helpful assistant that generates a SPARQL query for a given prompt.
    Always use the \`validateSparql\` tool to validate the query.
    Return the query only if it is valid, otherwise try again.`,
    tools: {
      generateIri: createGenerateIriTool(options.tools.iriGenerator),
      searchFacts: createSearchFactsTool(options.tools.searchEngine),
      executeSparql: createExecuteSparqlTool(options.tools.sparqlEngine),
      validateSparql: createValidateSparqlTool(options.tools.sparqlValidator),
    },
  });
}
