import type * as RDF from "@rdfjs/types";
import type {
  Bindings,
  BindingsStream,
  QueryAlgebraContext,
} from "@comunica/types";
import type { QueryEngine } from "@comunica/query-sparql";
import type { ExecuteSparqlOutput, SparqlEngine } from "./tool.ts";

export class ComunicaSparqlEngine implements SparqlEngine {
  public constructor(
    private readonly queryEngine: InstanceType<typeof QueryEngine>,
    private readonly context?: QueryAlgebraContext,
  ) {}

  public async executeSparql(query: string): Promise<ExecuteSparqlOutput> {
    const result = await this.queryEngine.query(query, this.context);
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
  ): Promise<Array<Map<string, RDF.Term>>> {
    const rows: Array<Map<string, RDF.Term>> = [];
    for await (const binding of stream) {
      rows.push(this.bindingToMap(binding));
    }

    return rows;
  }

  private bindingToMap(binding: Bindings): Map<string, RDF.Term> {
    const map = new Map<string, RDF.Term>();
    for (const [variable, term] of binding) {
      map.set(this.variableToName(variable), term);
    }

    return map;
  }

  private variableToName(variable: RDF.Variable | string): string {
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
