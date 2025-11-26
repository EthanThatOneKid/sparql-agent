import { google } from "@ai-sdk/google";
import { Store } from "oxigraph";
import { generateSparql } from "#/sparql/generate-sparql.ts";
import { SparqljsSparqlValidator } from "#/sparql/sparqljs/sparql-validator.ts";
import { OxigraphSparqlQueryEngine } from "#/sparql/oxigraph/sparql-engine.ts";

const sparqlValidator = new SparqljsSparqlValidator();

const store = new Store();
const queryEngine = new OxigraphSparqlQueryEngine(store);

if (import.meta.main) {
  const result = await generateSparql({
    model: google("gemini-2.5-flash"),
    prompt: "Met up with Nancy at the cafe yesterday.",
    validateSparql: (query) => sparqlValidator.validate(query),
    executeSparql: (query) => queryEngine.executeQuery(query),
  });

  console.dir(result, { depth: null });
}
