// @deno-types="@types/n3"
import { Store } from "n3";
import type { Quad } from "@rdfjs/types";
import * as rdfCanonize from "rdf-canonize";
import { encodeBase64Url } from "@std/encoding/base64url";

/**
 * skolemizeQuad skolemizes an RDF/JS Quad to a base64url-encoded
 * RDFC-1.0 unique canonical identifier.
 */
export async function skolemizeQuad(quad: Quad): Promise<string> {
  const canonical = await canonizeQuad(quad);
  const encoded = new TextEncoder().encode(canonical);
  return encodeBase64Url(encoded);
}

/**
 * canonizeQuad canonizes an RDF/JS Quad to RDFC-1.0.
 *
 * @see https://www.w3.org/TR/rdf-canon
 */
export async function canonizeQuad(quad: Quad): Promise<string> {
  const store = new Store([quad]);
  return await rdfCanonize.canonize(store, {
    algorithm: "RDFC-1.0",
    format: "application/n-quads",
  });
}
