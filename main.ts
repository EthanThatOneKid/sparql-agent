import { google } from "@ai-sdk/google";
import { QueryEngine } from "@comunica/query-sparql-rdfjs-lite";
import { Store } from "n3";
import type { QueryAlgebraContext } from "@comunica/types";
import { generateSparql } from "#/generate-sparql.ts";
import { UlidIriGenerator } from "#/tools/generate-iri/iri-generators/ulid/ulid-iri-generator.ts";
import {
  createFactOrama,
  OramaSearchEngine,
} from "#/tools/search-facts/search-engines/orama/orama-search-engine.ts";
import { syncOrama } from "#/tools/search-facts/search-engines/orama/sync-orama.ts";
import { ComunicaSparqlEngine } from "#/tools/execute-sparql/sparql-engines/comunica/comunica-sparql-engine.ts";
import { SparqljsSparqlValidator } from "#/tools/validate-sparql/validators/sparqljs/sparqljs-sparql-validator.ts";

if (import.meta.main) {
  const iriPrefix = "https://fartlabs.org/.well-known/genid/";
  const oramaStore = createFactOrama();

  // Set up an in-memory RDF/JS store (N3) and wrap it with Orama sync.
  const rdfStore = new Store();
  const interceptor = syncOrama(rdfStore, oramaStore);

  // Set up Comunica query engine using the interceptor (not the raw store).
  const queryEngine = new QueryEngine();
  const context: QueryAlgebraContext = { sources: [interceptor] };

  const result = await generateSparql({
    model: google("gemini-2.5-flash"),
    prompt: "Met up with Nancy at Crêpes de Paris Inc cafe.",
    tools: {
      iriGenerator: new UlidIriGenerator(iriPrefix),
      searchEngine: new OramaSearchEngine(oramaStore),
      sparqlEngine: new ComunicaSparqlEngine(
        queryEngine,
        context,
      ),
      sparqlValidator: new SparqljsSparqlValidator(),
    },
  });

  console.dir(result, { depth: null });
}

// SPARQL context: Who is speaking, what is the reference time (time of writing), etc.
