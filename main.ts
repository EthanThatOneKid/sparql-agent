import { google } from "@ai-sdk/google";
import { MemoryLevel } from "memory-level";
import DataFactory from "@rdfjs/data-model";
import { QueryEngine } from "@comunica/query-sparql-rdfjs-lite";
import type { QueryAlgebraContext } from "@comunica/types";
import { Quadstore } from "quadstore";
import { generateSparql } from "#/generate-sparql.ts";
import { UlidIriGenerator } from "#/tools/generate-iri/ulid.ts";
import {
  createOramaTripleStore,
  OramaFactSearchEngine,
} from "#/tools/search-facts/engines/orama/orama.ts";
import { ComunicaSparqlEngine } from "#/tools/execute-sparql/comunica.ts";
import { SparqljsSparqlValidator } from "#/tools/validate-sparql/sparqljs.ts";
import { StoreInterceptor } from "#/rdfjs/store/interceptor/interceptor.ts";
import { syncStoreInterceptorWithOrama } from "#/rdfjs/store/interceptor/orama.ts";

if (import.meta.main) {
  const iriPrefix = "https://fartlabs.org/.well-known/genid/";
  const oramaStore = createOramaTripleStore();

  // Set up Quadstore.
  const backend = new MemoryLevel();
  const quadstore = new Quadstore({ backend, dataFactory: DataFactory });
  await quadstore.open();

  // Wrap Quadstore with StoreInterceptor for observability.
  const interceptor = new StoreInterceptor(quadstore);

  // Set up synchronization between the interceptor and Orama store.
  const cleanupSync = syncStoreInterceptorWithOrama(interceptor, oramaStore);

  // Set up Comunica query engine using the interceptor (not the raw store).
  const queryEngine = new QueryEngine();
  const context: QueryAlgebraContext = { sources: [interceptor] };

  const result = await generateSparql({
    model: google("gemini-2.5-flash"),
    prompt: "Met up with Nancy at Crêpes de Paris Inc cafe.",
    tools: {
      iriGenerator: new UlidIriGenerator(iriPrefix),
      factSearchEngine: new OramaFactSearchEngine(oramaStore),
      sparqlEngine: new ComunicaSparqlEngine(
        queryEngine,
        context,
      ),
      sparqlValidator: new SparqljsSparqlValidator(),
    },
  });

  console.dir(result, { depth: null });

  // Clean up.
  cleanupSync();
  await quadstore.close();
}

// SPARQL context: Who is speaking, what is the reference time (time of writing), etc.
