import { assert } from "@std/assert";
import { OxigraphSparqlValidator } from "./sparql-validator.ts";

Deno.test("OxigraphSparqlValidator validates valid SPARQL queries", () => {
  const validator = new OxigraphSparqlValidator();
  assert(validator.validate("SELECT * WHERE { ?s ?p ?o }"));
});

Deno.test("OxigraphSparqlValidator validates invalid SPARQL queries", () => {
  const validator = new OxigraphSparqlValidator();
  assert(!validator.validate("invalid query"));
});
