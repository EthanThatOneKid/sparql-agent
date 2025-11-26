import type { QueryAlgebraContext } from "@comunica/types";
import { QueryEngine } from "@comunica/query-sparql";
import type { ExecuteSparqlResult, SparqlEngine } from "./tool.ts";

export class ComunicaSparqlEngine implements SparqlEngine {
  public constructor(
    private readonly queryEngine: InstanceType<typeof QueryEngine>,
    private readonly context?: QueryAlgebraContext,
  ) {}

  public executeSparql(_query: string): Promise<ExecuteSparqlResult> {
    // const result = await this.queryEngine.query(query, this.context);
    throw new Error("Not implemented");
  }
}
