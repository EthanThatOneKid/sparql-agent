import { assertEquals } from "@std/assert";
import { NamedNode, Quad, Store } from "n3";
import { getStore, removeStore, setStore } from "./deno-kv.ts";

Deno.test("Deno Kv: getStore, setStore, and removeStore", async (t) => {
  const kv = await Deno.openKv(":memory:");
  const exampleQuad = new Quad(
    new NamedNode("http://example.org/subject"),
    new NamedNode("http://example.org/predicate"),
    new NamedNode("http://example.org/object"),
    new NamedNode("http://example.org/graph"),
  );

  await t.step("setStore", async () => {
    const store = new Store();
    store.add(exampleQuad);

    await setStore(kv, ["example"], store);
  });

  await t.step("getStore", async () => {
    const store = await getStore(kv, ["example"]);
    const storedQuads = store?.toArray();
    assertEquals(storedQuads, [exampleQuad]);
  });

  await t.step("removeStore", async () => {
    await removeStore(kv, ["example"]);
    const store = await getStore(kv, ["example"]);
    assertEquals(store, null);
  });

  await kv.close();
});
