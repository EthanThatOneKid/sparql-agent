import type { Store } from "n3";
import { Cloudflare } from "cloudflare";
import type { RequestOptions } from "cloudflare/core";
import { decodeTurtle } from "#/n3/encoding/decode-turtle.ts";
import { encodeTurtle } from "#/n3/encoding/encode-turtle.ts";

/**
 * getStore gets a store from the Cloudflare KV namespace.
 *
 * @see
 * https://developers.cloudflare.com/api/resources/kv/subresources/namespaces/subresources/values/methods/get/
 */
export async function getStore(
  client: Cloudflare,
  namespaceId: string,
  keyName: string,
  params: Cloudflare.KV.Namespaces.Values.ValueGetParams,
  requestOptions?: RequestOptions,
) {
  const response = await client.kv.namespaces.values.get(
    namespaceId,
    keyName,
    params,
    requestOptions,
  );

  const turtle = await response.text();
  return decodeTurtle(turtle);
}

/**
 * setStore sets a store in the Cloudflare KV namespace.
 *
 * @see
 * https://developers.cloudflare.com/api/resources/kv/subresources/namespaces/subresources/values/methods/update/
 */
export async function setStore(
  client: Cloudflare,
  namespaceId: string,
  keyName: string,
  store: Store,
  params: Omit<Cloudflare.KV.Namespaces.Values.ValueUpdateParams, "value">,
  requestOptions?: RequestOptions,
) {
  const turtle = encodeTurtle(store);
  const response = await client.kv.namespaces.values.update(
    namespaceId,
    keyName,
    { ...params, value: turtle },
    requestOptions,
  );
  if (response === null) {
    throw new Error("Failed to set store");
  }
}

/**
 * removeStore removes a store from the Cloudflare KV namespace.
 *
 * @see
 * https://developers.cloudflare.com/api/resources/kv/subresources/namespaces/subresources/values/methods/delete/
 */
export async function removeStore(
  client: Cloudflare,
  namespaceId: string,
  keyName: string,
  params: Cloudflare.KV.Namespaces.Values.ValueDeleteParams,
  requestOptions?: RequestOptions,
) {
  const response = await client.kv.namespaces.values.delete(
    namespaceId,
    keyName,
    params,
    requestOptions,
  );
  if (response === null) {
    throw new Error("Failed to delete store");
  }
}

/**
 * _createFakeCloudflareClient creates a fake Cloudflare client for testing.
 */
export function _createFakeCloudflareClient(
  responses: {
    get: Response;
    update: Response;
    delete: Response;
  },
) {
  return {
    kv: {
      namespaces: {
        values: {
          get: (
            _namespaceId: string,
            _keyName: string,
            _params: Cloudflare.KV.Namespaces.Values.ValueGetParams,
            _requestOptions?: RequestOptions,
          ) => {
            return Promise.resolve(responses.get);
          },
          update: (
            _namespaceId: string,
            _keyName: string,
            _params: Cloudflare.KV.Namespaces.Values.ValueUpdateParams,
            _requestOptions?: RequestOptions,
          ) => {
            return Promise.resolve(responses.update);
          },
          delete: (
            _namespaceId: string,
            _keyName: string,
            _params: Cloudflare.KV.Namespaces.Values.ValueDeleteParams,
            _requestOptions?: RequestOptions,
          ) => {
            return Promise.resolve(responses.delete);
          },
        },
      },
    },
  };
}
