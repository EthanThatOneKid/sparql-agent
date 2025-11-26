import type { Quad, Store, Stream, Term } from "@rdfjs/types";
import { EventEmitter } from "node:events";

/**
 * StoreInterceptor provides observability for all Store operations
 * by emitting events for read and write operations.
 *
 * **Important**: This class only emits events for operations called
 * directly on the StoreInterceptor instance. If the underlying store
 * implementation internally calls other store methods (e.g., `removeMatches`
 * calling `remove` internally), those internal calls will NOT emit
 * additional events, because the store calls its own methods directly,
 * not the wrapped methods. This ensures no duplicate events are emitted.
 *
 * Example:
 * ```typescript
 * const store = new SomeStore();
 * const interceptor = new StoreInterceptor(store);
 *
 * // If store.removeMatches() internally calls store.remove(),
 * // only one "removematches" event will be emitted, not a "remove" event
 * interceptor.removeMatches(subject, predicate, object, graph);
 * ```
 */
export class StoreInterceptor extends EventEmitter implements Store {
  public constructor(private readonly store: Store) {
    super();
  }

  /**
   * Match quads in the store (read operation from Source interface).
   * Emits a "match" event.
   */
  match(
    subject?: Term | null,
    predicate?: Term | null,
    object?: Term | null,
    graph?: Term | null,
  ): Stream<Quad> {
    this.emit("match", { subject, predicate, object, graph });
    return this.store.match(subject, predicate, object, graph);
  }

  /**
   * Import quads into the store (write operation from Sink interface).
   * Emits an "import" event.
   */
  import(stream: Stream<Quad>): EventEmitter {
    this.emit("import", { stream });
    return this.store.import(stream);
  }

  /**
   * Remove quads from the store.
   * Emits a "remove" event.
   */
  remove(stream: Stream<Quad>): EventEmitter {
    this.emit("remove", { stream });
    return this.store.remove(stream);
  }

  /**
   * Remove all quads matching the pattern.
   * Emits a "removematches" event.
   */
  removeMatches(
    subject?: Term | null,
    predicate?: Term | null,
    object?: Term | null,
    graph?: Term | null,
  ): EventEmitter {
    this.emit("removematches", { subject, predicate, object, graph });
    return this.store.removeMatches(subject, predicate, object, graph);
  }

  /**
   * Delete the given named graph.
   * Emits a "deletegraph" event.
   */
  deleteGraph(graph: Quad["graph"] | string): EventEmitter {
    this.emit("deletegraph", { graph });
    return this.store.deleteGraph(graph);
  }
}
