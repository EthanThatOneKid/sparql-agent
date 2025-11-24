// TODO: Oxigraph validator

import type { SparqlValidator } from "./sparql-validator.ts";
import { Store } from "oxigraph";

/**
 * OxigraphSparqlValidator validates SPARQL queries using Oxigraph.
 * Oxigraph validates SPARQL queries 5x faster than Sparqljs and TreeSitter.
 */
export class OxigraphSparqlValidator implements SparqlValidator {
  public validate(query: string): boolean {
    try {
      const store = new Store();
      store.query(query);
      return true;
    } catch {
      return false;
    }
  }
}
