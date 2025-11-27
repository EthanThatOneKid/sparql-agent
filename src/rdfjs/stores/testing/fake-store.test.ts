import { assertEquals, assertExists } from "@std/assert";
import { DataFactory } from "n3";
import { createFakeStream, FakeStore } from "./fake-store.ts";

Deno.test("FakeStore - match() tracks calls and returns Stream", () => {
  const store = new FakeStore();
  const subject = DataFactory.namedNode("http://example.org/subject");
  const predicate = DataFactory.namedNode("http://example.org/predicate");
  const object = DataFactory.literal("value");
  const graph = DataFactory.defaultGraph();

  const stream = store.match(subject, predicate, object, graph);

  assertEquals(store.matchCalls.length, 1);
  assertEquals(store.matchCalls[0].subject, subject);
  assertEquals(store.matchCalls[0].predicate, predicate);
  assertEquals(store.matchCalls[0].object, object);
  assertEquals(store.matchCalls[0].graph, graph);
  assertExists(stream);
  assertExists(stream.read);
  assertEquals(typeof stream.read, "function");
});

Deno.test("FakeStore - match() tracks calls with null/undefined parameters", () => {
  const store = new FakeStore();

  store.match(null, undefined, null, undefined);
  store.match();

  assertEquals(store.matchCalls.length, 2);
  assertEquals(store.matchCalls[0].subject, null);
  assertEquals(store.matchCalls[0].predicate, undefined);
  assertEquals(store.matchCalls[0].object, null);
  assertEquals(store.matchCalls[0].graph, undefined);
  assertEquals(store.matchCalls[1].subject, undefined);
  assertEquals(store.matchCalls[1].predicate, undefined);
  assertEquals(store.matchCalls[1].object, undefined);
  assertEquals(store.matchCalls[1].graph, undefined);
});

Deno.test("FakeStore - match() returns empty stream", () => {
  const store = new FakeStore();
  const stream = store.match();

  assertEquals(stream.read(), null);
});

Deno.test("FakeStore - import() tracks calls and returns EventEmitter", () => {
  const store = new FakeStore();
  const stream = createFakeStream();

  const result = store.import(stream);

  assertEquals(store.importCalls.length, 1);
  assertEquals(store.importCalls[0], stream);
  assertExists(result);
  // EventEmitter should have emit method
  assertExists(result.emit);
  assertEquals(typeof result.emit, "function");
});

Deno.test("FakeStore - remove() tracks calls and returns EventEmitter", () => {
  const store = new FakeStore();
  const stream = createFakeStream();

  const result = store.remove(stream);

  assertEquals(store.removeCalls.length, 1);
  assertEquals(store.removeCalls[0], stream);
  assertExists(result);
  assertExists(result.emit);
  assertEquals(typeof result.emit, "function");
});

Deno.test("FakeStore - removeMatches() tracks calls and returns EventEmitter", () => {
  const store = new FakeStore();
  const subject = DataFactory.namedNode("http://example.org/subject");
  const predicate = DataFactory.namedNode("http://example.org/predicate");
  const object = DataFactory.literal("value");
  const graph = DataFactory.defaultGraph();

  const result = store.removeMatches(subject, predicate, object, graph);

  assertEquals(store.removeMatchesCalls.length, 1);
  assertEquals(store.removeMatchesCalls[0].subject, subject);
  assertEquals(store.removeMatchesCalls[0].predicate, predicate);
  assertEquals(store.removeMatchesCalls[0].object, object);
  assertEquals(store.removeMatchesCalls[0].graph, graph);
  assertExists(result);
  assertExists(result.emit);
  assertEquals(typeof result.emit, "function");
});

Deno.test("FakeStore - removeMatches() internally calls match() and remove()", () => {
  const store = new FakeStore();
  const subject = DataFactory.namedNode("http://example.org/subject");
  const predicate = DataFactory.namedNode("http://example.org/predicate");

  store.removeMatches(subject, predicate);

  // removeMatches should have been called once
  assertEquals(store.removeMatchesCalls.length, 1);
  // removeMatches internally calls match() - this should be tracked
  assertEquals(store.matchCalls.length, 1);
  assertEquals(store.matchCalls[0].subject, subject);
  assertEquals(store.matchCalls[0].predicate, predicate);
  // removeMatches internally calls remove() with the match stream
  assertEquals(store.removeCalls.length, 1);
  assertExists(store.removeCalls[0]);
});

Deno.test("FakeStore - deleteGraph() tracks calls with Quad graph", () => {
  const store = new FakeStore();
  const graph = DataFactory.defaultGraph();

  const result = store.deleteGraph(graph);

  assertEquals(store.deleteGraphCalls.length, 1);
  assertEquals(store.deleteGraphCalls[0], graph);
  assertExists(result);
  assertExists(result.emit);
  assertEquals(typeof result.emit, "function");
});

Deno.test("FakeStore - deleteGraph() tracks calls with string graph", () => {
  const store = new FakeStore();
  const graphString = "http://example.org/graph";

  const result = store.deleteGraph(graphString);

  assertEquals(store.deleteGraphCalls.length, 1);
  assertEquals(store.deleteGraphCalls[0], graphString);
  assertExists(result);
  assertExists(result.emit);
  assertEquals(typeof result.emit, "function");
});

Deno.test("FakeStore - tracks multiple calls to all methods", () => {
  const store = new FakeStore();
  const stream1 = createFakeStream();
  const stream2 = createFakeStream();
  const subject = DataFactory.namedNode("http://example.org/subject");

  store.match(subject);
  store.match(subject);
  store.import(stream1);
  store.import(stream2);
  store.remove(stream1);
  store.removeMatches(subject);
  store.deleteGraph(DataFactory.defaultGraph());
  store.deleteGraph("http://example.org/graph");

  assertEquals(store.matchCalls.length, 3); // 2 direct + 1 from removeMatches
  assertEquals(store.importCalls.length, 2);
  assertEquals(store.removeCalls.length, 2); // 1 direct + 1 from removeMatches
  assertEquals(store.removeMatchesCalls.length, 1);
  assertEquals(store.deleteGraphCalls.length, 2);
});

Deno.test("FakeStore - call arrays are initially empty", () => {
  const store = new FakeStore();

  assertEquals(store.matchCalls.length, 0);
  assertEquals(store.importCalls.length, 0);
  assertEquals(store.removeCalls.length, 0);
  assertEquals(store.removeMatchesCalls.length, 0);
  assertEquals(store.deleteGraphCalls.length, 0);
});

Deno.test("createFakeStream() returns a valid Stream", () => {
  const stream = createFakeStream();

  assertExists(stream);
  assertExists(stream.read);
  assertEquals(typeof stream.read, "function");
  assertEquals(stream.read(), null);
});

Deno.test("createFakeStream() returns empty stream", () => {
  const stream = createFakeStream();

  // Should return null when reading (empty stream)
  assertEquals(stream.read(), null);
  assertEquals(stream.read(), null);
});
