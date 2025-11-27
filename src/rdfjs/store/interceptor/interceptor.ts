import type { Quad, Store, Stream, Term } from "@rdfjs/types";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";

/**
 * QuadPattern is a pattern for matching quads in a store.
 * All fields are optional and can be null to match any value.
 */
export interface QuadPattern {
  subject?: Term | null;
  predicate?: Term | null;
  object?: Term | null;
  graph?: Term | null;
}

/**
 * StreamEventDetail is the detail for import and remove operations.
 */
export interface StreamEventDetail {
  stream: Stream<Quad>;
}

/**
 * GraphEventDetail is the detail for deleteGraph operations.
 */
export interface GraphEventDetail {
  graph: Quad["graph"] | string;
}

/**
 * MatchEventDetail is the detail for match and removematches operations.
 */
export interface MatchEventDetail extends QuadPattern {}

/**
 * QuadEventDetail is the detail for insert operations (single quad).
 */
export interface QuadEventDetail {
  quad: Quad;
}

/**
 * Event map that maps event names to their detail types.
 * This provides type safety for event listeners.
 */
export interface StoreInterceptorEventMap {
  match: MatchEventDetail;
  import: StreamEventDetail;
  remove: StreamEventDetail;
  removematches: MatchEventDetail;
  deletegraph: GraphEventDetail;
  insert: QuadEventDetail;
}

/**
 * Type-safe event emitter interface for StoreInterceptor.
 * Extends EventEmitter with typed methods based on the event map.
 */
export interface TypedStoreInterceptorEmitter {
  on<K extends keyof StoreInterceptorEventMap>(
    event: K,
    listener: (detail: StoreInterceptorEventMap[K]) => void,
  ): this;
  once<K extends keyof StoreInterceptorEventMap>(
    event: K,
    listener: (detail: StoreInterceptorEventMap[K]) => void,
  ): this;
  off<K extends keyof StoreInterceptorEventMap>(
    event: K,
    listener: (detail: StoreInterceptorEventMap[K]) => void,
  ): this;
  emit<K extends keyof StoreInterceptorEventMap>(
    event: K,
    detail: StoreInterceptorEventMap[K],
  ): boolean;
}

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
export class StoreInterceptor extends EventEmitter
  implements Store, TypedStoreInterceptorEmitter {
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
    this.emit(
      "match",
      { subject, predicate, object, graph } satisfies MatchEventDetail,
    );
    return this.store.match(subject, predicate, object, graph);
  }

  /**
   * Import quads into the store (write operation from Sink interface).
   * Emits an "import" event.
   */
  import(stream: Stream<Quad>): EventEmitter {
    this.emit("import", { stream } satisfies StreamEventDetail);
    return this.store.import(stream);
  }

  /**
   * Remove quads from the store.
   * Emits a "remove" event.
   */
  remove(stream: Stream<Quad>): EventEmitter {
    this.emit("remove", { stream } satisfies StreamEventDetail);
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
    this.emit(
      "removematches",
      { subject, predicate, object, graph } satisfies MatchEventDetail,
    );
    return this.store.removeMatches(subject, predicate, object, graph);
  }

  /**
   * Delete the given named graph.
   * Emits a "deletegraph" event.
   */
  deleteGraph(graph: Quad["graph"] | string): EventEmitter {
    this.emit("deletegraph", { graph } satisfies GraphEventDetail);
    return this.store.deleteGraph(graph);
  }

  /**
   * Insert a single quad into the store.
   * Emits an "insert" event.
   * Note: This method is not part of the standard RDF.js Store interface,
   * but many stores (like Quadstore) implement it.
   */
  async put(quad: Quad): Promise<void> {
    this.emit("insert", { quad } satisfies QuadEventDetail);
    const storeWithPut = this.store as Store & {
      put?: (quad: Quad) => Promise<void>;
    };
    if (storeWithPut.put) {
      await storeWithPut.put(quad);
    } else {
      // Fallback: create a stream with a single quad and use import
      const stream = Readable.from([quad], { objectMode: true });
      return new Promise<void>((resolve, reject) => {
        const result = this.store.import(stream as unknown as Stream<Quad>);
        result.on("end", () => resolve());
        result.on("error", (error) => reject(error));
      });
    }
  }
}
