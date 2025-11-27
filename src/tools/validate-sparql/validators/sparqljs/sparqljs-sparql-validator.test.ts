import { assert } from "@std/assert";
import { SparqljsSparqlValidator } from "./sparqljs-sparql-validator.ts";

Deno.test("SparqljsSparqlValidator validates valid SPARQL queries", () => {
  const sparqlValidator = new SparqljsSparqlValidator();
  assert(sparqlValidator.validateSparql("SELECT * WHERE { ?s ?p ?o }"));
});

Deno.test("SparqljsSparqlValidator validates invalid SPARQL queries", () => {
  const sparqlValidator = new SparqljsSparqlValidator();
  assert(!sparqlValidator.validateSparql("invalid query"));
});
