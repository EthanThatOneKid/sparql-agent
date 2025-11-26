import type { SparqlQueryResult } from "./schema.ts";

/**
 * SparqlEngine is the interface for a SPARQL query engine.
 *
 * This interface provides a unified abstraction for executing SPARQL queries
 * across different query engine implementations (e.g., Comunica, Oxigraph).
 *
 * All implementations must:
 * - Accept a SPARQL query string
 * - Return results in the standardized SparqlQueryResult format
 * - Handle all SPARQL query types (SELECT, ASK, CONSTRUCT, DESCRIBE, UPDATE)
 *
 * @example
 * ```typescript
 * const engine = new OxigraphSparqlEngine(store);
 * const result = await engine.executeQuery("SELECT * WHERE { ?s ?p ?o } LIMIT 10");
 * ```
 */
export interface SparqlEngine {
  /**
   * executeQuery executes a SPARQL query and returns the result in a
   * standardized format.
   */
  executeQuery(query: string): Promise<SparqlQueryResult>;
}
