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
    description:
      `Generate a unique IRI (Internationalized Resource Identifier) for a new entity that doesn't exist in the knowledge base. Use this tool AFTER searching with searchFacts confirms the entity doesn't exist. The generated IRI is guaranteed to be unique and can be used immediately in SPARQL INSERT queries to create new entities.`,
    inputSchema: generateIriInputSchema,
    outputSchema: generateIriOutputSchema,
    execute: () => {
      const iri = iriGenerator.generateIri();
      return { iri };
    },
  });
}
