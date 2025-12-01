import type { Store } from "n3";
import { Writer } from "n3";

export function encodeTurtle(store: Store): string {
  const writer = new Writer({ format: "text/turtle" });
  return writer.quadsToString(store.toArray());
}
