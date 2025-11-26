import type { Quad, Store, Stream, Term } from "@rdfjs/types";
import { EventEmitter } from "node:events";
import type { GraphEventDetail, QuadPattern } from "./types.ts";

/**
 * Fake Store implementation for testing
 */
export class FakeStore implements Store {
  public matchCalls: QuadPattern[] = [];
  public importCalls: Stream<Quad>[] = [];
  public removeCalls: Stream<Quad>[] = [];
  public removeMatchesCalls: QuadPattern[] = [];
  public deleteGraphCalls: Array<GraphEventDetail["graph"]> = [];

  match(
    subject?: Term | null,
    predicate?: Term | null,
    object?: Term | null,
    graph?: Term | null,
  ): Stream<Quad> {
    this.matchCalls.push({ subject, predicate, object, graph });
    const stream = new EventEmitter() as Stream<Quad>;
    stream.read = () => null;
    return stream;
  }

  import(stream: Stream<Quad>): EventEmitter {
    this.importCalls.push(stream);
    return new EventEmitter();
  }

  remove(stream: Stream<Quad>): EventEmitter {
    this.removeCalls.push(stream);
    return new EventEmitter();
  }

  removeMatches(
    subject?: Term | null,
    predicate?: Term | null,
    object?: Term | null,
    graph?: Term | null,
  ): EventEmitter {
    this.removeMatchesCalls.push({ subject, predicate, object, graph });
    // Simulate a store that internally calls remove() - this should NOT
    // trigger events in StoreEventTarget because we call this.remove(),
    // not the wrapped remove() method
    const matchStream = this.match(subject, predicate, object, graph);
    this.remove(matchStream);
    return new EventEmitter();
  }

  deleteGraph(graph: GraphEventDetail["graph"]): EventEmitter {
    this.deleteGraphCalls.push(graph);
    return new EventEmitter();
  }
}

/**
 * Helper to create a fake stream
 */
export function createFakeStream(): Stream<Quad> {
  const stream = new EventEmitter() as Stream<Quad>;
  stream.read = () => null;
  return stream;
}
