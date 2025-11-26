import { assert, assertEquals } from "@std/assert";
import { Store } from "oxigraph";
import { OxigraphSparqlEngine } from "./oxigraph.ts";

function createPopulatedOxigraphStore(): Store {
  const store = new Store();
  store.update(`
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    INSERT DATA {
      <http://example.org/alice> foaf:name "Alice" .
      <http://example.org/alice> foaf:age "30"^^xsd:integer .
      <http://example.org/bob> foaf:name "Bob" .
      <http://example.org/bob> foaf:age "25"^^xsd:integer .
    }
  `);
  return store;
}

Deno.test("OxigraphSparqlEngine executes SELECT queries and returns bindings maps", async () => {
  const store = createPopulatedOxigraphStore();
  const engine = new OxigraphSparqlEngine(store);

  const result = await engine.executeSparql(`
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    SELECT ?name ?age WHERE {
      ?person foaf:name ?name ;
              foaf:age ?age .
    }
    ORDER BY ?name
  `);

  assert(Array.isArray(result));
  assertEquals(result.length, 2);

  const firstBinding = result[0];
  assert(firstBinding instanceof Map);

  const nameTerm = firstBinding.get("name");
  assert(nameTerm);
  assertEquals(nameTerm.value, "Alice");
});

Deno.test("OxigraphSparqlEngine executes ASK queries and returns boolean", async () => {
  const store = createPopulatedOxigraphStore();
  const engine = new OxigraphSparqlEngine(store);

  const askResult = await engine.executeSparql(`
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    ASK WHERE {
      ?person foaf:name "Bob" .
    }
  `);

  assertEquals(askResult, true);
});
