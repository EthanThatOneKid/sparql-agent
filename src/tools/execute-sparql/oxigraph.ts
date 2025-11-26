import { Store } from "oxigraph";
import type { ExecuteSparqlResult, SparqlEngine } from "./tool.ts";

export type OxigraphQueryOptions = Parameters<Store["query"]>[1];

export class OxigraphSparqlEngine implements SparqlEngine {
  public constructor(
    private readonly store: InstanceType<typeof Store>,
    private readonly options?: OxigraphQueryOptions,
  ) {}

  public executeSparql(query: string): Promise<ExecuteSparqlResult> {
    const result = this.store.query(query, this.options);
    return Promise.resolve(result);
  }
}
