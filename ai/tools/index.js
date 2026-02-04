/**
 * aidd indexing and search tools.
 *
 * Re-exports all public APIs for convenient access.
 */

// Errors
export { toolsErrors, handleToolsErrors, ValidationError } from "./errors.js";

// Database
export { createDatabase, closeDatabase } from "./db/connection.js";
export {
  initializeSchema,
  getSchemaVersion,
  tableExists,
  CURRENT_SCHEMA_VERSION,
} from "./db/schema.js";

// Indexers
export {
  indexFile,
  indexDirectory,
  indexIncremental,
  detectDocumentType,
  computeFileHash,
  parseFrontmatter,
} from "./indexers/frontmatter.js";

export {
  extractDependencies,
  indexFileDependencies,
  indexAllDependencies,
  resolveImportPath,
} from "./indexers/dependencies.js";

// Search
export { searchFts5, extractSnippet, highlightMatches } from "./search/fts5.js";
export {
  searchMetadata,
  getFieldValues,
  getDocumentTypes,
} from "./search/metadata.js";
export { fanOutSearch, aggregateResults } from "./search/fan-out.js";

// Graph traversal
export {
  findRelated,
  getForwardDeps,
  getReverseDeps,
  getDependencyGraph,
  findEntryPoints,
  findLeafNodes,
} from "./graph/traverse.js";
