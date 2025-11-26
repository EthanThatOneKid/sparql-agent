import { assertEquals, assertExists } from "@std/assert";
import type * as RDF from "@rdfjs/types";
import DataFactory from "@rdfjs/data-model";
import { createFakeStream, FakeStore } from "#/rdfjs/store/fake-store.ts";
import type {
  GraphEventDetail,
  MatchEventDetail,
  StreamEventDetail,
} from "#/rdfjs/store/types.ts";
import { StoreInterceptor } from "./interceptor.ts";

Deno.test("StoreInterceptor - match dispatches match event", () => {
  const fakeStore = new FakeStore();
  const eventTarget = new StoreInterceptor(fakeStore);

  const events: Array<
    {
      subject?: RDF.Term | null;
      predicate?: RDF.Term | null;
      object?: RDF.Term | null;
      graph?: RDF.Term | null;
    }
  > = [];
  eventTarget.on("match", (detail) => events.push(detail));

  const subject = DataFactory.namedNode("http://example.org/subject");
  const predicate = DataFactory.namedNode("http://example.org/predicate");
  const object = DataFactory.literal("object");
  const graph = DataFactory.namedNode("http://example.org/graph");

  eventTarget.match(subject, predicate, object, graph);

  assertEquals(events.length, 1);
  assertExists(events[0]);
  assertEquals(events[0].subject, subject);
  assertEquals(events[0].predicate, predicate);
  assertEquals(events[0].object, object);
  assertEquals(events[0].graph, graph);

  // Verify underlying store method was called
  assertEquals(fakeStore.matchCalls.length, 1);
  assertEquals(fakeStore.matchCalls[0].subject, subject);
  assertEquals(fakeStore.matchCalls[0].predicate, predicate);
  assertEquals(fakeStore.matchCalls[0].object, object);
  assertEquals(fakeStore.matchCalls[0].graph, graph);
});

Deno.test("StoreInterceptor - match with null parameters", () => {
  const fakeStore = new FakeStore();
  const eventTarget = new StoreInterceptor(fakeStore);

  const events: MatchEventDetail[] = [];
  eventTarget.on("match", (detail) => events.push(detail));

  eventTarget.match(null, null, null, null);

  assertEquals(events.length, 1);
  assertEquals(events[0].subject, null);
  assertEquals(events[0].predicate, null);
  assertEquals(events[0].object, null);
  assertEquals(events[0].graph, null);
});

Deno.test("StoreInterceptor - import dispatches import event", () => {
  const fakeStore = new FakeStore();
  const eventTarget = new StoreInterceptor(fakeStore);

  const events: StreamEventDetail[] = [];
  eventTarget.on("import", (detail) => events.push(detail));

  const stream = createFakeStream();
  const result = eventTarget.import(stream);

  assertEquals(events.length, 1);
  assertExists(events[0]);
  assertEquals(events[0].stream, stream);

  // Verify underlying store method was called
  assertEquals(fakeStore.importCalls.length, 1);
  assertEquals(fakeStore.importCalls[0], stream);

  // Verify return value
  assertExists(result);
});

Deno.test("StoreInterceptor - remove dispatches remove event", () => {
  const fakeStore = new FakeStore();
  const eventTarget = new StoreInterceptor(fakeStore);

  const events: StreamEventDetail[] = [];
  eventTarget.on("remove", (detail) => events.push(detail));

  const stream = createFakeStream();
  const result = eventTarget.remove(stream);

  assertEquals(events.length, 1);
  assertExists(events[0]);
  assertEquals(events[0].stream, stream);

  // Verify underlying store method was called
  assertEquals(fakeStore.removeCalls.length, 1);
  assertEquals(fakeStore.removeCalls[0], stream);

  // Verify return value
  assertExists(result);
});

Deno.test("StoreInterceptor - removeMatches dispatches removematches event", () => {
  const fakeStore = new FakeStore();
  const eventTarget = new StoreInterceptor(fakeStore);

  const events: MatchEventDetail[] = [];
  eventTarget.on("removematches", (detail) => events.push(detail));

  const subject = DataFactory.namedNode("http://example.org/subject");
  const predicate = DataFactory.namedNode("http://example.org/predicate");
  const object = DataFactory.literal("object");
  const graph = DataFactory.namedNode("http://example.org/graph");

  const result = eventTarget.removeMatches(subject, predicate, object, graph);

  assertEquals(events.length, 1);
  assertExists(events[0]);
  assertEquals(events[0].subject, subject);
  assertEquals(events[0].predicate, predicate);
  assertEquals(events[0].object, object);
  assertEquals(events[0].graph, graph);

  // Verify underlying store method was called
  assertEquals(fakeStore.removeMatchesCalls.length, 1);
  assertEquals(fakeStore.removeMatchesCalls[0].subject, subject);
  assertEquals(fakeStore.removeMatchesCalls[0].predicate, predicate);
  assertEquals(fakeStore.removeMatchesCalls[0].object, object);
  assertEquals(fakeStore.removeMatchesCalls[0].graph, graph);

  // Verify return value
  assertExists(result);
});

Deno.test("StoreInterceptor - deleteGraph dispatches deletegraph event", () => {
  const fakeStore = new FakeStore();
  const eventTarget = new StoreInterceptor(fakeStore);

  const events: GraphEventDetail[] = [];
  eventTarget.on("deletegraph", (detail) => events.push(detail));

  const graph = DataFactory.namedNode("http://example.org/graph");
  const result = eventTarget.deleteGraph(graph);

  assertEquals(events.length, 1);
  assertExists(events[0]);
  assertEquals(events[0].graph, graph);

  // Verify underlying store method was called
  assertEquals(fakeStore.deleteGraphCalls.length, 1);
  assertEquals(fakeStore.deleteGraphCalls[0], graph);

  // Verify return value
  assertExists(result);
});

Deno.test("StoreInterceptor - deleteGraph with string graph", () => {
  const fakeStore = new FakeStore();
  const eventTarget = new StoreInterceptor(fakeStore);

  const events: GraphEventDetail[] = [];
  eventTarget.on("deletegraph", (detail) => events.push(detail));

  const graphString = "http://example.org/graph";
  const result = eventTarget.deleteGraph(graphString);

  assertEquals(events.length, 1);
  assertEquals(events[0].graph, graphString);

  // Verify underlying store method was called
  assertEquals(fakeStore.deleteGraphCalls.length, 1);
  assertEquals(fakeStore.deleteGraphCalls[0], graphString);

  // Verify return value
  assertExists(result);
});

Deno.test("StoreInterceptor - multiple event listeners receive events", () => {
  const fakeStore = new FakeStore();
  const eventTarget = new StoreInterceptor(fakeStore);

  const events1: MatchEventDetail[] = [];
  const events2: MatchEventDetail[] = [];

  eventTarget.on("match", (detail) => events1.push(detail));
  eventTarget.on("match", (detail) => events2.push(detail));

  eventTarget.match();

  assertEquals(events1.length, 1);
  assertEquals(events2.length, 1);
  assertExists(events1[0]);
  assertExists(events2[0]);
});

Deno.test("StoreInterceptor - match returns store's stream", () => {
  const fakeStore = new FakeStore();
  const eventTarget = new StoreInterceptor(fakeStore);

  const stream = eventTarget.match();
  assertExists(stream);
  assertEquals(typeof stream.read, "function");
});

Deno.test("StoreInterceptor - all operations can be observed", () => {
  const fakeStore = new FakeStore();
  const eventTarget = new StoreInterceptor(fakeStore);

  const allEvents: Array<{ type: string; detail: unknown }> = [];

  eventTarget.on("match", (detail) => {
    allEvents.push({ type: "match", detail });
  });
  eventTarget.on("import", (detail) => {
    allEvents.push({ type: "import", detail });
  });
  eventTarget.on("remove", (detail) => {
    allEvents.push({ type: "remove", detail });
  });
  eventTarget.on("removematches", (detail) => {
    allEvents.push({ type: "removematches", detail });
  });
  eventTarget.on("deletegraph", (detail) => {
    allEvents.push({ type: "deletegraph", detail });
  });

  // Execute all operations
  eventTarget.match();
  const stream1 = createFakeStream();
  eventTarget.import(stream1);
  const stream2 = createFakeStream();
  eventTarget.remove(stream2);
  eventTarget.removeMatches();
  eventTarget.deleteGraph("http://example.org/graph");

  // Verify all events were dispatched
  assertEquals(allEvents.length, 5);
  assertEquals(allEvents[0].type, "match");
  assertEquals(allEvents[1].type, "import");
  assertEquals(allEvents[2].type, "remove");
  assertEquals(allEvents[3].type, "removematches");
  assertEquals(allEvents[4].type, "deletegraph");
});

Deno.test("StoreInterceptor - no duplicate events when store calls methods internally", () => {
  // This test verifies that when a store implementation internally calls
  // other methods (e.g., removeMatches calling remove internally), we don't
  // get duplicate events. The underlying store calls its own methods directly,
  // not the wrapped methods, so only the top-level operation emits an event.
  const fakeStore = new FakeStore();
  const eventTarget = new StoreInterceptor(fakeStore);

  const removeEvents: StreamEventDetail[] = [];
  const removeMatchesEvents: MatchEventDetail[] = [];
  const matchEvents: MatchEventDetail[] = [];

  eventTarget.on("remove", (detail) => removeEvents.push(detail));
  eventTarget.on("removematches", (detail) => removeMatchesEvents.push(detail));
  eventTarget.on("match", (detail) => matchEvents.push(detail));

  // Call removeMatches, which internally calls match() and remove()
  // in the FakeStore implementation
  eventTarget.removeMatches();

  // We should only get ONE removematches event, not additional remove/match events
  // from the internal calls, because the store calls its own methods, not the wrapped ones
  assertEquals(removeMatchesEvents.length, 1);
  assertEquals(
    removeEvents.length,
    0,
    "Internal remove() calls should not dispatch events",
  );
  assertEquals(
    matchEvents.length,
    0,
    "Internal match() calls should not dispatch events",
  );

  // Verify the underlying store was called correctly
  assertEquals(fakeStore.removeMatchesCalls.length, 1);
  // The internal calls should still happen in the underlying store
  assertEquals(fakeStore.matchCalls.length, 1);
  assertEquals(fakeStore.removeCalls.length, 1);
});
