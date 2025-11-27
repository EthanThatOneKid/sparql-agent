import type { Quad } from "@rdfjs/types";
import { insert, remove as oramaRemove, search } from "@orama/orama";
import type { OramaTripleStore } from "#/tools/search-facts/engines/orama/orama.ts";
import type { MatchEventDetail, StreamEventDetail } from "./interceptor.ts";
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
 * Sets up synchronization between a StoreInterceptor and an Orama store.
 * When quads are added or removed from the store, they are automatically
 * synced to/from the Orama store.
 *
 * @param interceptor The StoreInterceptor to observe
 * @param oramaStore The Orama store to sync with
 * @returns A cleanup function to remove the event listeners
 */
export function syncStoreInterceptorWithOrama(
  interceptor: StoreInterceptor,
  oramaStore: OramaTripleStore,
): () => void {
  // Track document IDs for Orama synchronization.
  // Maps quad signature (subject|predicate|object|graph) to Orama document ID.
  const oramaDocIds = new Map<string, string>();

  // Sync import events: when quads are added to the store, add them to Orama.
  const handleImport = (detail: StreamEventDetail) => {
    const stream = detail.stream;
    (async () => {
      // Handle EventEmitter streams first (includes Readable streams from Node.js).
      // Readable streams have both read() and on(), so we check on() first.
      if (stream.on) {
        const insertPromises: Promise<void>[] = [];
        await new Promise<void>((resolve, reject) => {
          stream.on("data", (quad: Quad) => {
            const insertPromise = (async () => {
              const doc = fromQuad(quad);
              const docId = await insert(oramaStore, doc);
              const quadKey =
                `${doc.subject}|${doc.predicate}|${doc.object}|${doc.graph}`;
              oramaDocIds.set(quadKey, docId);
            })();
            insertPromises.push(insertPromise);
          });
          stream.on("end", async () => {
            // Wait for all insert operations to complete before resolving
            await Promise.all(insertPromises);
            resolve();
          });
          stream.on("error", (error) => {
            reject(error);
          });
        });
      } else if (Symbol.asyncIterator in stream) {
        // Handle async iterable streams (Quadstore's import returns this).
        for await (const quad of stream as unknown as AsyncIterable<Quad>) {
          const doc = fromQuad(quad);
          const docId = await insert(oramaStore, doc);
          const quadKey =
            `${doc.subject}|${doc.predicate}|${doc.object}|${doc.graph}`;
          oramaDocIds.set(quadKey, docId);
        }
      } else if (typeof stream.read === "function") {
        // Handle readable streams with synchronous read() method.
        const insertPromises: Promise<void>[] = [];
        let quad: Quad | null;
        while ((quad = stream.read()) !== null) {
          const insertPromise = (async () => {
            const doc = fromQuad(quad!);
            const docId = await insert(oramaStore, doc);
            const quadKey =
              `${doc.subject}|${doc.predicate}|${doc.object}|${doc.graph}`;
            oramaDocIds.set(quadKey, docId);
          })();
          insertPromises.push(insertPromise);
        }
        // Wait for all insert operations to complete
        await Promise.all(insertPromises);
      }
    })();
  };

  // Sync removematches events: when quads are removed from the store, remove them from Orama.
  const handleRemoveMatches = async (detail: MatchEventDetail) => {
    // Match the quads being removed from the store.
    // Quadstore's match has stricter types, so we use the interceptor which handles the types correctly.
    const matchStream = interceptor.match(
      detail.subject,
      detail.predicate,
      detail.object,
      detail.graph,
    );

    const quadsToRemove: Quad[] = [];
    // Quadstore's match returns an async iterable.
    if (Symbol.asyncIterator in matchStream) {
      for await (const quad of matchStream as unknown as AsyncIterable<Quad>) {
        quadsToRemove.push(quad);
      }
    }

    // Remove each quad from Orama using tracked document IDs.
    for (const quad of quadsToRemove) {
      const doc = fromQuad(quad);
      const quadKey =
        `${doc.subject}|${doc.predicate}|${doc.object}|${doc.graph}`;
      const docId = oramaDocIds.get(quadKey);
      if (docId) {
        await oramaRemove(oramaStore, docId);
        oramaDocIds.delete(quadKey);
      } else {
        // If ID not tracked, search for the document in Orama.
        const results = await search(oramaStore, {
          term: doc.object,
          properties: ["object"],
          limit: 100,
        });
        for (const hit of results.hits) {
          const hitDoc = hit.document;
          if (
            hitDoc.subject === doc.subject &&
            hitDoc.predicate === doc.predicate &&
            hitDoc.object === doc.object &&
            hitDoc.graph === doc.graph
          ) {
            await oramaRemove(oramaStore, hit.id);
            break;
          }
        }
      }
    }
  };

  // Set up event listeners.
  interceptor.on("import", handleImport);
  interceptor.on("removematches", handleRemoveMatches);

  // Return cleanup function to remove listeners.
  return () => {
    interceptor.off("import", handleImport);
    interceptor.off("removematches", handleRemoveMatches);
  };
}
