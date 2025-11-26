import { google } from "@ai-sdk/google";
import { Store } from "oxigraph";
import { generateSparql } from "#/generate-sparql.ts";
import { UlidIriGenerator } from "#/tools/generate-iri/ulid.ts";
import { OxigraphSparqlEngine } from "#/tools/execute-sparql/oxigraph.ts";
import { SparqljsSparqlValidator } from "#/tools/validate-sparql/sparqljs.ts";

if (import.meta.main) {
  const iriPrefix = "https://fartlabs.org/.well-known/genid/";
  const oxigraphStore = new Store();
  const result = await generateSparql({
    model: google("gemini-2.5-flash"),
    prompt: "Met up with Nancy at Crêpes de Paris Inc cafe.",
    tools: {
      iriGenerator: new UlidIriGenerator(iriPrefix),
      sparqlEngine: new OxigraphSparqlEngine(oxigraphStore),
      sparqlValidator: new SparqljsSparqlValidator(),
    },
  });

  console.dir(result, { depth: null });
}

// SPARQL context: Who is speaking, what is the reference time (time of writing), etc.
