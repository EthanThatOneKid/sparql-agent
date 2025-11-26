import { assertEquals, assertExists } from "@std/assert";
import { MemoryLevel } from "memory-level";
import type * as RDF from "@rdfjs/types";
import DataFactory from "@rdfjs/data-model";
import type { Bindings, QueryStringContext } from "@comunica/types";
import { QueryEngine } from "@comunica/query-sparql-rdfjs-lite";
import { Quadstore } from "quadstore";
import type {
  MatchEventDetail,
  StreamEventDetail,
} from "#/rdfjs/store/types.ts";
import { StoreInterceptor } from "./interceptor.ts";

async function createQuadstoreInstance() {
  const backend = new MemoryLevel();
  const store = new Quadstore({ backend, dataFactory: DataFactory });
  await store.open();
  return { store };
}

async function createComunicaTestEnv() {
  const backend = new MemoryLevel();
  const store = new Quadstore({ backend, dataFactory: DataFactory });
  await store.open();

  const eventTarget = new StoreInterceptor(store);
  const engine = new QueryEngine<QueryStringContext>();
  const context: QueryStringContext = { sources: [eventTarget] };
  return { store, eventTarget, engine, context };
}

async function executeTestQuery(
  engine: QueryEngine<QueryStringContext>,
  context: QueryStringContext,
  query: string,
): Promise<Array<Record<string, string>>> {
  const results: Array<Record<string, string>> = [];
  const stream = await engine.queryBindings(query, context);
  const bindingsArray = await stream.toArray() as Bindings[];
  for (const binding of bindingsArray) {
    const entry: Record<string, string> = {};
    binding.forEach((term: RDF.Term, variable: RDF.Variable | string) => {
      const varName = typeof variable === "object" && variable !== null &&
          "value" in variable
        ? String((variable as { value: string }).value)
        : String(variable);
      const normalizedVarName = varName.startsWith("?")
        ? varName.slice(1)
        : varName;
      entry[normalizedVarName] = term.value;
    });
    results.push(entry);
  }
  return results;
}

Deno.test("StoreInterceptor - can be created with a Quadstore", () => {
  const backend = new MemoryLevel();
  const store = new Quadstore({ backend, dataFactory: DataFactory });
  const eventTarget = new StoreInterceptor(store);
  assertExists(eventTarget);
});

Deno.test(
  "StoreInterceptor - Quadstore match dispatches a single match event",
  async () => {
    const { store } = await createQuadstoreInstance();
    try {
      const eventTarget = new StoreInterceptor(store);
      const events: MatchEventDetail[] = [];
      eventTarget.on("match", (detail) => events.push(detail));

      const stream = eventTarget.match();
      assertExists(stream);
      assertEquals(events.length, 1);
    } finally {
      await store.close();
    }
  },
);

Deno.test(
  "StoreInterceptor - Quadstore removeMatches does not emit duplicate events",
  async () => {
    const { store } = await createQuadstoreInstance();
    try {
      await store.put(
        DataFactory.quad(
          DataFactory.namedNode("http://example.org/alice"),
          DataFactory.namedNode("http://schema.org/name"),
          DataFactory.literal("Alice"),
        ),
      );

      const eventTarget = new StoreInterceptor(store);
      const removeEvents: StreamEventDetail[] = [];
      const removeMatchesEvents: MatchEventDetail[] = [];

      eventTarget.on("remove", (detail) => removeEvents.push(detail));
      eventTarget.on(
        "removematches",
        (detail) => removeMatchesEvents.push(detail),
      );

      const result = eventTarget.removeMatches(
        DataFactory.namedNode("http://example.org/alice"),
        null,
        null,
        null,
      );
      assertExists(result);

      assertEquals(removeMatchesEvents.length, 1);
      assertEquals(
        removeEvents.length,
        0,
        "Internal remove() calls should not dispatch events",
      );
    } finally {
      await store.close();
    }
  },
);

Deno.test(
  "StoreInterceptor + Comunica - INSERT DATA dispatches import event",
  async () => {
    const { store, eventTarget, engine, context } =
      await createComunicaTestEnv();
    try {
      const importEvents: StreamEventDetail[] = [];
      eventTarget.on("import", (detail) => importEvents.push(detail));

      const insertQuery = `
        INSERT DATA {
          GRAPH <http://example.org/graph> {
            <http://example.org/alice> <http://schema.org/name> "Alice" .
          }
        }
      `;
      await engine.queryVoid(insertQuery, context);

      assertEquals(importEvents.length, 1);
      const results = await executeTestQuery(
        engine,
        context,
        `
          SELECT ?o WHERE {
            GRAPH <http://example.org/graph> {
              <http://example.org/alice> <http://schema.org/name> ?o .
            }
          }
        `,
      );
      assertEquals(results.length, 1);
      assertEquals(results[0].o, "Alice");
    } finally {
      await store.close();
    }
  },
);

Deno.test(
  "StoreInterceptor + Comunica - DELETE DATA dispatches removematches event",
  async () => {
    const { store, eventTarget, engine, context } =
      await createComunicaTestEnv();
    try {
      // Seed data
      await engine.queryVoid(
        `
        INSERT DATA {
          <http://example.org/book> <http://schema.org/name> "Book" .
        }
      `,
        context,
      );

      const removeMatchesEvents: MatchEventDetail[] = [];
      const removeStreamEvents: StreamEventDetail[] = [];
      eventTarget.on(
        "removematches",
        (detail) => removeMatchesEvents.push(detail),
      );
      eventTarget.on("remove", (detail) => removeStreamEvents.push(detail));

      await engine.queryVoid(
        `
        DELETE DATA {
          <http://example.org/book> <http://schema.org/name> "Book" .
        }
      `,
        context,
      );

      assertEquals(
        removeMatchesEvents.length + removeStreamEvents.length,
        1,
      );
      const results = await executeTestQuery(
        engine,
        context,
        `
          SELECT ?o WHERE {
            <http://example.org/book> <http://schema.org/name> ?o .
          }
        `,
      );
      assertEquals(results.length, 0);
    } finally {
      await store.close();
    }
  },
);

Deno.test(
  "StoreInterceptor + Comunica - DELETE/INSERT updates dispatch both events",
  async () => {
    const { store, eventTarget, engine, context } =
      await createComunicaTestEnv();
    try {
      await engine.queryVoid(
        `
        INSERT DATA {
          <http://example.org/product> <http://schema.org/name> "Old Name" .
        }
      `,
        context,
      );

      const importEvents: StreamEventDetail[] = [];
      const removeMatchesEvents: MatchEventDetail[] = [];
      const removeStreamEvents: StreamEventDetail[] = [];
      eventTarget.on("import", (detail) => importEvents.push(detail));
      eventTarget.on(
        "removematches",
        (detail) => removeMatchesEvents.push(detail),
      );
      eventTarget.on("remove", (detail) => removeStreamEvents.push(detail));

      await engine.queryVoid(
        `
        DELETE { <http://example.org/product> <http://schema.org/name> "Old Name" . }
        INSERT { <http://example.org/product> <http://schema.org/name> "New Name" . }
        WHERE  { <http://example.org/product> <http://schema.org/name> "Old Name" . }
      `,
        context,
      );

      assertEquals(importEvents.length, 1);
      assertEquals(
        removeMatchesEvents.length + removeStreamEvents.length,
        1,
      );

      const results = await executeTestQuery(
        engine,
        context,
        `
          SELECT ?o WHERE {
            <http://example.org/product> <http://schema.org/name> ?o .
          }
        `,
      );
      assertEquals(results.length, 1);
      assertEquals(results[0].o, "New Name");
    } finally {
      await store.close();
    }
  },
);
