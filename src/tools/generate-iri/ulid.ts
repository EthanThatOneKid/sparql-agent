import { ulid } from "@std/ulid/ulid";
import type { IriGenerator } from "./tool.ts";

/**
 * UlidIriGenerator generates a unique IRI for an entity with
 * Universally Unique Lexicographically Sortable Identifiers (ULIDs).
 * @see https://github.com/ulid/spec
 */
export class UlidIriGenerator implements IriGenerator {
  public constructor(
    private readonly prefix: string,
    private readonly generateUlid: () => string = ulid,
  ) {}

  public generateIri(): string {
    return `${this.prefix}${this.generateUlid()}`;
  }
}
