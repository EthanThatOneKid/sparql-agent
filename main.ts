import type { ModelMessage } from "ai";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { QueryEngine } from "@comunica/query-sparql-rdfjs-lite";
import { Store } from "n3";
import { UlidIriGenerator } from "#/tools/generate-iri/iri-generators/ulid/ulid-iri-generator.ts";
import {
  createFactOrama,
  OramaSearchEngine,
} from "#/tools/search-facts/search-engines/orama/orama-search-engine.ts";
import { syncOrama } from "#/tools/search-facts/search-engines/orama/sync-orama.ts";
import { ComunicaSparqlEngine } from "#/tools/execute-sparql/sparql-engines/comunica/comunica-sparql-engine.ts";
import { SparqljsSparqlValidator } from "#/tools/validate-sparql/validators/sparqljs/sparqljs-sparql-validator.ts";
import { createExecuteSparqlTool } from "#/tools/execute-sparql/tool.ts";
import { createValidateSparqlTool } from "#/tools/validate-sparql/tool.ts";
import { createGenerateSparqlTool } from "#/tools/generate-sparql/tool.ts";
import { createGenerateIriTool } from "#/tools/generate-iri/tool.ts";
import { createSearchFactsTool } from "#/tools/search-facts/tool.ts";
import systemPrompt from "./prompt.md" with { type: "text" };

const tools = createTools();

function createTools() {
  const iriPrefix = "https://fartlabs.org/.well-known/genid/";
  const iriGenerator = new UlidIriGenerator(iriPrefix);

  const sparqlValidator = new SparqljsSparqlValidator();

  const oramaStore = createFactOrama();
  const searchEngine = new OramaSearchEngine(oramaStore);

  // TODO: Use a real RDF/JS store that syncs with disk.
  const rdfStore = new Store();
  const interceptor = syncOrama(rdfStore, oramaStore);
  const comunicaQueryEngine = new QueryEngine();
  const sparqlEngine = new ComunicaSparqlEngine({
    queryEngine: comunicaQueryEngine,
    context: { sources: [interceptor] },
  });

  return {
    generateIri: createGenerateIriTool(iriGenerator),
    sparqlValidator: createValidateSparqlTool(sparqlValidator),
    searchFacts: createSearchFactsTool(searchEngine),
    executeSparql: createExecuteSparqlTool(sparqlEngine),
    generateSparql: createGenerateSparqlTool({
      model: google("gemini-2.5-flash"),
      tools: {
        iriGenerator,
        sparqlValidator,
        searchEngine,
        sparqlEngine,
      },
    }),
  };
}

if (import.meta.main) {
  const messages: ModelMessage[] = [];
  while (true) {
    const promptText = prompt(">");
    if (!promptText) {
      continue;
    }

    if (promptText === "exit") {
      break;
    }

    messages.push({
      role: "user",
      content: promptText,
    });

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages,
      tools: {
        generateSparql: tools.generateSparql,
        executeSparql: tools.executeSparql,
      },
    });

    messages.push({
      role: "assistant",
      content: result.text,
    });

    console.log(result.text);
  }
}

// SPARQL context: Who is speaking, what is the reference time (time of writing), etc.
