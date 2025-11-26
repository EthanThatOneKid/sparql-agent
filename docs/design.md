# SPARQL Agent Design Document

Everything you need to build a grounded world model.

## Sub-agents

- `generateSparql`: Generate a SPARQL query for a given prompt.
  - Tools: `searchFacts`, `executeSparql`, `generateIri`, `validateSparql`
  - Context: Current time, user, list of built-in functions, allowed prefixes,
    etc.

## Tools

- `searchFacts`: Top K full-text and vector search results and confidence
  scores. TODO: Disambiguation tool.
- `executeSparql`: Execute a SPARQL query and return the result.
- `generateIri`: Generate an IRI for a given entity.
- `validateSparql`: Validate syntax of a SPARQL query.

## Examples

### Met up with Nancy at Crêpes de Paris Inc cafe.

Given context:

- Current time: 2025-11-25 00:00:00
- User: Ethan

Trace of execution:

- `generateSparql("Met up with Nancy at Crêpes de Paris Inc cafe.")`
  - `generateResearch("Nancy")`
    - `searchFacts("Nancy")`: Not found.
  - `generateIri("Nancy")`: Generated IRI for "Nancy".
  - `generateResearch("Crêpes de Paris Inc")`
    - `searchFacts("Crêpes de Paris Inc")`: Not found.
  - `generateIri("Crêpes de Paris Inc")`: Generated IRI for "Crêpes de Paris
    Inc".
  - `validateSparql("INSERT DATA { ex:nancy a ex:Person }")`: Valid.
  - Etc.
