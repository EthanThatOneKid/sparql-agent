import { Store } from "n3";
import { getAsBlob, remove, set } from "@kitsonk/kv-toolbox/blob";
import { decodeTurtle } from "#/n3/encoding/decode-turtle.ts";
import { encodeTurtle } from "#/n3/encoding/encode-turtle.ts";

// Reference:
// - https://jsr.io/@kitsonk/kv-toolbox
// - https://jsr.io/@deno/kv-utils
//

export async function getStore(
  kv: Deno.Kv,
  key: Deno.KvKey,
): Promise<Store | null> {
  const file = await getAsBlob(kv, key);
  if (file !== null) {
    const turtle = await file.text();
    return decodeTurtle(turtle);
  }

  return null;
}

export async function setStore(kv: Deno.Kv, key: Deno.KvKey, store: Store) {
  const turtle = encodeTurtle(store);
  const data = new TextEncoder().encode(turtle);
  const blob = new Blob([data], { type: "text/turtle" });
  await set(kv, key, blob);
}

export async function removeStore(kv: Deno.Kv, key: Deno.KvKey) {
  await remove(kv, key);
}
