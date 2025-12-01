import { Store } from "@rdfjs/types";
import { QueryEngine } from "@comunica/query-sparql-rdfjs-lite";
import { UlidIriGenerator } from "#/tools/generate-iri/iri-generators/ulid/ulid-iri-generator.ts";
import type { FactOrama } from "#/tools/search-facts/search-engines/orama/orama-search-engine.ts";
import { OramaSearchEngine } from "#/tools/search-facts/search-engines/orama/orama-search-engine.ts";
import {
  insertStoreIntoOrama,
  syncOrama,
} from "#/tools/search-facts/search-engines/orama/sync-orama.ts";
import { ComunicaSparqlEngine } from "#/sparql-engine/sparql-engines/comunica/comunica-sparql-engine.ts";
import { createFilePersistedStore } from "#/n3/persist-file.ts";
import { createFilePersistedOrama } from "#/tools/search-facts/search-engines/orama/persist.ts";
import { createSparqlTools } from "#/tools/sparql-tools.ts";

export async function setup() {
  const { store, orama, persist } = await setupStores();
  const { sparqlEngine } = setupSparqlEngine(store);
  const { searchEngine } = setupSearchEngine(orama);
  const { iriGenerator } = setupIriGenerator();

  const tools = createSparqlTools({
    sparqlEngine,
    searchEngine,
    iriGenerator,
  });

  return { tools, persist };
}

// SPARQL context: Who is speaking, what is the reference time (time of writing), etc.

function setupIriGenerator() {
  const iriPrefix = "https://fartlabs.org/.well-known/genid/";
  return { iriGenerator: new UlidIriGenerator(iriPrefix) };
}

function setupSparqlEngine(store: Store) {
  const comunicaQueryEngine = new QueryEngine();
  const sparqlEngine = new ComunicaSparqlEngine({
    queryEngine: comunicaQueryEngine,
    context: { sources: [store] },
  });
  return { sparqlEngine };
}

function setupSearchEngine(orama: FactOrama) {
  const searchEngine = new OramaSearchEngine(orama);
  return { searchEngine };
}

async function setupStores() {
  const { n3Store, persist: persistN3Store } = await createFilePersistedStore(
    "./store.ttl",
  );

  const { orama, wasCreated, persist: persistOrama } =
    await createFilePersistedOrama("./orama.json");

  // Only insert quads if Orama was empty or file didn't exist.
  if (wasCreated) {
    await insertStoreIntoOrama(orama, n3Store);
  }

  const store = syncOrama(orama, n3Store);
  return {
    store,
    n3Store,
    orama,
    persist: () => Promise.all([persistN3Store(), persistOrama()]),
  };
}
