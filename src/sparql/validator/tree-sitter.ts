import { createParser } from "deno_tree_sitter";
import sparql from "common_tree_sitter_languages/main/sparql.js";
import type { SparqlValidator } from "./sparql-validator.ts";

export type SparqlParser = typeof sparqlParser;

const sparqlParser = await createParser(sparql);

export class TreeSitterSparqlValidator implements SparqlValidator {
  public constructor(private readonly parser: SparqlParser = sparqlParser) {}

  public validate(query: string): boolean {
    const tree = this.parser.parse(query);
    return (tree?.rootNode.children.length ?? 0) > 0;
  }
}
