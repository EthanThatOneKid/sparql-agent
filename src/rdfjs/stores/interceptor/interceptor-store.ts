import type { Store } from "@rdfjs/types";

/**
 * Spec-defined RDF/JS store methods. See https://rdf.js.org/stream-spec/.
 */
export const methods = [
  "match",
  "import",
  "remove",
  "removeMatches",
  "deleteGraph",
] as const;

/**
 * InterceptorMethodArgs is a mapping of intercepted method names to their
 * argument tuples.
 */
export type InterceptorMethodArgs = {
  match: Parameters<Store["match"]>;
  import: Parameters<Store["import"]>;
  remove: Parameters<Store["remove"]>;
  removeMatches: Parameters<Store["removeMatches"]>;
  deleteGraph: Parameters<Store["deleteGraph"]>;
};

/** InterceptorMethodName is a literal union of all intercepted method names. */
export type InterceptorMethodName = keyof InterceptorMethodArgs;

/**
 * InterceptorEvent is a discriminated union describing a single intercepted
 * call and its arguments.
 */
type SpecInterceptorEvent = {
  [TMethod in InterceptorMethodName]: {
    methodName: TMethod;
    args: InterceptorMethodArgs[TMethod];
  };
}[InterceptorMethodName];

export type InterceptorEvent = SpecInterceptorEvent;

/** InterceptorCallback is a callback invoked before each intercepted method. */
export type InterceptorCallback = (event: InterceptorEvent) => void;

/**
 * createInterceptorStore creates an interceptor store that wraps an
 * RDF/JS Store and intercepts all method calls.
 */
export function createInterceptorStore(
  store: Store,
  fn: InterceptorCallback,
): Store {
  return new Proxy(store, {
    get(target, prop, receiver) {
      const methodFn = Reflect.get(target, prop, receiver);
      if (typeof methodFn !== "function" || !isInterceptorMethod(prop)) {
        return methodFn;
      }

      return function (...args: unknown[]) {
        const event = toInterceptorEvent(prop, args);
        fn(event);

        return methodFn.apply(target, args);
      };
    },
  });
}

function isInterceptorMethod(
  prop: string | symbol,
): prop is InterceptorMethodName {
  return typeof prop === "string" &&
    methods.includes(prop as InterceptorMethodName);
}

function toInterceptorEvent(
  methodName: InterceptorMethodName,
  args: unknown[],
): SpecInterceptorEvent {
  switch (methodName) {
    case "match": {
      return { methodName, args: args as InterceptorMethodArgs["match"] };
    }

    case "import": {
      return { methodName, args: args as InterceptorMethodArgs["import"] };
    }

    case "remove": {
      return { methodName, args: args as InterceptorMethodArgs["remove"] };
    }

    case "removeMatches": {
      return {
        methodName,
        args: args as InterceptorMethodArgs["removeMatches"],
      };
    }

    case "deleteGraph": {
      return {
        methodName,
        args: args as InterceptorMethodArgs["deleteGraph"],
      };
    }
  }
}
