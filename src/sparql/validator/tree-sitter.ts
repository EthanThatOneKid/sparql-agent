// import { createParser } from "deno_tree_sitter";
// import sparql from "common_tree_sitter_languages/main/sparql.js";
import type { SparqlValidator } from "./sparql-validator.ts";

// TODO: Fix error: Expected a JavaScript or TypeScript module, but identified a Unknown module. Importing these types of modules is currently not supported.
// Specifier: https://github.com/EthanThatOneKid/common_tree_sitter_languages/blob/8eeb010ee5edb3dea6ac41f98432815e9e70f211/main/sparql.js
//   at file:///C:/Users/ethan/Documents/GitHub/sparql-agent/src/sparql/validator/tree-sitter.ts:2:20
//

// export type SparqlParser = typeof sparqlParser;

// const sparqlParser = await createParser(sparql);

export class TreeSitterSparqlValidator implements SparqlValidator {
  // public constructor(private readonly parser: SparqlParser = sparqlParser) {}

  public validate(_query: string): boolean {
    // const tree = this.parser.parse(query);
    // return (tree?.rootNode.children.length ?? 0) > 0;
    //

    return true;
  }
}
