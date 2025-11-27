import { assert, assertEquals } from "@std/assert";
import { Store } from "n3";
import DataFactory from "@rdfjs/data-model";
import { Readable } from "node:stream";
import type { Quad, Stream } from "@rdfjs/types";
import {
  createOramaTripleStore,
  OramaFactSearchEngine,
} from "#/tools/search-facts/engines/orama/orama.ts";
import { StoreInterceptor } from "./interceptor.ts";
import { syncStoreInterceptorWithOrama } from "./orama.ts";

const { namedNode, literal, quad } = DataFactory;

/**
 * Creates a stream from an array of quads.
 */
function createQuadStream(quads: Quad[]): Stream<Quad> {
  const stream = Readable.from(quads, { objectMode: true }) as Stream<Quad>;
  return stream;
}

Deno.test("syncStoreInterceptorWithOrama - import syncs quads to Orama", async () => {
  const store = new Store();
  const interceptor = new StoreInterceptor(store);
  const orama = createOramaTripleStore();
  const cleanup = syncStoreInterceptorWithOrama(interceptor, orama);

  try {
    const testQuad = quad(
      namedNode("http://example.org/alice"),
      namedNode("http://xmlns.com/foaf/0.1/name"),
      literal("Alice"),
      DataFactory.defaultGraph(),
    );

    const stream = createQuadStream([testQuad]);
    await new Promise<void>((resolve, reject) => {
      const result = interceptor.import(stream);
      result.on("end", () => resolve());
      result.on("error", reject);
    });

    // Verify quad is in Orama by searching
    const engine = new OramaFactSearchEngine(orama);
    const results = await engine.searchFacts("Alice", 10);

    assert(results.length > 0);
    const aliceResult = results.find(
      (r) => r.object === "Alice" && r.subject === "http://example.org/alice",
    );
    assert(aliceResult !== undefined);
    assertEquals(aliceResult.predicate, "http://xmlns.com/foaf/0.1/name");
  } finally {
    cleanup();
  }
});

Deno.test("syncStoreInterceptorWithOrama - insert syncs single quad to Orama", async () => {
  const store = new Store();
  const interceptor = new StoreInterceptor(store);
  const orama = createOramaTripleStore();
  const cleanup = syncStoreInterceptorWithOrama(interceptor, orama);

  try {
    const testQuad = quad(
      namedNode("http://example.org/bob"),
      namedNode("http://xmlns.com/foaf/0.1/name"),
      literal("Bob"),
      DataFactory.defaultGraph(),
    );

    await interceptor.put(testQuad);

    // Verify quad is in Orama by searching
    const engine = new OramaFactSearchEngine(orama);
    const results = await engine.searchFacts("Bob", 10);

    assert(results.length > 0);
    const bobResult = results.find(
      (r) => r.object === "Bob" && r.subject === "http://example.org/bob",
    );
    assert(bobResult !== undefined);
    assertEquals(bobResult.predicate, "http://xmlns.com/foaf/0.1/name");
  } finally {
    cleanup();
  }
});

Deno.test("syncStoreInterceptorWithOrama - remove removes quads from Orama", async () => {
  const store = new Store();
  const interceptor = new StoreInterceptor(store);
  const orama = createOramaTripleStore();
  const cleanup = syncStoreInterceptorWithOrama(interceptor, orama);

  try {
    // First, add a quad
    const testQuad = quad(
      namedNode("http://example.org/charlie"),
      namedNode("http://xmlns.com/foaf/0.1/name"),
      literal("Charlie"),
      DataFactory.defaultGraph(),
    );

    await interceptor.put(testQuad);

    // Verify it's in Orama
    const engine = new OramaFactSearchEngine(orama);
    let results = await engine.searchFacts("Charlie", 10);
    assert(results.length > 0);

    // Now remove it
    const removeStream = createQuadStream([testQuad]);
    await new Promise<void>((resolve, reject) => {
      const result = interceptor.remove(removeStream);
      result.on("end", () => resolve());
      result.on("error", reject);
    });

    // Give async handlers time to complete
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verify it's removed from Orama
    results = await engine.searchFacts("Charlie", 10);
    const charlieResult = results.find((r) => r.object === "Charlie");
    assert(charlieResult === undefined, "Charlie should be removed from Orama");
  } finally {
    cleanup();
  }
});

Deno.test(
  "syncStoreInterceptorWithOrama - removematches removes matching quads from Orama",
  async () => {
    const store = new Store();
    const interceptor = new StoreInterceptor(store);
    const orama = createOramaTripleStore();
    const cleanup = syncStoreInterceptorWithOrama(interceptor, orama);

    try {
      // Add multiple quads
      const quad1 = quad(
        namedNode("http://example.org/dave"),
        namedNode("http://xmlns.com/foaf/0.1/name"),
        literal("Dave"),
        DataFactory.defaultGraph(),
      );
      const quad2 = quad(
        namedNode("http://example.org/dave"),
        namedNode("http://xmlns.com/foaf/0.1/age"),
        literal("35"),
        DataFactory.defaultGraph(),
      );
      const quad3 = quad(
        namedNode("http://example.org/eve"),
        namedNode("http://xmlns.com/foaf/0.1/name"),
        literal("Eve"),
        DataFactory.defaultGraph(),
      );

      await interceptor.put(quad1);
      await interceptor.put(quad2);
      await interceptor.put(quad3);

      // Verify all are in Orama
      const engine = new OramaFactSearchEngine(orama);
      let results = await engine.searchFacts("Dave", 10);
      assert(results.length >= 2); // Should find both name and age

      // Remove all quads with subject dave
      await new Promise<void>((resolve, reject) => {
        const result = interceptor.removeMatches(
          namedNode("http://example.org/dave"),
          null,
          null,
          null,
        );
        result.on("end", () => resolve());
        result.on("error", reject);
      });

      // Give async handlers time to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify Dave quads are removed but Eve remains
      results = await engine.searchFacts("Dave", 10);
      const daveResults = results.filter(
        (r) => r.subject === "http://example.org/dave",
      );
      assertEquals(daveResults.length, 0, "Dave quads should be removed");

      results = await engine.searchFacts("Eve", 10);
      const eveResult = results.find((r) => r.object === "Eve");
      assert(eveResult !== undefined, "Eve should still be in Orama");
    } finally {
      cleanup();
    }
  },
);

Deno.test(
  "syncStoreInterceptorWithOrama - deletegraph removes all quads in graph from Orama",
  async () => {
    const store = new Store();
    const interceptor = new StoreInterceptor(store);
    const orama = createOramaTripleStore();
    const cleanup = syncStoreInterceptorWithOrama(interceptor, orama);

    try {
      const graph1 = namedNode("http://example.org/graph1");
      const graph2 = namedNode("http://example.org/graph2");

      // Add quads to different graphs
      const quad1 = quad(
        namedNode("http://example.org/frank"),
        namedNode("http://xmlns.com/foaf/0.1/name"),
        literal("Frank"),
        graph1,
      );
      const quad2 = quad(
        namedNode("http://example.org/grace"),
        namedNode("http://xmlns.com/foaf/0.1/name"),
        literal("Grace"),
        graph1,
      );
      const quad3 = quad(
        namedNode("http://example.org/henry"),
        namedNode("http://xmlns.com/foaf/0.1/name"),
        literal("Henry"),
        graph2,
      );

      await interceptor.put(quad1);
      await interceptor.put(quad2);
      await interceptor.put(quad3);

      // Verify all are in Orama
      const engine = new OramaFactSearchEngine(orama);
      let results = await engine.searchFacts("Frank", 10);
      assert(results.length > 0);
      results = await engine.searchFacts("Grace", 10);
      assert(results.length > 0);
      results = await engine.searchFacts("Henry", 10);
      assert(results.length > 0);

      // Delete graph1
      await new Promise<void>((resolve, reject) => {
        const result = interceptor.deleteGraph(graph1);
        result.on("end", () => resolve());
        result.on("error", reject);
      });

      // Give async handlers time to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify graph1 quads are removed but graph2 remains
      results = await engine.searchFacts("Frank", 10);
      const frankResult = results.find((r) => r.object === "Frank");
      assert(frankResult === undefined, "Frank should be removed");

      results = await engine.searchFacts("Grace", 10);
      const graceResult = results.find((r) => r.object === "Grace");
      assert(graceResult === undefined, "Grace should be removed");

      results = await engine.searchFacts("Henry", 10);
      const henryResult = results.find((r) => r.object === "Henry");
      assert(henryResult !== undefined, "Henry should still be in Orama");
    } finally {
      cleanup();
    }
  },
);

Deno.test(
  "syncStoreInterceptorWithOrama - multiple operations work together correctly",
  async () => {
    const store = new Store();
    const interceptor = new StoreInterceptor(store);
    const orama = createOramaTripleStore();
    const cleanup = syncStoreInterceptorWithOrama(interceptor, orama);

    try {
      // Add quads via import
      const quad1 = quad(
        namedNode("http://example.org/iris"),
        namedNode("http://xmlns.com/foaf/0.1/name"),
        literal("Iris"),
        DataFactory.defaultGraph(),
      );
      const quad2 = quad(
        namedNode("http://example.org/iris"),
        namedNode("http://xmlns.com/foaf/0.1/age"),
        literal("28"),
        DataFactory.defaultGraph(),
      );

      const importStream = createQuadStream([quad1, quad2]);
      await new Promise<void>((resolve, reject) => {
        const result = interceptor.import(importStream);
        result.on("end", () => resolve());
        result.on("error", reject);
      });

      // Add another quad via insert
      const quad3 = quad(
        namedNode("http://example.org/jack"),
        namedNode("http://xmlns.com/foaf/0.1/name"),
        literal("Jack"),
        DataFactory.defaultGraph(),
      );
      await interceptor.put(quad3);

      // Verify all are in Orama
      const engine = new OramaFactSearchEngine(orama);
      let results = await engine.searchFacts("Iris", 10);
      assert(results.length >= 1);
      results = await engine.searchFacts("Jack", 10);
      assert(results.length >= 1);

      // Remove one quad
      await new Promise<void>((resolve, reject) => {
        const removeStream = createQuadStream([quad1]);
        const result = interceptor.remove(removeStream);
        result.on("end", () => resolve());
        result.on("error", reject);
      });

      // Give async handlers time to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify only name quad is removed, age quad remains
      results = await engine.searchFacts("Iris", 10);
      const irisNameResult = results.find(
        (r) => r.predicate === "http://xmlns.com/foaf/0.1/name",
      );
      assert(irisNameResult === undefined, "Iris name should be removed");

      const irisAgeResult = results.find(
        (r) => r.predicate === "http://xmlns.com/foaf/0.1/age",
      );
      assert(irisAgeResult !== undefined, "Iris age should still be in Orama");
    } finally {
      cleanup();
    }
  },
);

Deno.test(
  "syncStoreInterceptorWithOrama - cleanup function removes event listeners",
  async () => {
    const store = new Store();
    const interceptor = new StoreInterceptor(store);
    const orama = createOramaTripleStore();
    const cleanup = syncStoreInterceptorWithOrama(interceptor, orama);

    // Add a quad before cleanup
    const testQuad = quad(
      namedNode("http://example.org/kate"),
      namedNode("http://xmlns.com/foaf/0.1/name"),
      literal("Kate"),
      DataFactory.defaultGraph(),
    );
    await interceptor.put(testQuad);

    // Verify it's in Orama
    const engine = new OramaFactSearchEngine(orama);
    let results = await engine.searchFacts("Kate", 10);
    assert(results.length > 0);

    // Cleanup (remove event listeners)
    cleanup();

    // Add another quad after cleanup - should NOT sync to Orama
    const testQuad2 = quad(
      namedNode("http://example.org/lisa"),
      namedNode("http://xmlns.com/foaf/0.1/name"),
      literal("Lisa"),
      DataFactory.defaultGraph(),
    );
    await interceptor.put(testQuad2);

    // Verify Kate is still there (from before cleanup)
    results = await engine.searchFacts("Kate", 10);
    assert(results.length > 0, "Kate should still be in Orama");

    // Verify Lisa is NOT in Orama (added after cleanup)
    results = await engine.searchFacts("Lisa", 10);
    const lisaResult = results.find((r) => r.object === "Lisa");
    assert(
      lisaResult === undefined,
      "Lisa should NOT be in Orama because cleanup was called",
    );
  },
);

Deno.test(
  "syncStoreInterceptorWithOrama - integration with OramaFactSearchEngine",
  async () => {
    const store = new Store();
    const interceptor = new StoreInterceptor(store);
    const orama = createOramaTripleStore();
    const cleanup = syncStoreInterceptorWithOrama(interceptor, orama);

    try {
      // Add multiple quads with different objects
      const quads = [
        quad(
          namedNode("http://example.org/mike"),
          namedNode("http://xmlns.com/foaf/0.1/name"),
          literal("Mike"),
          DataFactory.defaultGraph(),
        ),
        quad(
          namedNode("http://example.org/nancy"),
          namedNode("http://xmlns.com/foaf/0.1/name"),
          literal("Nancy"),
          DataFactory.defaultGraph(),
        ),
        quad(
          namedNode("http://example.org/oscar"),
          namedNode("http://xmlns.com/foaf/0.1/name"),
          literal("Oscar"),
          DataFactory.defaultGraph(),
        ),
      ];

      for (const q of quads) {
        await interceptor.put(q);
      }

      // Use OramaFactSearchEngine to search
      const engine = new OramaFactSearchEngine(orama);
      const results = await engine.searchFacts("Nancy", 10);

      // Verify search works correctly
      assert(results.length > 0);
      const nancyResult = results.find(
        (r) => r.object === "Nancy" && r.subject === "http://example.org/nancy",
      );
      assert(nancyResult !== undefined);
      assertEquals(nancyResult.predicate, "http://xmlns.com/foaf/0.1/name");
      assert(typeof nancyResult.score === "number");
    } finally {
      cleanup();
    }
  },
);
