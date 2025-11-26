import { tool } from "ai";
import { z } from "zod/v4";

/**
 * IriGenerator generates a unique IRI for an entity.
 */
export interface IriGenerator {
  generateIri: () => string;
}

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

export const generateIriInputSchema = z.object({
  name: z.string(),
});

export const generateIriOutputSchema = z.object({
  iri: z.string(),
});
