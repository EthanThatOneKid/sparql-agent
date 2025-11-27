# Interceptor Store

A thin proxy around any RDF.js `Store` implementation that lets you observe
every method call without modifying the underlying store.

## Overview

`createInterceptorStore` wraps any RDF.js `Store` instance and runs a callback
before each intercepted method executes. The callback receives a typed event
object describing the method name and arguments for the RDF/JS Store methods
(`match`, `import`, `remove`, `removeMatches`, `deleteGraph`). This is helpful
for logging, tracing, metrics, or triggering side effects when consumers
interact with your store.

## Features

- **Spec-complete proxy**: covers the RDF/JS Store surface
  (match/import/remove/removeMatches/deleteGraph)
- **Typed callback**: receive `{ methodName, args }` with method-specific types
- **Zero deps**: just a `Proxy`, so it stays lightweight

## Installation

This module is part of the sparql-agent project. Import it as:

```ts
import { createInterceptorStore } from "./interceptor-store.ts";
```

## Usage

### Basic Example

```ts
import { Store } from "n3";
import DataFactory from "@rdfjs/data-model";
import { createInterceptorStore } from "./interceptor-store.ts";

const store = new Store();
const intercepted = createInterceptorStore(store, (event) => {
  console.log(`Store.${event.methodName} called with`, event.args);
});

intercepted.addQuad(
  DataFactory.quad(
    DataFactory.namedNode("ex:a"),
    DataFactory.namedNode("ex:b"),
    DataFactory.literal("c"),
  ),
);
```

### With Comunica Query Engine

```ts
import { createInterceptorStore } from "./interceptor-store.ts";
import { QueryEngine } from "@comunica/query-sparql-rdfjs-lite";

const intercepted = createInterceptorStore(store, ({ methodName }) => {
  if (methodName === "import") {
    console.log("Detected INSERT");
  }
});

const engine = new QueryEngine();
await engine.queryVoid(`INSERT DATA { <ex:a> <ex:b> "c" }`, {
  sources: [intercepted],
  destination: intercepted,
});
```
