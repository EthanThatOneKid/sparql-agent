import { google } from "@ai-sdk/google";
import { generateSparql } from "#/generate-sparql.ts";
import { SparqljsSparqlValidator } from "#/tools/validate-sparql/sparqljs.ts";

if (import.meta.main) {
  const result = await generateSparql({
    model: google("gemini-2.5-flash"),
    prompt: "Met up with Nancy at Crêpes de Paris Inc cafe.",
    tools: {
      sparqlValidator: new SparqljsSparqlValidator(),
    },
  });

  console.dir(result, { depth: null });
}

// SPARQL context: Who is speaking, what is the reference time (time of writing), etc.
