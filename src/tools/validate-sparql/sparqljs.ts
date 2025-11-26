import { Parser } from "sparqljs";
import type { SparqlValidator } from "./tool.ts";

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
