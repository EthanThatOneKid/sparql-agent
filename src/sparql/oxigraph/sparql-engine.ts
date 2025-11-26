import { Store } from "oxigraph";
import type { SparqlEngine } from "../sparql-engine.ts";
import type {
  RDFTerm,
  SparqlBindingsResult,
  SparqlBooleanResult,
  SparqlQuadsResult,
  SparqlQueryResult,
  SparqlVoidResult,
} from "#/sparql/schema.ts";

/**
 * OxigraphSparqlQueryEngine implements the SparqlQueryEngine interface using Oxigraph.
 */
export class OxigraphSparqlQueryEngine implements SparqlEngine {
  public constructor(private readonly store: Store = new Store()) {}

  public executeQuery(query: string): Promise<SparqlQueryResult> {
    const queryType = detectQueryType(query);

    try {
      let result: SparqlQueryResult;
      switch (queryType) {
        case "SELECT": {
          result = this.parseSelectQuery(query);
          break;
        }
        case "ASK": {
          result = this.parseAskQuery(query);
          break;
        }
        case "CONSTRUCT":
        case "DESCRIBE": {
          result = this.parseConstructQuery(query);
          break;
        }
        case "INSERT":
        case "DELETE":
        case "UPDATE": {
          result = this.parseUpdateQuery(query);
          break;
        }
        default: {
          throw new Error(`Unsupported query type: ${queryType}`);
        }
      }
      return Promise.resolve(result);
    } catch (error) {
      // For UPDATE queries, return void result with error
      if (
        queryType === "INSERT" || queryType === "DELETE" ||
        queryType === "UPDATE"
      ) {
        return Promise.resolve({
          type: "void",
          success: false,
          message: error instanceof Error ? error.message : String(error),
        });
      }
      return Promise.reject(error);
    }
  }

  /**
   * parseSelectQuery executes a SELECT query and returns bindings.
   */
  private parseSelectQuery(query: string): SparqlBindingsResult {
    const result = this.store.query(query);

    // Type guard: SELECT queries return Map<string, Term>[]
    if (!Array.isArray(result)) {
      throw new Error("SELECT query did not return an array of bindings");
    }

    // Oxigraph returns an array of binding objects (Map<string, Term>)
    // Each binding is an object with variable names as keys and term objects as values
    const bindings: Array<Record<string, RDFTerm | undefined>> = [];

    for (const binding of result) {
      const plainBinding: Record<string, RDFTerm | undefined> = {};

      // Iterate over binding entries
      // Binding is a Map<string, Term> or plain object
      const entries = binding instanceof Map
        ? Array.from(binding.entries())
        : Object.entries(binding);

      for (const [varName, term] of entries) {
        // Remove '?' prefix if present
        const cleanVarName = varName.startsWith("?")
          ? varName.slice(1)
          : varName;
        plainBinding[cleanVarName] = term
          ? oxigraphTermToPlainObject(term)
          : undefined;
      }

      bindings.push(plainBinding);
    }

    return {
      type: "bindings",
      bindings,
    };
  }

  /**
   * parseAskQuery executes an ASK query and returns a boolean.
   */
  private parseAskQuery(query: string): SparqlBooleanResult {
    const result = this.store.query(query);

    // Oxigraph ASK queries return a boolean value
    if (typeof result !== "boolean") {
      throw new Error("ASK query did not return a boolean");
    }

    return {
      type: "boolean",
      boolean: result,
    };
  }

  /**
   * parseConstructQuery executes a CONSTRUCT or DESCRIBE query and returns quads.
   */
  private parseConstructQuery(query: string): SparqlQuadsResult {
    const result = this.store.query(query);

    // Type guard: CONSTRUCT/DESCRIBE queries return Quad[]
    if (!Array.isArray(result)) {
      throw new Error(
        "CONSTRUCT/DESCRIBE query did not return an array of quads",
      );
    }

    // Type guard: Check if first element is a Quad (has subject, predicate, object)
    // vs Map (for SELECT bindings)
    if (result.length > 0 && result[0] instanceof Map) {
      throw new Error("Expected Quad array but got Map array (SELECT result)");
    }

    // Oxigraph returns an array of quad objects
    // Each quad has subject, predicate, object, and optional graph properties
    const quads = result.map((quad) => {
      // Type assertion: we know it's a Quad at this point
      const q = quad as {
        subject: unknown;
        predicate: unknown;
        object: unknown;
        graph?: unknown;
      };
      return {
        subject: oxigraphTermToPlainObject(q.subject),
        predicate: oxigraphTermToPlainObject(q.predicate),
        object: oxigraphTermToPlainObject(q.object),
        graph: q.graph ? oxigraphTermToPlainObject(q.graph) : undefined,
      };
    });

    return {
      type: "quads",
      quads,
    };
  }

  /**
   * parseUpdateQuery executes an UPDATE query (INSERT, DELETE, etc.) and returns void.
   */
  private parseUpdateQuery(query: string): SparqlVoidResult {
    this.store.update(query);

    return {
      type: "void",
      success: true,
    };
  }
}

/**
 * detectQueryType detects the type of SPARQL query from the query string.
 * Handles queries that may start with PREFIX, BASE, or other declarations.
 */
function detectQueryType(query: string): string {
  // Remove comments and normalize whitespace
  const cleaned = query
    .replace(/#[^\n]*/g, "") // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
    .trim();

  // Find the first query keyword, skipping PREFIX, BASE, and other declarations
  const queryKeywords = [
    "SELECT",
    "ASK",
    "CONSTRUCT",
    "DESCRIBE",
    "INSERT",
    "DELETE",
    "UPDATE",
  ];

  const upperQuery = cleaned.toUpperCase();

  for (const keyword of queryKeywords) {
    // Use word boundary to match the keyword (not as part of another word)
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(upperQuery)) {
      return keyword;
    }
  }

  throw new Error("Unable to detect query type");
}

/**
 * OxigraphTerm represents a term from Oxigraph (can be various types).
 */
interface OxigraphTerm {
  termType?: string;
  value?: string;
  language?: string;
  datatype?: string | { value?: string; toString(): string };
  constructor?: { name?: string };
  toString(): string;
}

/**
 * oxigraphTermToPlainObject converts an Oxigraph term to a plain object matching RDFTerm schema.
 */
function oxigraphTermToPlainObject(term: OxigraphTerm | unknown): RDFTerm {
  // Type guard and handle different term types from Oxigraph
  const t = term as OxigraphTerm;
  const termType = t.termType || t.constructor?.name || "NamedNode";

  const result: RDFTerm = {
    termType: mapTermType(termType),
    value: t.value || t.toString(),
  };

  // For literals, extract language and datatype
  if (termType === "Literal" || t.termType === "Literal") {
    if (t.language) {
      result.language = t.language;
    }
    if (t.datatype) {
      // datatype might be a NamedNode object, extract its value
      result.datatype = typeof t.datatype === "string"
        ? t.datatype
        : t.datatype.value || t.datatype.toString();
    }
  }

  return result;
}

/**
 * mapTermType maps Oxigraph term type names to our schema term types.
 */
function mapTermType(termType: string): RDFTerm["termType"] {
  const normalized = termType.toLowerCase();

  if (normalized === "namednode" || normalized === "iri") {
    return "NamedNode";
  }
  if (normalized === "blanknode" || normalized === "blank") {
    return "BlankNode";
  }
  if (normalized === "literal") {
    return "Literal";
  }
  if (normalized === "variable") {
    return "Variable";
  }
  if (normalized === "defaultgraph" || normalized === "graph") {
    return "DefaultGraph";
  }

  // Default to NamedNode if unknown
  return "NamedNode";
}
