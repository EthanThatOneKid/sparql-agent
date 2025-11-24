import { assert } from "@std/assert";
import { TreeSitterSparqlValidator } from "./tree-sitter.ts";

Deno.test("TreeSitterSparqlValidator validates valid SPARQL queries", () => {
  const validator = new TreeSitterSparqlValidator();
  assert(validator.validate("SELECT * WHERE { ?s ?p ?o }"));
});
