export interface WorldModel {
  /**
   * searchSubjects finds the top K subjects that match the query.
   */
  searchSubjects(query: string, topK?: number): Promise<string[]>;

  /**
   * executeSparql executes a SPARQL query and returns the result.
   */
  executeSparql(sparql: string): Promise<string>;
}
