import { Store } from "n3";
import { encodeTurtle } from "#/n3/encoding/encode-turtle.ts";
import { decodeTurtle } from "#/n3/encoding/decode-turtle.ts";

export async function createFilePersistedStore(filePath: string) {
  const n3Store = new Store();

  try {
    const data = await Deno.readTextFile(filePath);
    const loadedStore = decodeTurtle(data);
    n3Store.addQuads(loadedStore.getQuads(null, null, null, null));
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.log(`No existing ${filePath} found, starting with fresh data`);
    } else {
      throw error;
    }
  }

  return {
    n3Store,
    persist: async () => {
      const data = await encodeTurtle(n3Store);
      await Deno.writeTextFile(filePath, data);
    },
  };
}

/**
 * removeN3Store removes the persisted N3 store file.
 */
export async function removeN3Store(filePath: string): Promise<void> {
  try {
    await Deno.remove(filePath);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
}
