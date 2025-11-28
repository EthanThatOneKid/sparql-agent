import { Store } from "oxigraph";
import type { Term } from "@rdfjs/types";
import type {
  ExecuteSparqlOutput,
  SparqlBindings,
  SparqlEngine,
} from "#/tools/execute-sparql/sparql-engine.ts";

export type OxigraphQueryOptions = Parameters<Store["query"]>[1];

export class OxigraphSparqlEngine implements SparqlEngine {
  public constructor(
    private readonly store: InstanceType<typeof Store>,
    private readonly options?: OxigraphQueryOptions,
  ) {}

  public executeSparql(query: string): Promise<ExecuteSparqlOutput> {
    const result = this.store.query(query, this.options);
    if (this.isBindingsResult(result, query)) {
      return Promise.resolve({
        result: result.map((binding) => this.bindingToRecord(binding)),
      });
    }

    return Promise.resolve({ result });
  }

  private isBindingsResult(
    result: unknown,
    query: string,
  ): result is Array<Map<string, Term>> {
    if (!Array.isArray(result)) {
      return false;
    }

    if (result.length === 0) {
      return /^\s*select/i.test(query);
    }

    return result.every((binding) => binding instanceof Map);
  }

  private bindingToRecord(binding: Map<string, Term>): SparqlBindings {
    const record: SparqlBindings = {};
    for (const [variable, term] of binding) {
      record[typeof variable === "string" ? variable : String(variable)] = term;
    }

    return record;
  }
}
