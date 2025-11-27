import { tool } from "ai";
import type { IriGenerator } from "./iri-generator.ts";
import {
  generateIriInputSchema,
  generateIriOutputSchema,
} from "./iri-generator.ts";

/**
 * createGenerateIriTool creates a tool that generates a unique IRI for an entity.
 */
export function createGenerateIriTool(iriGenerator: IriGenerator) {
  return tool({
    name: "generateIri",
    description: "Generates a unique IRI for an entity",
    inputSchema: generateIriInputSchema,
    outputSchema: generateIriOutputSchema,
    execute: () => {
      const iri = iriGenerator.generateIri();
      return { iri };
    },
  });
}
