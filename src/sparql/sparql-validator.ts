/**
 * SparqlValidator validates SPARQL queries.
 */
export interface SparqlValidator {
  validate(query: string): boolean;
}
