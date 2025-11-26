import { OxigraphSparqlValidator } from "./oxigraph/sparql-validator.ts";
import { SparqljsSparqlValidator } from "./sparqljs/sparql-validator.ts";
import { TreeSitterSparqlValidator } from "./tree-sitter/sparql-validator.ts";

// Test queries of varying complexity
const simpleQuery = "SELECT * WHERE { ?s ?p ?o }";
const mediumQuery = `
  SELECT ?name ?email WHERE {
    ?person foaf:name ?name .
    ?person foaf:email ?email .
    FILTER(?name != "")
  }
`;
const complexQuery = `
  SELECT ?person ?name ?age WHERE {
    ?person a foaf:Person .
    ?person foaf:name ?name .
    OPTIONAL { ?person foaf:age ?age }
    FILTER(?age > 18 || !bound(?age))
    ORDER BY ?name
    LIMIT 100
  }
`;
const invalidQuery = "SELECT * WHERE { invalid syntax }";
const emptyQuery = "";

// Initialize validators once
const sparqljsValidator = new SparqljsSparqlValidator();
const oxigraphValidator = new OxigraphSparqlValidator();
const treeSitterValidator = new TreeSitterSparqlValidator();

// Simple query benchmarks
Deno.bench("Sparqljs - simple query", {
  group: "simple",
  baseline: true,
}, () => {
  sparqljsValidator.validate(simpleQuery);
});

Deno.bench("Oxigraph - simple query", {
  group: "simple",
}, () => {
  oxigraphValidator.validate(simpleQuery);
});

Deno.bench("TreeSitter - simple query", {
  group: "simple",
}, () => {
  treeSitterValidator.validate(simpleQuery);
});

// Medium complexity query benchmarks
Deno.bench("Sparqljs - medium query", {
  group: "medium",
  baseline: true,
}, () => {
  sparqljsValidator.validate(mediumQuery);
});

Deno.bench("Oxigraph - medium query", {
  group: "medium",
}, () => {
  oxigraphValidator.validate(mediumQuery);
});

Deno.bench("TreeSitter - medium query", {
  group: "medium",
}, () => {
  treeSitterValidator.validate(mediumQuery);
});

// Complex query benchmarks
Deno.bench("Sparqljs - complex query", {
  group: "complex",
  baseline: true,
}, () => {
  sparqljsValidator.validate(complexQuery);
});

Deno.bench("Oxigraph - complex query", {
  group: "complex",
}, () => {
  oxigraphValidator.validate(complexQuery);
});

Deno.bench("TreeSitter - complex query", {
  group: "complex",
}, () => {
  treeSitterValidator.validate(complexQuery);
});

// Invalid query benchmarks (error handling performance)
Deno.bench("Sparqljs - invalid query", {
  group: "invalid",
  baseline: true,
}, () => {
  sparqljsValidator.validate(invalidQuery);
});

Deno.bench("Oxigraph - invalid query", {
  group: "invalid",
}, () => {
  oxigraphValidator.validate(invalidQuery);
});

Deno.bench("TreeSitter - invalid query", {
  group: "invalid",
}, () => {
  treeSitterValidator.validate(invalidQuery);
});

// Empty query benchmarks
Deno.bench("Sparqljs - empty query", {
  group: "empty",
  baseline: true,
}, () => {
  sparqljsValidator.validate(emptyQuery);
});

Deno.bench("Oxigraph - empty query", {
  group: "empty",
}, () => {
  oxigraphValidator.validate(emptyQuery);
});

Deno.bench("TreeSitter - empty query", {
  group: "empty",
}, () => {
  treeSitterValidator.validate(emptyQuery);
});
