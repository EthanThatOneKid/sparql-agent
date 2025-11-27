import type { Quad, Term } from "@rdfjs/types";
import DataFactory from "@rdfjs/data-model";
import { insert, remove, search } from "@orama/orama";
import type { OramaTripleStore } from "#/tools/search-facts/engines/orama/orama.ts";
import type {
  GraphEventDetail,
  MatchEventDetail,
  QuadEventDetail,
  StreamEventDetail,
} from "./interceptor.ts";
import { StoreInterceptor } from "./interceptor.ts";

/**
 * Converts an RDF.js Quad to an Orama document.
 */
export function fromQuad(quad: Quad) {
  return {
    subject: quad.subject.value,
    predicate: quad.predicate.value,
    object: quad.object.value,
    graph: quad.graph.value || "",
  };
}

/**
 * Searches Orama for documents matching the given quad properties
 * and returns their document IDs.
 */
async function findMatchingDocumentIds(
  orama: OramaTripleStore,
  doc: ReturnType<typeof fromQuad>,
): Promise<string[]> {
  const where: Record<string, { eq: string }> = {};
  if (doc.subject) where.subject = { eq: doc.subject };
  if (doc.predicate) where.predicate = { eq: doc.predicate };
  if (doc.object) where.object = { eq: doc.object };
  // Include graph even if it's an empty string (for default graph)
  if (doc.graph !== undefined) where.graph = { eq: doc.graph };

  const results = await search(orama, {
    where,
    limit: 1000, // Get all matching documents
  });

  return results.hits.map((hit) => hit.id);
}

/**
 * Removes a quad from Orama by searching for matching documents
 * and removing them by ID.
 */
async function removeQuadFromOrama(
  orama: OramaTripleStore,
  quad: Quad,
): Promise<void> {
  const doc = fromQuad(quad);
  const ids = await findMatchingDocumentIds(orama, doc);
  for (const id of ids) {
    await remove(orama, id);
  }
}

/**
 * Converts an RDF.js Stream to an async iterable.
 * Handles both event-based streams and directly async iterable streams.
 */
async function* streamToAsyncIterable(
  stream: import("@rdfjs/types").Stream<Quad>,
): AsyncIterable<Quad> {
  // Check if stream is directly async iterable (e.g., N3 Store streams)
  if (
    Symbol.asyncIterator in stream &&
    typeof stream[Symbol.asyncIterator] === "function"
  ) {
    yield* stream as AsyncIterable<Quad>;
    return;
  }

  // Fall back to event-based stream processing
  const quads: Quad[] = [];
  let streamEnded = false;
  let streamError: Error | null = null;

  // Collect quads from stream events
  stream.on("data", (quad: Quad) => {
    quads.push(quad);
  });

  stream.on("end", () => {
    streamEnded = true;
  });

  stream.on("error", (error: Error) => {
    streamError = error;
  });

  // Read any immediately available quads
  let quad: Quad | null;
  while ((quad = stream.read()) !== null) {
    quads.push(quad);
  }

  // Wait for stream to end or error
  await new Promise<void>((resolve, reject) => {
    if (streamEnded) {
      resolve();
      return;
    }
    if (streamError) {
      reject(streamError);
      return;
    }

    const endHandler = () => {
      stream.off("error", errorHandler);
      resolve();
    };
    const errorHandler = (error: Error) => {
      stream.off("end", endHandler);
      reject(error);
    };

    stream.once("end", endHandler);
    stream.once("error", errorHandler);
  });

  // Yield all collected quads
  for (const q of quads) {
    yield q;
  }
}

/**
 * Processes a stream of quads asynchronously.
 */
async function processStream(
  stream: import("@rdfjs/types").Stream<Quad>,
  processor: (quad: Quad) => void | Promise<void>,
): Promise<void> {
  for await (const quad of streamToAsyncIterable(stream)) {
    await processor(quad);
  }
}

/**
 * Synchronizes an RDF.js StoreInterceptor with an Orama triple store.
 * Sets up event listeners to keep Orama in sync with the RDF store.
 *
 * @param interceptor The StoreInterceptor to observe
 * @param orama The Orama triple store to sync with
 * @returns A cleanup function that removes all event listeners
 *
 * @example
 * ```typescript
 * const interceptor = new StoreInterceptor(store);
 * const orama = createOramaTripleStore();
 * const cleanup = syncStoreInterceptorWithOrama(interceptor, orama);
 * // ... use interceptor ...
 * cleanup(); // Remove event listeners when done
 * ```
 */
export function syncStoreInterceptorWithOrama(
  interceptor: StoreInterceptor,
  orama: OramaTripleStore,
): () => void {
  // Import handler: insert all quads from stream into Orama
  const importHandler = async (detail: StreamEventDetail) => {
    await processStream(detail.stream, async (quad) => {
      await insert(orama, fromQuad(quad));
    });
  };

  // Insert handler: insert single quad into Orama
  const insertHandler = async (detail: QuadEventDetail) => {
    await insert(orama, fromQuad(detail.quad));
  };

  // Remove handler: remove all quads from stream from Orama
  const removeHandler = async (detail: StreamEventDetail) => {
    await processStream(detail.stream, async (quad) => {
      await removeQuadFromOrama(orama, quad);
    });
  };

  // RemoveMatches handler: match pattern in store, then remove from Orama
  const removeMatchesHandler = async (detail: MatchEventDetail) => {
    const stream = interceptor.match(
      detail.subject,
      detail.predicate,
      detail.object,
      detail.graph,
    );
    await processStream(stream, async (quad) => {
      await removeQuadFromOrama(orama, quad);
    });
  };

  // DeleteGraph handler: match all quads in graph, then remove from Orama
  const deleteGraphHandler = async (detail: GraphEventDetail) => {
    const graphTerm: Term | null = typeof detail.graph === "string"
      ? DataFactory.namedNode(detail.graph)
      : detail.graph;
    const stream = interceptor.match(null, null, null, graphTerm);
    await processStream(stream, async (quad) => {
      await removeQuadFromOrama(orama, quad);
    });
  };

  // Register all event listeners
  interceptor.on("import", importHandler);
  interceptor.on("insert", insertHandler);
  interceptor.on("remove", removeHandler);
  interceptor.on("removematches", removeMatchesHandler);
  interceptor.on("deletegraph", deleteGraphHandler);

  // Return cleanup function
  return () => {
    interceptor.off("import", importHandler);
    interceptor.off("insert", insertHandler);
    interceptor.off("remove", removeHandler);
    interceptor.off("removematches", removeMatchesHandler);
    interceptor.off("deletegraph", deleteGraphHandler);
  };
}
