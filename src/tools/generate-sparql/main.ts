import { google } from "@ai-sdk/google";
import { generateSparql } from "./generate-sparql.ts";
import type { GenerateSparqlOptions } from "./generate-sparql.ts";
import type { IriGenerator } from "#/tools/generate-iri/iri-generator.ts";
import type { FactSearchEngine } from "#/tools/search-facts/fact-search-engine.ts";
import type { SparqlEngine } from "#/tools/execute-sparql/sparql-engine.ts";
import type { SparqlValidator } from "#/tools/validate-sparql/sparql-validator.ts";

/**
 * Minimal tool implementations -----------------------------------------------
 *
 * These no-op implementations keep the demo self-contained. Swap any of them
 * with the real engines (Orama search, Comunica SPARQL, persisted stores, etc.)
 * when you want production behavior.
 */
class DemoIriGenerator implements IriGenerator {
  constructor(private readonly prefix: string) {}

  generateIri() {
    return `${this.prefix}${crypto.randomUUID()}`;
  }
}

class NoopFactSearchEngine implements FactSearchEngine {
  async searchFacts() {
    return await Promise.resolve([]);
  }
}

class NoopSparqlEngine implements SparqlEngine {
  async executeSparql() {
    return await Promise.resolve({ result: [] });
  }
}

class LenientSparqlValidator implements SparqlValidator {
  validateSparql() {
    return true;
  }
}

async function run() {
  const options: GenerateSparqlOptions = {
    model: google("gemini-2.5-flash"),
    tools: {
      iriGenerator: new DemoIriGenerator(
        "https://example.org/.well-known/genid/",
      ),
      searchEngine: new NoopFactSearchEngine(),
      sparqlEngine: new NoopSparqlEngine(),
      sparqlValidator: new LenientSparqlValidator(),
    },
    context: {
      userIri: "https://example.org/users/demo",
      assistantIri: "https://example.org/agents/demo",
      formatDate: () => new Date().toISOString(),
    },
  };

  const promptText = prompt(
    "Describe the fact you want to capture (press Enter for a default example):",
  ) || "My favorite color is green.";

  console.log("\nGenerating SPARQL query...");
  const result = await generateSparql(promptText, options);

  if (!result.text.trim()) {
    console.warn(
      "The language model did not return text. Full response:",
      result,
    );
    return;
  }

  console.log("\nNatural-language prompt:");
  console.log(promptText);
  console.log("\nGenerated SPARQL:");
  console.log(result.text);
}

if (import.meta.main) {
  run().catch((error) => {
    console.error("Failed to generate SPARQL:", error);
    Deno.exit(1);
  });
}
