import type { IriGenerator } from "#/tools/generate-iri/iri-generator.ts";

/**
 * UuidIriGenerator generates a unique IRI for an entity using a UUID.
 */
export class UuidIriGenerator implements IriGenerator {
  public constructor(private readonly prefix: string) {}

  public generateIri(): string {
    return `${this.prefix}${crypto.randomUUID()}`;
  }
}
