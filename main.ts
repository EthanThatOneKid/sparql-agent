import type { ModelMessage } from "ai";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { QueryEngine } from "@comunica/query-sparql-rdfjs-lite";
import { UlidIriGenerator } from "#/tools/generate-iri/iri-generators/ulid/ulid-iri-generator.ts";
import { OramaSearchEngine } from "#/tools/search-facts/search-engines/orama/orama-search-engine.ts";
import {
  insertStoreIntoOrama,
  syncOrama,
} from "#/tools/search-facts/search-engines/orama/sync-orama.ts";
import { ComunicaSparqlEngine } from "#/tools/execute-sparql/sparql-engines/comunica/comunica-sparql-engine.ts";
import { SparqljsSparqlValidator } from "#/tools/validate-sparql/validators/sparqljs/sparqljs-sparql-validator.ts";
import { createValidateSparqlTool } from "#/tools/validate-sparql/tool.ts";
import { createGenerateAndExecuteSparqlTool } from "#/tools/generate-and-execute-sparql/tool.ts";
import type { GenerateSparqlOptions } from "#/tools/generate-sparql/generate-sparql.ts";
import { createGenerateSparqlTool } from "#/tools/generate-sparql/tool.ts";
import { createExecuteSparqlTool } from "#/tools/execute-sparql/tool.ts";
import { createGenerateIriTool } from "#/tools/generate-iri/tool.ts";
import { createSearchFactsTool } from "#/tools/search-facts/tool.ts";
import { createFilePersistedStore } from "#/n3store/persist/file.ts";
import { createFilePersistedOrama } from "#/orama/persist/file.ts";
import systemPrompt from "./prompt.md" with { type: "text" };

if (import.meta.main) {
  const { tools, persistN3Store, persistOrama } = await setup();

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
        generateAndExecuteSparql: tools.generateAndExecuteSparql,
      },
    });

    messages.push({
      role: "assistant",
      content: result.text,
    });

    console.dir(result, { depth: null });
    console.log(result.text);

    // Persist stores after each assistant response
    await persistStore(persistN3Store, persistOrama);
  }
}

async function setup() {
  const iriPrefix = "https://fartlabs.org/.well-known/genid/";
  const iriGenerator = new UlidIriGenerator(iriPrefix);

  const sparqlValidator = new SparqljsSparqlValidator();

  const { n3Store, persist: persistN3Store } = await createFilePersistedStore(
    "./store.ttl",
  );
  const { orama, wasCreated: oramaWasCreated, persist: persistOrama } =
    await createFilePersistedOrama("./orama.json");

  const searchEngine = new OramaSearchEngine(orama);

  // Only insert quads if Orama was empty or file didn't exist.
  if (oramaWasCreated) {
    await insertStoreIntoOrama(orama, n3Store);
  }

  const interceptor = syncOrama(orama, n3Store);
  const comunicaQueryEngine = new QueryEngine();
  const sparqlEngine = new ComunicaSparqlEngine({
    queryEngine: comunicaQueryEngine,
    context: { sources: [interceptor] },
  });

  const generateSparqlOptions: GenerateSparqlOptions = {
    model: google("gemini-2.5-flash"),
    tools: {
      iriGenerator,
      sparqlValidator,
      searchEngine,
      sparqlEngine,
    },
    context: {
      userIri: "https://id.etok.me/",
      assistantIri: "https://id.etok.me/agent",
      formatDate: () => new Date().toISOString(),
    },
  };

  const tools = {
    generateIri: createGenerateIriTool(iriGenerator),
    sparqlValidator: createValidateSparqlTool(sparqlValidator),
    searchFacts: createSearchFactsTool(searchEngine),
    executeSparql: createExecuteSparqlTool(sparqlEngine),
    generateSparql: createGenerateSparqlTool(generateSparqlOptions),
    generateAndExecuteSparql: createGenerateAndExecuteSparqlTool(
      generateSparqlOptions,
    ),
  };

  return {
    tools,
    persistN3Store,
    persistOrama,
  };
}

/**
 * persistStore persists both the RDF store and Orama store to disk.
 * Since they are synced via interceptor, they should be persisted together.
 */
async function persistStore(
  persistN3Store: () => Promise<void>,
  persistOrama: () => Promise<void>,
): Promise<void> {
  try {
    await Promise.all([persistN3Store(), persistOrama()]);
  } catch (error) {
    console.error("Error persisting stores:", error);
  }
}

// SPARQL context: Who is speaking, what is the reference time (time of writing), etc.
