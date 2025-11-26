# StoreInterceptor

A wrapper around RDF.js `Store` implementations that provides observability by
emitting events for all store operations.

## Overview

`StoreInterceptor` wraps any RDF.js `Store` implementation and emits events
whenever store operations are performed. This allows you to monitor, log, or
react to all read and write operations without modifying the underlying store
implementation.

## Features

- **Full Store Interface**: Implements the complete RDF.js `Store` interface, so
  it can be used as a drop-in replacement
- **Event-Driven Observability**: Emits events for all store operations (read,
  write, delete)
- **No Duplicate Events**: Internal method calls within the underlying store
  don't emit duplicate events
- **Type-Safe**: Fully typed with TypeScript using RDF.js types

## Installation

This module is part of the sparql-agent project. Import it as:

```typescript
import { StoreInterceptor } from "./interceptor.ts";
```

## Usage

### Basic Example

```typescript
import { StoreInterceptor } from "./interceptor.ts";
import { Quadstore } from "quadstore";
import { MemoryLevel } from "memory-level";
import DataFactory from "@rdfjs/data-model";

// Create your underlying store
const backend = new MemoryLevel();
const store = new Quadstore({ backend, dataFactory: DataFactory });
await store.open();

// Wrap it with StoreInterceptor
const interceptor = new StoreInterceptor(store);

// Listen to events
interceptor.on("match", (detail) => {
  console.log("Match operation:", detail);
});

interceptor.on("import", (detail) => {
  console.log("Import operation:", detail);
});

// Use the interceptor as a normal store
const stream = interceptor.match();
// Event is automatically emitted
```

### With Comunica Query Engine

```typescript
import { StoreInterceptor } from "./interceptor.ts";
import { QueryEngine } from "@comunica/query-sparql-rdfjs-lite";
import type { QueryStringContext } from "@comunica/types";

const interceptor = new StoreInterceptor(store);
const engine = new QueryEngine<QueryStringContext>();
const context: QueryStringContext = { sources: [interceptor] };

// Listen for INSERT operations
interceptor.on("import", (detail) => {
  console.log("Data was inserted:", detail);
});

// Execute SPARQL INSERT
await engine.queryVoid(
  `
  INSERT DATA {
    <http://example.org/subject> <http://example.org/predicate> "object" .
  }
`,
  context,
);
```
