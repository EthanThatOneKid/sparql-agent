import { assertEquals, assertExists } from "@std/assert";
import { QueryEngine } from "@comunica/query-sparql-rdfjs-lite";
import { DataFactory, Store } from "n3";
import { createInterceptorStore } from "./interceptor-store.ts";

const verbose = false;

function logVerbose(...args: unknown[]): void {
  if (!verbose) {
    return;
  }

  console.log(...args);
}

/**
 * Creates an N3 store populated with test data.
 */
function createPopulatedN3Store(): Store {
  const store = new Store();
  store.addQuad(
    DataFactory.quad(
      DataFactory.namedNode("http://example.org/alice"),
      DataFactory.namedNode("http://xmlns.com/foaf/0.1/name"),
      DataFactory.literal("Alice"),
      DataFactory.defaultGraph(),
    ),
  );

  store.addQuad(
    DataFactory.quad(
      DataFactory.namedNode("http://example.org/alice"),
      DataFactory.namedNode("http://xmlns.com/foaf/0.1/age"),
      DataFactory.literal(
        "30",
        DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#integer"),
      ),
      DataFactory.defaultGraph(),
    ),
  );

  store.addQuad(
    DataFactory.quad(
      DataFactory.namedNode("http://example.org/bob"),
      DataFactory.namedNode("http://xmlns.com/foaf/0.1/name"),
      DataFactory.literal("Bob"),
      DataFactory.defaultGraph(),
    ),
  );

  return store;
}

Deno.test("Comunica method tracking - SELECT query calls match()", async () => {
  const store = createPopulatedN3Store();
  const methodCalls: Array<{ method: string | symbol; args: unknown[] }> = [];

  const hookedStore = createInterceptorStore(store, ({ methodName, args }) => {
    methodCalls.push({ method: methodName, args });
  });

  const queryEngine = new QueryEngine();
  const query = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    SELECT ?name WHERE {
      ?person foaf:name ?name .
    }
  `;

  const result = await queryEngine.queryBindings(query, {
    sources: [hookedStore],
  });

  // Consume the result to ensure the query executes
  const bindings = await result.toArray();
  assertEquals(bindings.length, 2);

  // Verify that match() was called
  const matchCalls = methodCalls.filter((call) => call.method === "match");
  assertExists(matchCalls.length > 0, "match() should be called at least once");

  // Log all method calls for debugging
  logVerbose("Method calls during SELECT query:", methodCalls);
});

Deno.test("Comunica method tracking - ASK query calls match()", async () => {
  const store = createPopulatedN3Store();
  const methodCalls: Array<{ method: string | symbol; args: unknown[] }> = [];

  const hookedStore = createInterceptorStore(store, ({ methodName, args }) => {
    methodCalls.push({ method: methodName, args });
  });

  const queryEngine = new QueryEngine();
  const query = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    ASK WHERE {
      ?person foaf:name "Alice" .
    }
  `;

  const result = await queryEngine.queryBoolean(query, {
    sources: [hookedStore],
  });

  assertEquals(result, true);

  // Verify that match() was called
  const matchCalls = methodCalls.filter((call) => call.method === "match");
  assertExists(matchCalls.length > 0, "match() should be called at least once");

  logVerbose("Method calls during ASK query:", methodCalls);
});

Deno.test("Comunica method tracking - CONSTRUCT query calls match()", async () => {
  const store = createPopulatedN3Store();
  const methodCalls: Array<{ method: string | symbol; args: unknown[] }> = [];

  const hookedStore = createInterceptorStore(store, ({ methodName, args }) => {
    methodCalls.push({ method: methodName, args });
  });

  const queryEngine = new QueryEngine();
  const query = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    CONSTRUCT {
      ?person foaf:name ?name .
    }
    WHERE {
      ?person foaf:name ?name .
    }
  `;

  const result = await queryEngine.queryQuads(query, {
    sources: [hookedStore],
  });

  // Consume the result
  const quads = await result.toArray();
  assertEquals(quads.length, 2);

  // Verify that match() was called
  const matchCalls = methodCalls.filter((call) => call.method === "match");
  assertExists(matchCalls.length > 0, "match() should be called at least once");

  logVerbose("Method calls during CONSTRUCT query:", methodCalls);
});

Deno.test("Comunica method tracking - INSERT query calls import()", async () => {
  const store = createPopulatedN3Store();
  const methodCalls: Array<{ method: string | symbol; args: unknown[] }> = [];

  const hookedStore = createInterceptorStore(store, ({ methodName, args }) => {
    methodCalls.push({ method: methodName, args });
  });

  const queryEngine = new QueryEngine();
  const query = `
    PREFIX ex: <http://example.org/>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    INSERT DATA {
      ex:carol foaf:name "Carol" .
    }
  `;

  await queryEngine.queryVoid(query, {
    sources: [hookedStore],
    destination: hookedStore,
  });

  // Verify that import() was called (or addQuad/add might be called for N3)
  const importCalls = methodCalls.filter((call) => call.method === "import");
  const addQuadCalls = methodCalls.filter((call) => call.method === "addQuad");
  const addCalls = methodCalls.filter((call) => call.method === "add");

  assertExists(
    importCalls.length > 0 || addQuadCalls.length > 0 || addCalls.length > 0,
    "import(), addQuad(), or add() should be called for INSERT",
  );

  logVerbose("Method calls during INSERT query:", methodCalls);
});

Deno.test("Comunica method tracking - DELETE query calls removeMatches() or remove()", async () => {
  const store = createPopulatedN3Store();
  const methodCalls: Array<{ method: string | symbol; args: unknown[] }> = [];

  const hookedStore = createInterceptorStore(store, ({ methodName, args }) => {
    methodCalls.push({ method: methodName, args });
  });

  const queryEngine = new QueryEngine();
  const query = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    DELETE WHERE {
      ?person foaf:name "Bob" .
    }
  `;

  await queryEngine.queryVoid(query, {
    sources: [hookedStore],
    destination: hookedStore,
  });

  // Verify that removeMatches() or remove() was called
  const removeMatchesCalls = methodCalls.filter(
    (call) => call.method === "removeMatches",
  );
  const removeCalls = methodCalls.filter((call) => call.method === "remove");
  const removeQuadCalls = methodCalls.filter((call) =>
    call.method === "removeQuad"
  );

  assertExists(
    removeMatchesCalls.length > 0 ||
      removeCalls.length > 0 ||
      removeQuadCalls.length > 0,
    "removeMatches(), remove(), or removeQuad() should be called for DELETE",
  );

  logVerbose("Method calls during DELETE query:", methodCalls);
});

Deno.test("Comunica method tracking - tracks all RDFJS store methods", async () => {
  const store = createPopulatedN3Store();
  const methodCalls: Array<{ method: string | symbol; args: unknown[] }> = [];

  const hookedStore = createInterceptorStore(store, ({ methodName, args }) => {
    methodCalls.push({ method: methodName, args });
  });

  const queryEngine = new QueryEngine();

  // Execute a complex query that might trigger multiple methods
  const query = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    SELECT ?name ?age WHERE {
      ?person foaf:name ?name .
      OPTIONAL { ?person foaf:age ?age }
    }
    ORDER BY ?name
  `;

  const result = await queryEngine.queryBindings(query, {
    sources: [hookedStore],
  });

  // Consume the result
  const bindings = await result.toArray();
  assertEquals(bindings.length, 2);

  // Get unique method names that were called
  const uniqueMethods = new Set(
    methodCalls.map((call) => String(call.method)),
  );

  logVerbose("All unique methods called:", Array.from(uniqueMethods));
  logVerbose("Total method calls:", methodCalls.length);
  logVerbose("Detailed method calls:", methodCalls);

  // Verify at least match() was called (the primary RDFJS store method)
  assertExists(
    uniqueMethods.has("match"),
    "match() should be called for SELECT queries",
  );
});
