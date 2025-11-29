import type { IriGenerator } from "#/tools/generate-iri/iri-generator.ts";

export class FakeIriGenerator implements IriGenerator {
  public constructor(private readonly fakeIri: string) {}

  public generateIri(): string {
    return this.fakeIri;
  }
}
