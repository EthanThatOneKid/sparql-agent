import type {
  ExecuteSparqlOutput,
  SparqlEngine,
} from "#/tools/execute-sparql/sparql-engine.ts";

export class FakeSparqlEngine implements SparqlEngine {
  public constructor(private readonly fakeResult: ExecuteSparqlOutput) {}

  public executeSparql(_query: string): Promise<ExecuteSparqlOutput> {
    return Promise.resolve(this.fakeResult);
  }
}
