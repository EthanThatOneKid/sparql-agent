import type { QueryAlgebraContext, QueryType } from "@comunica/types";
import { QueryEngine } from "@comunica/query-sparql";
import type * as RDF from "@rdfjs/types";
import type { SparqlEngine } from "../sparql-engine.ts";
import type {
  RDFTerm,
  SparqlBindingsResult,
  SparqlBooleanResult,
  SparqlQuadsResult,
  SparqlQueryResult,
  SparqlVoidResult,
} from "#/sparql/schema.ts";

export class ComunicaSparqlQueryEngine implements SparqlEngine {
  public constructor(
    private readonly queryEngine: InstanceType<typeof QueryEngine> =
      new QueryEngine(),
    private readonly context?: QueryAlgebraContext,
  ) {}

  public async executeQuery(query: string): Promise<SparqlQueryResult> {
    // Get the initial result wrapper (unexecuted)
    const result = await this.queryEngine.query(query, this.context);
    // Parse and execute specific result types
    return await parseSparqlQueryResult(result);
  }
}

/**
 * parseSparqlQueryResult parses a Comunica query result into a SparqlQueryResult.
 * It uses the 'resultType' discriminator to cast to the specific interface.
 */
export function parseSparqlQueryResult(
  comunicaResult: QueryType,
): Promise<SparqlQueryResult> {
  switch (comunicaResult.resultType) {
    case "bindings": {
      return fromBindings(comunicaResult);
    }

    case "boolean": {
      return fromBoolean(comunicaResult);
    }

    case "quads": {
      return fromQuads(comunicaResult);
    }

    case "void": {
      return fromVoid(comunicaResult);
    }

    default: {
      throw new Error("Unsupported query result type");
    }
  }
}

/**
 * rdfTermToPlainObject converts an RDF/JS term to a plain object matching RDFTerm schema.
 */
function rdfTermToPlainObject(term: RDF.Term): RDFTerm {
  const result: RDFTerm = {
    termType: term.termType as RDFTerm["termType"],
    value: term.value,
  };

  // For literals, extract language and datatype
  if (term.termType === "Literal") {
    const literal = term as RDF.Literal;
    if (literal.language) {
      result.language = literal.language;
    }
    if (literal.datatype) {
      result.datatype = literal.datatype.value;
    }
  }

  return result;
}

/**
 * fromBindings consumes the stream and converts RDF Maps to Plain Objects.
 */
export async function fromBindings(
  comunicaResult: QueryType,
): Promise<SparqlBindingsResult> {
  if (comunicaResult.resultType !== "bindings") {
    throw new Error("Expected bindings result type");
  }

  const bindingsStream = await comunicaResult.execute();
  const bindingsArray = await bindingsStream.toArray();

  const bindings: Array<Record<string, RDFTerm | undefined>> = [];

  for (const binding of bindingsArray) {
    const plainBinding: Record<string, RDFTerm | undefined> = {};

    // Iterate over binding entries [variable, term] pairs
    for (const [variable, term] of binding) {
      // Convert variable name to string (remove ? prefix if present)
      const varName = variable.value.startsWith("?")
        ? variable.value.slice(1)
        : variable.value;

      // Convert term to plain object (or undefined if not bound)
      plainBinding[varName] = term ? rdfTermToPlainObject(term) : undefined;
    }

    bindings.push(plainBinding);
  }

  return {
    type: "bindings",
    bindings,
  };
}

/**
 * fromBoolean executes the logic to check if a pattern exists (ASK).
 */
export async function fromBoolean(
  comunicaResult: QueryType,
): Promise<SparqlBooleanResult> {
  if (comunicaResult.resultType !== "boolean") {
    throw new Error("Expected boolean result type");
  }

  const booleanValue = await comunicaResult.execute();

  return {
    type: "boolean",
    boolean: booleanValue,
  };
}

/**
 * fromQuads consumes the stream of RDFJS Quads.
 */
export async function fromQuads(
  comunicaResult: QueryType,
): Promise<SparqlQuadsResult> {
  if (comunicaResult.resultType !== "quads") {
    throw new Error("Expected quads result type");
  }

  const quadStream = await comunicaResult.execute();
  const quadsArray = await quadStream.toArray();

  const quads = quadsArray.map((quad) => ({
    subject: rdfTermToPlainObject(quad.subject),
    predicate: rdfTermToPlainObject(quad.predicate),
    object: rdfTermToPlainObject(quad.object),
    graph: quad.graph ? rdfTermToPlainObject(quad.graph) : undefined,
  }));

  return {
    type: "quads",
    quads,
  };
}

/**
 * fromVoid handles UPDATE queries.
 */
export async function fromVoid(
  comunicaResult: QueryType,
): Promise<SparqlVoidResult> {
  if (comunicaResult.resultType !== "void") {
    throw new Error("Expected void result type");
  }

  try {
    await comunicaResult.execute();
    return {
      type: "void",
      success: true,
    };
  } catch (error) {
    return {
      type: "void",
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
