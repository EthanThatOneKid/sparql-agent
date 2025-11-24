import { google } from "@ai-sdk/google";
import { generateSparql } from "#/sparql/generate.ts";
import { SparqljsSparqlValidator } from "#/sparql/validator/sparqljs.ts";

const validator = new SparqljsSparqlValidator();

if (import.meta.main) {
  const result = await generateSparql({
    model: google("gemini-2.5-flash"),
    prompt: "Met up with Nancy at the cafe yesterday.",
    validate: (query) => validator.validate(query),
  });

  console.dir(result, { depth: null });
}
