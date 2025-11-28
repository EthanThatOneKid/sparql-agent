import type { LanguageModel } from "ai";
import { generateText, stepCountIs } from "ai";
import type { IriGenerator } from "#/tools/generate-iri/iri-generator.ts";
import { createGenerateIriTool } from "#/tools/generate-iri/tool.ts";
import type { SparqlEngine } from "#/tools/execute-sparql/sparql-engine.ts";
import { createExecuteSparqlTool } from "#/tools/execute-sparql/tool.ts";
import type { SparqlValidator } from "#/tools/validate-sparql/sparql-validator.ts";
import { createValidateSparqlTool } from "#/tools/validate-sparql/tool.ts";
import type { FactSearchEngine } from "#/tools/search-facts/fact-search-engine.ts";
import { createSearchFactsTool } from "#/tools/search-facts/tool.ts";
import sparqlSystemPrompt from "./prompt.md" with { type: "text" };

export interface GenerateSparqlOptions {
  model: LanguageModel;
  tools: GenerateSparqlTools;
  context?: GenerateSparqlContext;
}

export interface GenerateSparqlContext {
  /**
   * userIri is the IRI of the user speaking to the assistant.
   */
  userIri?: string;

  /**
   * assistantIri is the IRI of the assistant speaking to the user.
   */
  assistantIri?: string;

  /**
   * formatDate formats the time of writing the query.
   */
  formatDate?: () => string;
}

export interface GenerateSparqlTools {
  iriGenerator: IriGenerator;
  searchEngine: FactSearchEngine;
  sparqlEngine: SparqlEngine;
  sparqlValidator: SparqlValidator;
}

// TODO: Create tool `buildSparql` that generates structured output based on SPARQL.js types and avoids `validateSparql` tool.
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/ac331df94f856a6c353de171a01bddc9dcbb463b/types/sparqljs/index.d.ts
//

// TODO: Add option ontologies/vocabularies and tools that specify the terms to use and specific examples to reference.
// E.g. Schema.org, FOAF, etc.
//

/**
 * generateSparql generates a SPARQL query for a given prompt.
 */
export async function generateSparql(
  prompt: string,
  options: GenerateSparqlOptions,
) {
  const result = await generateText({
    model: options.model,
    system: sparqlSystemPrompt,
    prompt: formatPrompt(prompt, options.context),
    tools: {
      generateIri: createGenerateIriTool(options.tools.iriGenerator),
      searchFacts: createSearchFactsTool(options.tools.searchEngine),
      executeSparql: createExecuteSparqlTool(options.tools.sparqlEngine),
      validateSparql: createValidateSparqlTool(options.tools.sparqlValidator),
    },
    stopWhen: stepCountIs(100),
  });

  return result;
}

export function formatPrompt(prompt: string, context?: GenerateSparqlContext) {
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
    parts.push(`The time of writing the query is ${context.formatDate()}.`);
  }

  parts.push(`Generate a SPARQL query for the following prompt: ${prompt}`);
  return parts.join(" ");
}
