import { assertEquals } from "@std/assert";
import { EventEmitter } from "node:events";
import DataFactory from "@rdfjs/data-model";
import type { Quad, Store, Stream, Term } from "@rdfjs/types";
import { createFactOrama, OramaSearchEngine } from "./orama-search-engine.ts";
import { syncOrama } from "./sync-orama.ts";

class MemoryStore implements Store {
  #quads: Quad[] = [];

  match(
    subject?: Term | null,
    predicate?: Term | null,
    object?: Term | null,
    graph?: Term | null,
  ): Stream<Quad> {
    const matches = this.#quads.filter((quad) =>
      matchesTerm(quad.subject, subject) &&
      matchesTerm(quad.predicate, predicate) &&
      matchesTerm(quad.object, object) &&
      matchesTerm(quad.graph, graph)
    );
    return streamFromQuads(matches);
  }

  import(stream: Stream<Quad>): EventEmitter {
    return this.#consumeStream(stream, (quad) => {
      this.#quads.push(quad);
    });
  }

  remove(stream: Stream<Quad>): EventEmitter {
    return this.#consumeStream(stream, (quad) => {
      this.#quads = this.#quads.filter((existing) =>
        !quadsEqual(existing, quad)
      );
    });
  }

  removeMatches(
    subject?: Term | null,
    predicate?: Term | null,
    object?: Term | null,
    graph?: Term | null,
  ): EventEmitter {
    const matches = this.#quads.filter((quad) =>
      matchesTerm(quad.subject, subject) &&
      matchesTerm(quad.predicate, predicate) &&
      matchesTerm(quad.object, object) &&
      matchesTerm(quad.graph, graph)
    );
    this.#quads = this.#quads.filter((quad) => !matches.includes(quad));
    return emitImmediately();
  }

  deleteGraph(graph: Quad["graph"] | string): EventEmitter {
    const normalized = typeof graph === "string"
      ? DataFactory.namedNode(graph)
      : graph;
    this.#quads = this.#quads.filter((quad) =>
      !matchesTerm(quad.graph, normalized)
    );
    return emitImmediately();
  }

  #consumeStream(stream: Stream<Quad>, onQuad: (quad: Quad) => void) {
    const emitter = new EventEmitter();
    const evented = stream as unknown as EventEmitter;
    evented.on("data", (quad: Quad) => onQuad(quad));
    evented.once("end", () => emitter.emit("end"));
    evented.once("error", (error) => emitter.emit("error", error));
    return emitter;
  }
}

Deno.test("syncOrama inserts documents on import()", async () => {
  const { searchEngine, syncedStore } = setup();
  const quad = createQuad(
    "http://example.org/alice",
    "http://xmlns.com/foaf/0.1/name",
    "Alice",
  );

  syncedStore.import(createQuadStream([quad]));
  await flushAsync();

  const results = await searchEngine.searchFacts("Alice", 10);
  assertEquals(results.length, 1);
});

Deno.test("syncOrama removes documents on remove()", async () => {
  const { searchEngine, syncedStore } = setup();
  const quad = createQuad(
    "http://example.org/alice",
    "http://xmlns.com/foaf/0.1/name",
    "Alice",
  );

  syncedStore.import(createQuadStream([quad]));
  await flushAsync();
  assertEquals((await searchEngine.searchFacts("Alice", 10)).length, 1);

  syncedStore.remove(createQuadStream([quad]));
  await flushAsync();
  assertEquals((await searchEngine.searchFacts("Alice", 10)).length, 0);
});

Deno.test("syncOrama removes matching documents on removeMatches()", async () => {
  const { searchEngine, syncedStore } = setup();
  const aliceName = createQuad(
    "http://example.org/alice",
    "http://xmlns.com/foaf/0.1/name",
    "Alice",
  );
  const bobName = createQuad(
    "http://example.org/bob",
    "http://xmlns.com/foaf/0.1/name",
    "Bob",
  );

  syncedStore.import(createQuadStream([aliceName, bobName]));
  await flushAsync();

  syncedStore.removeMatches(
    DataFactory.namedNode("http://example.org/alice"),
    null,
    null,
    null,
  );
  await flushAsync();

  assertEquals((await searchEngine.searchFacts("Alice", 10)).length, 0);
  assertEquals((await searchEngine.searchFacts("Bob", 10)).length, 1);
});

Deno.test("syncOrama removes documents on deleteGraph()", async () => {
  const { searchEngine, syncedStore } = setup();
  const graphA = "http://example.org/graph/a";
  const graphB = "http://example.org/graph/b";
  const quadA = createQuad(
    "http://example.org/alice",
    "http://xmlns.com/foaf/0.1/name",
    "Alice",
    graphA,
  );
  const quadB = createQuad(
    "http://example.org/bob",
    "http://xmlns.com/foaf/0.1/name",
    "Bob",
    graphB,
  );

  syncedStore.import(createQuadStream([quadA, quadB]));
  await flushAsync();

  syncedStore.deleteGraph(DataFactory.namedNode(graphA));
  await flushAsync();

  assertEquals((await searchEngine.searchFacts("Alice", 10)).length, 0);
  assertEquals((await searchEngine.searchFacts("Bob", 10)).length, 1);
});

function setup() {
  const store = new MemoryStore();
  const orama = createFactOrama();
  const searchEngine = new OramaSearchEngine(orama);
  const syncedStore = syncOrama(store, orama);
  return { store, orama, searchEngine, syncedStore };
}

function createQuad(
  subject: string,
  predicate: string,
  object: string,
  graph = "http://example.org/graph/default",
): Quad {
  return DataFactory.quad(
    DataFactory.namedNode(subject),
    DataFactory.namedNode(predicate),
    DataFactory.literal(object),
    DataFactory.namedNode(graph),
  );
}

function createQuadStream(quads: Quad[]): Stream<Quad> {
  return streamFromQuads(quads);
}

function streamFromQuads(quads: Quad[]): Stream<Quad> {
  const emitter = new EventEmitter() as Stream<Quad>;
  emitter.read = () => null;
  queueMicrotask(() => {
    for (const quad of quads) {
      emitter.emit("data", quad);
    }
    emitter.emit("end");
  });
  return emitter;
}

function emitImmediately(): EventEmitter {
  const emitter = new EventEmitter();
  queueMicrotask(() => emitter.emit("end"));
  return emitter;
}

function matchesTerm(
  term: Term | Quad["object"],
  pattern?: Term | Quad["object"] | null,
) {
  if (pattern === undefined || pattern === null) {
    return true;
  }
  if (typeof (term as Term).equals === "function") {
    return (term as Term).equals(pattern as Term);
  }
  return term.termType === pattern.termType && term.value === pattern.value;
}

function quadsEqual(left: Quad, right: Quad) {
  return matchesTerm(left.subject, right.subject) &&
    matchesTerm(left.predicate, right.predicate) &&
    matchesTerm(
      left.object as unknown as Term,
      right.object as unknown as Term,
    ) &&
    matchesTerm(left.graph, right.graph);
}

async function flushAsync() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
