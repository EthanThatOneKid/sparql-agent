import { assertEquals } from "@std/assert";
import { MemoryLevel } from "memory-level";
import type { Quad, Stream } from "@rdfjs/types";
import DataFactory from "@rdfjs/data-model";
import { insert } from "@orama/orama";
import { Readable } from "node:stream";
import { Quadstore } from "quadstore";
import {
  createOramaTripleStore,
  OramaFactSearchEngine,
} from "#/tools/search-facts/engines/orama/orama.ts";
import { StoreInterceptor } from "./interceptor.ts";
import { fromQuad, syncStoreInterceptorWithOrama } from "./orama.ts";

/**
 * Creates a stream from an async iterable of quads.
 * Uses Node.js Readable stream for proper compatibility with Quadstore.
 */
async function createQuadStream(
  quads: AsyncIterable<Quad>,
): Promise<Stream<Quad>> {
  const quadArray: Quad[] = [];
  for await (const quad of quads) {
    quadArray.push(quad);
  }

  let index = 0;
  const readable = new Readable({
    objectMode: true,
    read() {
      if (index < quadArray.length) {
        this.push(quadArray[index++]);
      } else {
        this.push(null);
      }
    },
  });

  return readable as unknown as Stream<Quad>;
}

async function createQuadstoreInstance() {
  const backend = new MemoryLevel();
  const store = new Quadstore({ backend, dataFactory: DataFactory });
  await store.open();
  return { store };
}

function createOramaSyncInstance() {
  const oramaStore = createOramaTripleStore();
  const searchEngine = new OramaFactSearchEngine(oramaStore);
  return { oramaStore, searchEngine };
}

Deno.test(
  "Orama sync - creating entries when triples are added to store",
  async () => {
    const { store } = await createQuadstoreInstance();
    const { oramaStore, searchEngine } = createOramaSyncInstance();
    const interceptor = new StoreInterceptor(store);

    // Set up synchronization between the interceptor and Orama store.
    const cleanupSync = syncStoreInterceptorWithOrama(interceptor, oramaStore);

    // Add a triple to the store using import (triggers sync to Orama)
    const quad = DataFactory.quad(
      DataFactory.namedNode("http://example.org/alice"),
      DataFactory.namedNode("http://schema.org/name"),
      DataFactory.literal("Alice"),
      DataFactory.defaultGraph(),
    );

    // Create a stream generator function
    async function* quadGenerator() {
      yield quad;
    }

    try {
      // Create a stream with the quad and import it (this triggers the sync)
      const stream = await createQuadStream(quadGenerator());
      const importResult = interceptor.import(stream);

      // Wait for stream to finish (Readable stream)
      await new Promise<void>((resolve) => {
        if (stream.on) {
          stream.on("end", () => resolve());
          stream.on("error", () => resolve());
        } else {
          // If no event emitter, wait a bit for consumption
          setTimeout(() => resolve(), 50);
        }
      });

      // Wait for import operation to complete
      await new Promise<void>((resolve) => {
        importResult.on("end", () => resolve());
        importResult.on("error", () => resolve());
      });

      // Wait for async sync operations to complete (inserts into Orama)
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Verify the triple was added to the store
      // Quadstore's match returns an async iterable
      const matchStream = store.match(
        DataFactory.namedNode("http://example.org/alice"),
        undefined,
        undefined,
        undefined,
      );
      const quads: Quad[] = [];
      if (Symbol.asyncIterator in matchStream) {
        for await (const q of matchStream as unknown as AsyncIterable<Quad>) {
          quads.push(q);
        }
      } else {
        const stream = matchStream as { read?: () => Quad | null };
        if (stream.read) {
          let q: Quad | null;
          while ((q = stream.read()) !== null) {
            quads.push(q);
          }
        }
      }
      assertEquals(quads.length, 1);

      // Verify the triple can be found in Orama
      const results = await searchEngine.searchFacts("Alice", 10);
      assertEquals(results.length, 1);
      assertEquals(results[0].subject, "http://example.org/alice");
      assertEquals(results[0].predicate, "http://schema.org/name");
      assertEquals(results[0].object, "Alice");
    } finally {
      cleanupSync();
      await store.close();
    }
  },
);

Deno.test(
  "Orama sync - reading entries from Orama after store operations",
  async () => {
    const { store } = await createQuadstoreInstance();
    const { oramaStore, searchEngine } = createOramaSyncInstance();
    const interceptor = new StoreInterceptor(store);

    // Manually add some triples to both store and Orama to test reading
    const quad1 = DataFactory.quad(
      DataFactory.namedNode("http://example.org/alice"),
      DataFactory.namedNode("http://schema.org/name"),
      DataFactory.literal("Alice"),
      DataFactory.defaultGraph(),
    );
    const quad2 = DataFactory.quad(
      DataFactory.namedNode("http://example.org/bob"),
      DataFactory.namedNode("http://schema.org/name"),
      DataFactory.literal("Bob"),
      DataFactory.defaultGraph(),
    );

    try {
      // Add to store
      await store.put(quad1);
      await store.put(quad2);

      // Add to Orama
      await insert(oramaStore, fromQuad(quad1));
      await insert(oramaStore, fromQuad(quad2));

      // Verify we can read from Orama
      const aliceResults = await searchEngine.searchFacts("Alice", 10);
      assertEquals(aliceResults.length, 1);
      assertEquals(aliceResults[0].object, "Alice");

      const bobResults = await searchEngine.searchFacts("Bob", 10);
      assertEquals(bobResults.length, 1);
      assertEquals(bobResults[0].object, "Bob");

      // Verify we can read from store
      // Quadstore's match returns an async iterable
      const storeStream = interceptor.match();
      const storeQuads: Quad[] = [];
      if (Symbol.asyncIterator in storeStream) {
        for await (const q of storeStream as unknown as AsyncIterable<Quad>) {
          storeQuads.push(q);
        }
      } else {
        const stream = storeStream as { read?: () => Quad | null };
        if (stream.read) {
          let q: Quad | null;
          while ((q = stream.read()) !== null) {
            storeQuads.push(q);
          }
        }
      }
      assertEquals(storeQuads.length, 2);
    } finally {
      await store.close();
    }
  },
);

Deno.test(
  "Orama sync - deleting entries when triples are removed from store",
  async () => {
    const { store } = await createQuadstoreInstance();
    const { oramaStore, searchEngine } = createOramaSyncInstance();
    const interceptor = new StoreInterceptor(store);

    // Set up synchronization between the interceptor and Orama store.
    const cleanupSync = syncStoreInterceptorWithOrama(interceptor, oramaStore);

    // Add initial data to both store and Orama using import (triggers sync)
    const quad = DataFactory.quad(
      DataFactory.namedNode("http://example.org/book"),
      DataFactory.namedNode("http://schema.org/name"),
      DataFactory.literal("Book Title"),
      DataFactory.defaultGraph(),
    );

    // Create a stream generator function
    async function* quadGenerator() {
      yield quad;
    }

    try {
      // Import the quad (this triggers sync to Orama)
      const stream = await createQuadStream(quadGenerator());
      const importResult = interceptor.import(stream);

      // Wait for stream to finish emitting
      await new Promise<void>((resolve) => {
        stream.on("end", () => resolve());
        stream.on("error", () => resolve());
      });

      // Wait for import operation to complete
      await new Promise<void>((resolve) => {
        importResult.on("end", () => resolve());
        importResult.on("error", () => resolve());
      });

      // Wait for sync to complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Verify it exists in both
      const beforeResults = await searchEngine.searchFacts("Book", 10);
      assertEquals(beforeResults.length, 1);

      // Remove the triple from the store (this triggers sync removal from Orama)
      interceptor.removeMatches(
        DataFactory.namedNode("http://example.org/book"),
        undefined,
        undefined,
        undefined,
      );

      // Wait for removal sync to complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Verify it was removed from the store
      // Quadstore's match returns an async iterable
      const storeStream = store.match(
        DataFactory.namedNode("http://example.org/book"),
        undefined,
        undefined,
        undefined,
      );
      const remainingQuads: Quad[] = [];
      if (Symbol.asyncIterator in storeStream) {
        for await (const q of storeStream as unknown as AsyncIterable<Quad>) {
          remainingQuads.push(q);
        }
      } else {
        const stream = storeStream as { read?: () => Quad | null };
        if (stream.read) {
          let q: Quad | null;
          while ((q = stream.read()) !== null) {
            remainingQuads.push(q);
          }
        }
      }
      assertEquals(remainingQuads.length, 0);

      // Verify it was removed from Orama (sync should have handled this)
      const afterResults = await searchEngine.searchFacts("Book", 10);
      assertEquals(afterResults.length, 0);
    } finally {
      cleanupSync();
      await store.close();
    }
  },
);

Deno.test(
  "Orama sync - full cycle: create, read, delete",
  async () => {
    const { store } = await createQuadstoreInstance();
    const { oramaStore, searchEngine } = createOramaSyncInstance();
    const interceptor = new StoreInterceptor(store);

    // Set up synchronization between the interceptor and Orama store.
    const cleanupSync = syncStoreInterceptorWithOrama(interceptor, oramaStore);

    const quad = DataFactory.quad(
      DataFactory.namedNode("http://example.org/product"),
      DataFactory.namedNode("http://schema.org/name"),
      DataFactory.literal("Product Name"),
      DataFactory.defaultGraph(),
    );

    // Create a stream generator function
    async function* quadGenerator() {
      yield quad;
    }

    try {
      // CREATE: Add triple using import (triggers sync to Orama)
      const stream = await createQuadStream(quadGenerator());
      const importResult = interceptor.import(stream);

      // Wait for stream to finish emitting
      await new Promise<void>((resolve) => {
        stream.on("end", () => resolve());
        stream.on("error", () => resolve());
      });

      // Wait for import operation to complete
      await new Promise<void>((resolve) => {
        importResult.on("end", () => resolve());
        importResult.on("error", () => resolve());
      });

      // Wait for sync to complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      // READ: Verify we can read from both
      const readResults = await searchEngine.searchFacts("Product", 10);
      assertEquals(readResults.length, 1);
      assertEquals(readResults[0].object, "Product Name");

      // Quadstore's match returns an async iterable
      const storeStream = interceptor.match(
        DataFactory.namedNode("http://example.org/product"),
        undefined,
        undefined,
        undefined,
      );
      const storeQuads: Quad[] = [];
      if (Symbol.asyncIterator in storeStream) {
        for await (const q of storeStream as unknown as AsyncIterable<Quad>) {
          storeQuads.push(q);
        }
      } else if (typeof storeStream.read === "function") {
        let q: Quad | null;
        while ((q = storeStream.read()) !== null) {
          storeQuads.push(q);
        }
      }
      assertEquals(storeQuads.length, 1);

      // DELETE: Remove and sync from Orama (sync function handles this automatically)
      interceptor.removeMatches(
        DataFactory.namedNode("http://example.org/product"),
        undefined,
        undefined,
        undefined,
      );

      // Wait for removal sync to complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Verify deletion from store
      // Quadstore's match returns an async iterable
      const finalStream = interceptor.match(
        DataFactory.namedNode("http://example.org/product"),
        undefined,
        undefined,
        undefined,
      );
      const finalQuads: Quad[] = [];
      if (Symbol.asyncIterator in finalStream) {
        for await (const q of finalStream as unknown as AsyncIterable<Quad>) {
          finalQuads.push(q);
        }
      } else {
        const stream = finalStream as { read?: () => Quad | null };
        if (stream.read) {
          let finalQ: Quad | null;
          while ((finalQ = stream.read()) !== null) {
            finalQuads.push(finalQ);
          }
        }
      }
      assertEquals(finalQuads.length, 0);

      // Verify it was removed from Orama (sync should have handled this)
      const finalSearchResults = await searchEngine.searchFacts("Product", 10);
      assertEquals(finalSearchResults.length, 0);
    } finally {
      cleanupSync();
      await store.close();
    }
  },
);
