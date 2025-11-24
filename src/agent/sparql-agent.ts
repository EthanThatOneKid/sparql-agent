import type { LanguageModel } from "ai";
import { generateText } from "ai";

export interface GenerateSparqlOptions {
  model: LanguageModel;
  prompt: string;
}

export async function generateSparql(options: GenerateSparqlOptions) {
  return await generateText({
    model: options.model,
    prompt: options.prompt,
    system: "You are a helpful assistant that generates SPARQL queries.",
  });
}

// TODO: Generate structured data based on SPARQL.js types.
