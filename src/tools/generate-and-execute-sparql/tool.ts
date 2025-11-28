import { tool } from "ai";
import { z } from "zod/v4";
import type { GenerateSparqlOptions } from "#/tools/generate-sparql/generate-sparql.ts";
import { generateSparql } from "#/tools/generate-sparql/generate-sparql.ts";
import { generateSparqlInputSchema } from "#/tools/generate-sparql/tool.ts";
import {
  executeSparqlInputSchema,
  executeSparqlOutputSchema,
} from "#/tools/execute-sparql/sparql-engine.ts";

export const generateAndExecuteSparqlOutputSchema = z.intersection(
  executeSparqlInputSchema,
  executeSparqlOutputSchema,
);

/**
 * createGenerateAndExecuteSparqlTool creates a tool that generates
 * and executes SPARQL queries. If the input is already valid SPARQL, it executes
 * directly. Otherwise, it generates SPARQL from natural language first.
 */
export function createGenerateAndExecuteSparqlTool(
  options: GenerateSparqlOptions,
) {
  return tool({
    name: "generateAndExecuteSparql",
    description:
      "Generates a SPARQL query from natural language (or uses the input if it's already SPARQL) and executes it against the knowledge base. Returns both the query and the execution result.",
    inputSchema: generateSparqlInputSchema,
    outputSchema: generateAndExecuteSparqlOutputSchema,
    execute: async ({ prompt }) => {
      const result = await generateSparql(prompt, options);
      const executeResult = await options.tools.sparqlEngine
        .executeSparql(result.text);

      return {
        query: result.text,
        result: executeResult.result,
      };
    },
  });
}
