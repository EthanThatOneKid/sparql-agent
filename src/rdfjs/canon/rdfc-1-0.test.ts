import { assertEquals } from "@std/assert";
import { DataFactory } from "n3";
import { canonizeQuad } from "./rdfc-1-0.ts";

Deno.test("canonizeRdfc1 produces deterministic canonical output", async () => {
  const aliceQuad = DataFactory.quad(
    DataFactory.namedNode("http://example.org/alice"),
    DataFactory.namedNode("http://xmlns.com/foaf/0.1/name"),
    DataFactory.literal("Alice"),
    DataFactory.defaultGraph(),
  );

  const firstResult = await canonizeQuad(aliceQuad);
  const secondResult = await canonizeQuad(aliceQuad);

  assertEquals(
    secondResult,
    firstResult,
    "Canonical output should be stable for the same quad instance",
  );

  const structurallyEqualQuad = DataFactory.quad(
    DataFactory.namedNode("http://example.org/alice"),
    DataFactory.namedNode("http://xmlns.com/foaf/0.1/name"),
    DataFactory.literal("Alice"),
    DataFactory.defaultGraph(),
  );

  const thirdResult = await canonizeQuad(structurallyEqualQuad);

  assertEquals(
    thirdResult,
    firstResult,
    "Canonical output should be stable for equivalent quads",
  );
});
