import { createExecuteSparqlTool } from "#/tools/execute-sparql/tool.ts";
import type { ComunicaSparqlEngineOptions } from "./comunica-sparql-engine.ts";
import { ComunicaSparqlEngine } from "./comunica-sparql-engine.ts";

export function createComunicaExecuteSparqlTool(
  options: ComunicaSparqlEngineOptions,
) {
  const sparqlEngine = new ComunicaSparqlEngine(options);
  return createExecuteSparqlTool(sparqlEngine);
}
