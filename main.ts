import type { ModelMessage } from "ai";
import { generateText, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { QueryEngine } from "@comunica/query-sparql-rdfjs-lite";
import { UlidIriGenerator } from "#/tools/generate-iri/iri-generators/ulid/ulid-iri-generator.ts";
import { OramaSearchEngine } from "#/tools/search-facts/search-engines/orama/orama-search-engine.ts";
import {
  insertStoreIntoOrama,
  syncOrama,
} from "#/tools/search-facts/search-engines/orama/sync-orama.ts";
import { ComunicaSparqlEngine } from "#/tools/execute-sparql/sparql-engines/comunica/comunica-sparql-engine.ts";
import { createFilePersistedStore } from "#/n3store/persist/file.ts";
import { createFilePersistedOrama } from "#/tools/search-facts/search-engines/orama/persist.ts";
import systemPrompt from "./prompt.md" with { type: "text" };
import { createSparqlTools } from "#/tools/sparql-tools.ts";

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
      tools,
      stopWhen: stepCountIs(100),
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

  const tools = createSparqlTools({
    sparqlEngine,
    searchEngine,
    iriGenerator,
  });

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
