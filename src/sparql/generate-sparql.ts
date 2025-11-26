import type { LanguageModel } from "ai";
import { generateText, tool } from "ai";
import { z } from "zod/v4";
import type { SparqlQueryResult } from "./schema.ts";
import { sparqlQueryResultSchema } from "./schema.ts";

export interface GenerateSparqlOptions {
  model: LanguageModel;
  prompt: string;
  validateSparql: (query: string) => boolean;
  executeSparql: (query: string) => Promise<SparqlQueryResult>;
  // searchSubjects: (query: string, topK?: number) => Promise<string[]>;
}

// TODO: Generate structured output based on SPARQL.js types.
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
      validateSparql: validateSparqlTool(options.validateSparql),
      executeSparql: executeSparqlTool(options.executeSparql),
      // searchSubjects: searchSubjectsTool(options.searchSubjects),
    },
  });
}

export const validateSparqlToolInputSchema = z.object({ query: z.string() });
export const validateSparqlToolOutputSchema = z.object({
  isValid: z.boolean(),
});

export function validateSparqlTool(validateSparql: (query: string) => boolean) {
  return tool({
    name: "validateSparql",
    description: "Validate a SPARQL query",
    inputSchema: validateSparqlToolInputSchema,
    outputSchema: validateSparqlToolOutputSchema,
    execute: ({ query }) => {
      return { isValid: validateSparql(query) };
    },
  });
}

export const executeSparqlToolInputSchema = z.object({ query: z.string() });

// TODO: Rename to querySparqlTool because it is a readonly operation.
export function executeSparqlTool(
  executeSparql: (query: string) => Promise<SparqlQueryResult>,
) {
  return tool({
    name: "executeSparql",
    description: "Execute a SPARQL query",
    inputSchema: z.object({ query: z.string() }),
    outputSchema: sparqlQueryResultSchema,
    execute: async ({ query }) => {
      return await executeSparql(query);
    },
  });
}

export const searchSubjectsToolInputSchema = z.object({
  query: z.string(),
  topK: z.number().optional(),
});

export const searchSubjectsToolOutputSchema = z.object({
  subjects: z.array(z.string()),
});

export function searchSubjectsTool(
  searchSubjects: (query: string, topK?: number) => Promise<string[]>,
) {
  return tool({
    name: "searchSubjects",
    description: "Search for subjects that are relevant to the query",
    inputSchema: searchSubjectsToolInputSchema,
    outputSchema: searchSubjectsToolOutputSchema,
    execute: async ({ query, topK }) => {
      const subjects = await searchSubjects(query, topK);
      return { subjects };
    },
  });
}
