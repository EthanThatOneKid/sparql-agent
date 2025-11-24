import { assert } from "@std/assert";
import { SparqljsSparqlValidator } from "./sparqljs.ts";

Deno.test("SparqljsSparqlValidator validates valid SPARQL queries", () => {
  const validator = new SparqljsSparqlValidator();
  assert(validator.validate("SELECT * WHERE { ?s ?p ?o }"));
});

Deno.test("SparqljsSparqlValidator validates invalid SPARQL queries", () => {
  const validator = new SparqljsSparqlValidator();
  assert(!validator.validate("invalid query"));
});
