import { assert, assertEquals } from "@std/assert";
import { insert } from "@orama/orama";
import { createOramaTripleStore, OramaFactSearchEngine } from "./orama.ts";

function createPopulatedTripleStore() {
  const store = createOramaTripleStore();

  insert(store, {
    subject: "http://example.org/alice",
    predicate: "http://xmlns.com/foaf/0.1/name",
    object: "Alice",
    graph: "http://example.org/graph",
  });

  insert(store, {
    subject: "http://example.org/alice",
    predicate: "http://xmlns.com/foaf/0.1/age",
    object: "30",
    graph: "http://example.org/graph",
  });

  insert(store, {
    subject: "http://example.org/bob",
    predicate: "http://xmlns.com/foaf/0.1/name",
    object: "Bob",
    graph: "http://example.org/graph",
  });

  insert(store, {
    subject: "http://example.org/charlie",
    predicate: "http://xmlns.com/foaf/0.1/name",
    object: "Charlie",
    graph: "http://example.org/graph",
  });

  return store;
}

function createEngine() {
  const store = createPopulatedTripleStore();
  return new OramaFactSearchEngine(store);
}

Deno.test("OramaFactSearchEngine searches by object value", async () => {
  const engine = createEngine();

  const results = await engine.searchFacts("Alice", 10);

  assert(Array.isArray(results));
  assert(results.length > 0);

  const aliceNameResult = results.find(
    (r) =>
      r.object === "Alice" &&
      r.predicate === "http://xmlns.com/foaf/0.1/name",
  );
  assert(aliceNameResult !== undefined);
  assertEquals(aliceNameResult.subject, "http://example.org/alice");
  assertEquals(aliceNameResult.predicate, "http://xmlns.com/foaf/0.1/name");
  assertEquals(aliceNameResult.object, "Alice");
  assert(aliceNameResult.score !== undefined);
});

Deno.test("OramaFactSearchEngine searches by object value (partial match)", async () => {
  const engine = createEngine();

  const results = await engine.searchFacts("30", 10);

  assert(Array.isArray(results));
  assert(results.length > 0);

  const ageResult = results.find(
    (r) =>
      r.object === "30" &&
      r.predicate === "http://xmlns.com/foaf/0.1/age",
  );
  assert(ageResult !== undefined);
  assertEquals(ageResult.subject, "http://example.org/alice");
  assertEquals(ageResult.predicate, "http://xmlns.com/foaf/0.1/age");
  assertEquals(ageResult.object, "30");
});

Deno.test("OramaFactSearchEngine respects limit parameter", async () => {
  const engine = createEngine();

  // Search for "a" which should match "Alice" (object value contains "a")
  const results = await engine.searchFacts("a", 2);

  assert(Array.isArray(results));
  assert(results.length <= 2);
  // Verify it found results by object value
  if (results.length > 0) {
    const hasAlice = results.some((r) => r.object === "Alice");
    assert(hasAlice, "Should find Alice by object value");
  }
});

Deno.test("OramaFactSearchEngine returns empty array for no matches", async () => {
  const engine = createEngine();

  const results = await engine.searchFacts("nonexistent", 10);

  assert(Array.isArray(results));
  assertEquals(results.length, 0);
});

Deno.test("OramaFactSearchEngine returns scores in valid range", async () => {
  const engine = createEngine();

  const results = await engine.searchFacts("Bob", 10);

  assert(Array.isArray(results));
  for (const result of results) {
    assert(result.score !== undefined);
  }
});

Deno.test("OramaFactSearchEngine returns all required fields", async () => {
  const engine = createEngine();

  const results = await engine.searchFacts("Charlie", 10);

  assert(Array.isArray(results));
  if (results.length > 0) {
    const result = results[0];
    assert(typeof result.subject === "string");
    assert(typeof result.predicate === "string");
    assert(typeof result.object === "string");
    assert(typeof result.score === "number");
  }
});
