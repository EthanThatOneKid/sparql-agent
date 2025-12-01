import { Store } from "n3";
import { Parser } from "n3";

export function decodeTurtle(turtle: string): Store {
  const parser = new Parser();
  const quads = parser.parse(turtle);
  const store = new Store();
  store.addQuads(quads);
  return store;
}
