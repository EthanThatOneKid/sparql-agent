// Modified from source:
// https://github.com/rdfjs/types/blob/1b1208dcc9389415b62717092c40d6b6954f4872/data-model.d.ts
//

/* Data Model Interfaces */
/* https://rdf.js.org/data-model-spec/ */

/**
 * Contains an Iri, RDF blank Node, RDF literal, variable name, default graph, or a quad
 * @see NamedNode
 * @see BlankNode
 * @see Literal
 * @see Variable
 * @see DefaultGraph
 * @see BaseQuad
 */
export type Term =
  | NamedNode
  | BlankNode
  | Literal
  | Variable
  | DefaultGraph
  | BaseQuad;

/**
 * Contains an IRI.
 */
export interface NamedNode {
  /**
   * Contains the constant "NamedNode".
   */
  termType: "NamedNode";

  /**
   * The IRI of the named node (example: `http://example.org/resource`)
   */
  value: string;
}

/**
 * Contains an RDF blank node.
 */
export interface BlankNode {
  /**
   * Contains the constant "BlankNode".
   */
  termType: "BlankNode";
  /**
   * Blank node name as a string, without any serialization specific prefixes,
   * e.g. when parsing,
   * if the data was sourced from Turtle, remove _:,
   * if it was sourced from RDF/XML, do not change the blank node name (example: blank3).
   */
  value: string;
}

/**
 * An RDF literal, containing a string with an optional language tag and/or datatype.
 */
export interface Literal {
  /**
   * Contains the constant "Literal".
   */
  termType: "Literal";

  /**
   * The text value, unescaped, without language or type (example: Brad Pitt).
   */
  value: string;

  /**
   * the language as lowercase BCP47 string (examples: en, en-gb)
   * or an empty string if the literal has no language.
   * @link http://tools.ietf.org/html/bcp47
   */
  language: string;

  /**
   * the direction of the language-tagged string.
   */
  direction?: "ltr" | "rtl" | "" | null;

  /**
   * A NamedNode whose IRI represents the datatype of the literal.
   */
  datatype: NamedNode;
}

/**
 * A variable name.
 */
export interface Variable {
  /**
   * Contains the constant "Variable".
   */
  termType: "Variable";

  /**
   * The name of the variable *without* leading ? (example: a).
   */
  value: string;
}

/**
 * An instance of DefaultGraph represents the default graph.
 * It's only allowed to assign a DefaultGraph to the .graph property of a Quad.
 */
export interface DefaultGraph {
  /**
   * Contains the constant "DefaultGraph".
   */
  termType: "DefaultGraph";

  /**
   * Contains an empty string as constant value.
   */
  value: "";
}

/**
 * The subject, which is a NamedNode, BlankNode or Variable.
 * @see NamedNode
 * @see BlankNode
 * @see Variable
 */
export type Quad_Subject = NamedNode | BlankNode | Quad | Variable;

/**
 * The predicate, which is a NamedNode or Variable.
 * @see NamedNode
 * @see Variable
 */
export type Quad_Predicate = NamedNode | Variable;

/**
 * The object, which is a NamedNode, Literal, BlankNode or Variable.
 * @see NamedNode
 * @see Literal
 * @see BlankNode
 * @see Variable
 */
export type Quad_Object = NamedNode | Literal | BlankNode | Quad | Variable;

/**
 * The named graph, which is a DefaultGraph, NamedNode, BlankNode or Variable.
 * @see DefaultGraph
 * @see NamedNode
 * @see BlankNode
 * @see Variable
 */
export type Quad_Graph = DefaultGraph | NamedNode | BlankNode | Variable;

/**
 * An RDF quad, taking any Term in its positions, containing the subject, predicate, object and graph terms.
 */
export interface BaseQuad {
  /**
   * Contains the constant "Quad".
   */
  termType: "Quad";

  /**
   * Contains an empty string as constant value.
   */
  value: "";

  /**
   * The subject.
   * @see Quad_Subject
   */
  subject: Term;

  /**
   * The predicate.
   * @see Quad_Predicate
   */
  predicate: Term;

  /**
   * The object.
   * @see Quad_Object
   */
  object: Term;

  /**
   * The named graph.
   * @see Quad_Graph
   */
  graph: Term;
}

/**
 * An RDF quad, containing the subject, predicate, object and graph terms.
 */
export interface Quad extends BaseQuad {
  /**
   * The subject.
   * @see Quad_Subject
   */
  subject: Quad_Subject;

  /**
   * The predicate.
   * @see Quad_Predicate
   */
  predicate: Quad_Predicate;

  /**
   * The object.
   * @see Quad_Object
   */
  object: Quad_Object;

  /**
   * The named graph.
   * @see Quad_Graph
   */
  graph: Quad_Graph;
}

export interface DirectionalLanguage {
  language: string;
  direction?: "ltr" | "rtl" | "" | null;
}
