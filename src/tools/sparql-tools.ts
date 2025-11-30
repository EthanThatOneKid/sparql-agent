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
    executeSparql: createExecuteSparqlTool(options.sparqlEngine),
    searchFacts: createSearchFactsTool(options.searchEngine),
    generateIri: createGenerateIriTool(options.iriGenerator),
  };
}

export interface SparqlPromptContext {
  userIri: string;
  assistantIri: string;
  formatDate: () => string;
}

export function formatSparqlPrompt(
  prompt: string,
  context?: SparqlPromptContext,
) {
  const parts: string[] = [];
  if (context?.userIri) {
    parts.push(
      `The user's IRI is <${context.userIri}>. When the prompt references the user (explicitly or implicitly through first-person pronouns such as "me", "I", "we", etc.), use this IRI to represent the user in the generated SPARQL query.`,
    );
  }

  if (context?.assistantIri) {
    parts.push(
      `The assistant's IRI is <${context.assistantIri}>. When the prompt references the assistant (explicitly or implicitly through second-person pronouns such as "you", "your", "yours", etc.), use this IRI to represent the assistant in the generated SPARQL query.`,
    );
  }

  if (context?.formatDate) {
    parts.push(
      `The time of writing the SPARQL query is ${context.formatDate()}.`,
    );
  }

  parts.push(`Generate a SPARQL query for the following prompt:\n\n${prompt}`);
  return parts.join(" ");
}
