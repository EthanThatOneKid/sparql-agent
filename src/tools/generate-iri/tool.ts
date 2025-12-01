import { tool } from "ai";
import { z } from "zod/v4";
import type { IriGenerator } from "./iri-generator.ts";

/**
 * createGenerateIriTool creates a tool that generates a unique IRI
 * (Internationalized Resource Identifier) for a new entity.
 */
export function createGenerateIriTool(iriGenerator: IriGenerator) {
  return tool({
    name: "generate_iri",
    description:
      "Generate a unique IRI (Internationalized Resource Identifier) for a new entity. Use this when you need to insert a new node into the graph.",
    inputSchema: z.object({
      name: z.string().optional().describe(
        "A human-readable name or label for the entity (for logging/debugging).",
      ),
      entityType: z.enum([
        "Person",
        "Organization",
        "Place",
        "Event",
        "Concept",
        "Other",
      ]).optional().describe(
        "The type of entity being created. Helps document intent.",
      ),
    }),
    outputSchema: z.object({
      iri: z.string().describe("The generated unique IRI."),
    }),
    execute: () => {
      return { iri: iriGenerator.generateIri() };
    },
  });
}
