import type { Quad, Stream, Term } from "@rdfjs/types";

/**
 * A pattern for matching quads in a store.
 * All fields are optional and can be null to match any value.
 */
export interface QuadPattern {
  subject?: Term | null;
  predicate?: Term | null;
  object?: Term | null;
  graph?: Term | null;
}

/**
 * Event detail for import and remove operations.
 */
export interface StreamEventDetail {
  stream: Stream<Quad>;
}

/**
 * Event detail for deleteGraph operations.
 */
export interface GraphEventDetail {
  graph: Quad["graph"] | string;
}

/**
 * Event detail for match and removematches operations.
 */
export interface MatchEventDetail extends QuadPattern {}
