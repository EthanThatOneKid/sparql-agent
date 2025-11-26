import { assert, assertEquals } from "@std/assert";
import { Store } from "oxigraph";
import { OxigraphSparqlQueryEngine } from "./sparql-engine.ts";

/**
 * Creates an in-memory RDF store with test data.
 */
function createTestStore(): Store {
  const store = new Store();

  // Add test data using UPDATE queries
  store.update(`
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    
    INSERT DATA {
      <http://example.org/alice> foaf:name "Alice" .
      <http://example.org/alice> foaf:age "30"^^xsd:integer .
      <http://example.org/bob> foaf:name "Bob" .
      <http://example.org/bob> foaf:age "25"^^xsd:integer .
      <http://example.org/alice> foaf:knows <http://example.org/bob> .
    }
  `);

  return store;
}

/**
 * Creates an Oxigraph query engine configured with an in-memory store.
 */
function createQueryEngine(store: Store): OxigraphSparqlQueryEngine {
  return new OxigraphSparqlQueryEngine(store);
}

Deno.test("OxigraphSparqlQueryEngine - SELECT query returns bindings", async () => {
  const store = createTestStore();
  const engine = createQueryEngine(store);

  const query = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    SELECT ?name ?age WHERE {
      ?person foaf:name ?name .
      ?person foaf:age ?age .
    }
    ORDER BY ?name
  `;

  const result = await engine.executeQuery(query);

  assertEquals(result.type, "bindings");
  assert("bindings" in result);

  if (result.type === "bindings") {
    const bindings = result.bindings;
    assertEquals(bindings.length, 2);

    // Check first binding (Alice)
    const aliceBinding = bindings.find((b) => b.name?.value === "Alice");
    assert(aliceBinding !== undefined);
    assertEquals(aliceBinding.name?.value, "Alice");
    assertEquals(aliceBinding.age?.value, "30");
    assertEquals(
      aliceBinding.age?.datatype,
      "http://www.w3.org/2001/XMLSchema#integer",
    );

    // Check second binding (Bob)
    const bobBinding = bindings.find((b) => b.name?.value === "Bob");
    assert(bobBinding !== undefined);
    assertEquals(bobBinding.name?.value, "Bob");
    assertEquals(bobBinding.age?.value, "25");
  }
});

Deno.test("OxigraphSparqlQueryEngine - ASK query returns boolean", async () => {
  const store = createTestStore();
  const engine = createQueryEngine(store);

  const queryTrue = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    ASK WHERE {
      ?person foaf:name "Alice" .
    }
  `;

  const resultTrue = await engine.executeQuery(queryTrue);
  assertEquals(resultTrue.type, "boolean");
  assert("boolean" in resultTrue);
  if (resultTrue.type === "boolean") {
    assertEquals(resultTrue.boolean, true);
  }

  const queryFalse = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    ASK WHERE {
      ?person foaf:name "Charlie" .
    }
  `;

  const resultFalse = await engine.executeQuery(queryFalse);
  assertEquals(resultFalse.type, "boolean");
  if (resultFalse.type === "boolean") {
    assertEquals(resultFalse.boolean, false);
  }
});

Deno.test("OxigraphSparqlQueryEngine - CONSTRUCT query returns quads", async () => {
  const store = createTestStore();
  const engine = createQueryEngine(store);

  const query = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    CONSTRUCT {
      ?person foaf:name ?name .
    } WHERE {
      ?person foaf:name ?name .
      ?person foaf:age ?age .
      FILTER(?age > 27)
    }
  `;

  const result = await engine.executeQuery(query);

  assertEquals(result.type, "quads");
  assert("quads" in result);

  if (result.type === "quads") {
    const quads = result.quads;
    assertEquals(quads.length, 1);

    const quad = quads[0];
    assertEquals(quad.subject.termType, "NamedNode");
    assertEquals(quad.subject.value, "http://example.org/alice");
    assertEquals(quad.predicate.termType, "NamedNode");
    assertEquals(quad.predicate.value, "http://xmlns.com/foaf/0.1/name");
    assertEquals(quad.object.termType, "Literal");
    assertEquals(quad.object.value, "Alice");
  }
});

Deno.test("OxigraphSparqlQueryEngine - UPDATE query returns void", async () => {
  const store = createTestStore();
  const engine = createQueryEngine(store);

  const query = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    INSERT DATA {
      <http://example.org/charlie> foaf:name "Charlie" .
    }
  `;

  const result = await engine.executeQuery(query);

  assertEquals(result.type, "void");
  assert("success" in result);
  if (result.type === "void") {
    assertEquals(result.success, true);
  }

  // Verify the data was actually inserted by querying it
  const verifyQuery = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    ASK WHERE {
      <http://example.org/charlie> foaf:name "Charlie" .
    }
  `;

  const verifyResult = await engine.executeQuery(verifyQuery);
  assertEquals(verifyResult.type, "boolean");
  if (verifyResult.type === "boolean") {
    assertEquals(verifyResult.boolean, true);
  }
});
