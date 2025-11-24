// TODO: Oxigraph validator

import type { SparqlValidator } from "./sparql-validator.ts";
import { Store } from "oxigraph";

export class OxigraphSparqlValidator implements SparqlValidator {
  public constructor(private readonly store: Store = new Store()) {}

  public validate(query: string): boolean {
    try {
      this.store.query(query);
      return true;
    } catch {
      return false;
    }
  }
}
