import { create } from "@orama/orama";
import { persist, restore } from "@orama/plugin-data-persistence";
import type { FactOrama } from "#/tools/search-facts/search-engines/orama/orama-search-engine.ts";

export async function createFilePersistedOrama(filePath: string) {
  let orama: FactOrama;
  let wasCreated = false;

  try {
    const data = await Deno.readTextFile(filePath);
    const restored = await restore("json", data);
    orama = restored as FactOrama;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.log(
        `No existing ${filePath} found, starting with fresh Orama data`,
      );
      orama = await create({
        schema: {
          id: "string",
          subject: "string",
          predicate: "string",
          object: "string",
          graph: "string",
        },
      }) as FactOrama;
      wasCreated = true;
    } else {
      throw error;
    }
  }

  return {
    orama,
    wasCreated,
    persist: async () => {
      const serialized = await persist(orama, "json");
      const data = typeof serialized === "string"
        ? serialized
        : new TextDecoder().decode(serialized);
      await Deno.writeTextFile(filePath, data);
    },
  };
}
