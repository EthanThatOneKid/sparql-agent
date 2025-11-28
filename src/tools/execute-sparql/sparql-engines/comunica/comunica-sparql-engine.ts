import type { Term, Variable } from "@rdfjs/types";
import type {
  Bindings,
  BindingsStream,
  QueryAlgebraContext,
} from "@comunica/types";
import type { QueryEngine } from "@comunica/query-sparql";
import type {
  ExecuteSparqlOutput,
  SparqlEngine,
} from "#/tools/execute-sparql/sparql-engine.ts";

/**
 * ComunicaSparqlEngineOptions are the options for creating a
 * ComunicaSparqlEngine.
 */
export interface ComunicaSparqlEngineOptions {
  /**
   * queryEngine is the Comunica QueryEngine to use for executing SPARQL queries.
   */
  queryEngine: InstanceType<typeof QueryEngine>;

  /**
   * context is the context for the Comunica QueryEngine.
   */
  context?: QueryAlgebraContext;
}

/**
 * ComunicaSparqlEngine is a SPARQL engine that uses Comunica.
 *
 * ComunicaSparqlEngine narrows the scope of the Comunica QueryEngine
 * to a simplified API for executing SPARQL queries.
 */
export class ComunicaSparqlEngine implements SparqlEngine {
  public constructor(
    private readonly options: ComunicaSparqlEngineOptions,
  ) {}

  public async executeSparql(query: string): Promise<ExecuteSparqlOutput> {
    const result = await this.options.queryEngine.query(
      query,
      this.options.context,
    );
    switch (result.resultType) {
      case "bindings": {
        const bindingsStream = await result.execute();
        return await this.collectBindings(bindingsStream);
      }

      case "boolean": {
        return await result.execute();
      }

      case "quads": {
        const quadStream = await result.execute();
        return await this.collectQuads(quadStream);
      }

      case "void": {
        await result.execute();

        // TODO: Return message as string.
        return "";
      }

      default: {
        throw new Error("Unexpected result type");
      }
    }
  }

  private async collectBindings(
    stream: BindingsStream,
  ): Promise<Array<Map<string, Term>>> {
    const rows: Array<Map<string, Term>> = [];
    for await (const binding of stream) {
      rows.push(this.bindingToMap(binding));
    }

    return rows;
  }

  private bindingToMap(binding: Bindings): Map<string, Term> {
    const map = new Map<string, Term>();
    for (const [variable, term] of binding) {
      map.set(this.variableToName(variable), term);
    }

    return map;
  }

  private variableToName(variable: Variable | string): string {
    if (typeof variable === "string") {
      return variable.startsWith("?") ? variable.slice(1) : variable;
    }

    return variable.value;
  }

  private async collectQuads<T>(stream: AsyncIterable<T>): Promise<T[]> {
    const items: T[] = [];
    for await (const item of stream) {
      items.push(item);
    }

    return items;
  }
}
