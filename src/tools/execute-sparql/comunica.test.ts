import { assert, assertEquals } from "@std/assert";
import { QueryEngine } from "@comunica/query-sparql-rdfjs-lite";
import { Store } from "n3";
import DataFactory from "@rdfjs/data-model";
import type * as RDF from "@rdfjs/types";
import { ComunicaSparqlEngine } from "./comunica.ts";

const { namedNode, literal, quad } = DataFactory;

function createPopulatedN3Store(): Store {
  const store = new Store();
  store.addQuad(
    quad(
      namedNode("http://example.org/alice"),
      namedNode("http://xmlns.com/foaf/0.1/name"),
      literal("Alice"),
      DataFactory.defaultGraph(),
    ),
  );

  store.addQuad(
    quad(
      namedNode("http://example.org/alice"),
      namedNode("http://xmlns.com/foaf/0.1/age"),
      literal("30", namedNode("http://www.w3.org/2001/XMLSchema#integer")),
      DataFactory.defaultGraph(),
    ),
  );

  store.addQuad(
    quad(
      namedNode("http://example.org/bob"),
      namedNode("http://xmlns.com/foaf/0.1/name"),
      literal("Bob"),
      DataFactory.defaultGraph(),
    ),
  );

  return store;
}

function createEngine(store: Store): ComunicaSparqlEngine {
  const queryEngine = new QueryEngine();
  return new ComunicaSparqlEngine(
    queryEngine as unknown as InstanceType<typeof QueryEngine>,
    { sources: [store] },
  );
}

Deno.test("ComunicaSparqlEngine executes SELECT queries", async () => {
  const store = createPopulatedN3Store();
  const engine = createEngine(store);

  const result = await engine.executeSparql(`
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    SELECT ?name ?age WHERE {
      ?person foaf:name ?name .
      OPTIONAL { ?person foaf:age ?age }
    }
    ORDER BY ?name
  `);

  assert(Array.isArray(result));
  assertEquals(result.length, 2);

  const first = result[0];
  assert(first instanceof Map);
  assertEquals(first.get("name")?.value, "Alice");
});

Deno.test("ComunicaSparqlEngine executes ASK queries", async () => {
  const store = createPopulatedN3Store();
  const engine = createEngine(store);

  const result = await engine.executeSparql(`
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    ASK WHERE {
      ?person foaf:name "Bob" .
    }
  `);

  assertEquals(result, true);
});

Deno.test("ComunicaSparqlEngine executes CONSTRUCT queries", async () => {
  const store = createPopulatedN3Store();
  const engine = createEngine(store);

  const result = await engine.executeSparql(`
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    CONSTRUCT {
      ?person foaf:name ?name .
    }
    WHERE {
      ?person foaf:name ?name .
    }
  `);

  assert(Array.isArray(result));
  const quads = result as RDF.Quad[];
  assertEquals(quads.length, 2);
  const subjects = quads.map((quad) => quad.subject.value).sort();
  assertEquals(subjects, [
    "http://example.org/alice",
    "http://example.org/bob",
  ]);
});

Deno.test("ComunicaSparqlEngine executes UPDATE queries", async () => {
  const store = createPopulatedN3Store();
  const queryEngine = new QueryEngine();
  const engine = new ComunicaSparqlEngine(
    queryEngine as unknown as InstanceType<typeof QueryEngine>,
    { sources: [store], destination: store },
  );

  const result = await engine.executeSparql(`
    PREFIX ex: <http://example.org/>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    INSERT DATA {
      ex:carol foaf:name "Carol" .
    }
  `);

  assertEquals(result, "");
  const inserted = store.getQuads(
    namedNode("http://example.org/carol"),
    namedNode("http://xmlns.com/foaf/0.1/name"),
    literal("Carol"),
    null,
  );
  assertEquals(inserted.length, 1);
});
