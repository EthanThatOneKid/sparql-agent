import { Parser } from "sparqljs";
import type { SparqlValidator } from "#/tools/validate-sparql/sparql-validator.ts";

export class SparqljsSparqlValidator implements SparqlValidator {
  public constructor(
    private readonly parser: InstanceType<typeof Parser> = new Parser(),
  ) {}

  public validateSparql(query: string): boolean {
    try {
      this.parser.parse(query);
      return true;
    } catch {
      return false;
    }
  }
}
