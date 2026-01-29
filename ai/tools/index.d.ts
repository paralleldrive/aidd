/**
 * TypeScript definitions for aidd indexing and search tools.
 */

import type { Database } from "better-sqlite3";

// Database types

/**
 * Create a new SQLite database connection.
 * @param dbPath - Path to the SQLite database file (use ":memory:" for in-memory)
 * @returns Database instance
 */
export function createDatabase(dbPath: string): Database;

/**
 * Close a database connection safely.
 * @param db - Database instance to close
 */
export function closeDatabase(db: Database): void;

/**
 * Initialize the database schema (creates tables if not exist).
 * @param db - Database instance
 */
export function initializeSchema(db: Database): void;

/**
 * Get the current schema version from the database.
 * @param db - Database instance
 * @returns Schema version number or null if not set
 */
export function getSchemaVersion(db: Database): number | null;

/**
 * Check if a table exists in the database.
 * @param db - Database instance
 * @param tableName - Name of the table to check
 * @returns True if table exists
 */
export function tableExists(db: Database, tableName: string): boolean;

/**
 * Current schema version constant.
 */
export const CURRENT_SCHEMA_VERSION: number;

// Indexer types

export type DocumentType =
  | "rule"
  | "command"
  | "skill"
  | "task"
  | "story-map"
  | "other";

export interface ParsedFrontmatter {
  frontmatter: Record<string, unknown>;
  content: string;
}

export interface IndexResult {
  indexed: number;
  errors: string[];
}

export interface IncrementalIndexResult {
  updated: number;
  deleted: number;
  unchanged: number;
}

/**
 * Index a single file into the database.
 * @param db - Database instance
 * @param filePath - Absolute path to file
 * @param rootDir - Root directory for relative paths
 */
export function indexFile(
  db: Database,
  filePath: string,
  rootDir: string,
): Promise<void>;

/**
 * Index all markdown files in a directory.
 * @param db - Database instance
 * @param rootDir - Root directory to index
 * @returns Index result with count and errors
 */
export function indexDirectory(
  db: Database,
  rootDir: string,
): Promise<IndexResult>;

/**
 * Incrementally index only changed files.
 * @param db - Database instance
 * @param rootDir - Root directory to index
 * @returns Incremental index result
 */
export function indexIncremental(
  db: Database,
  rootDir: string,
): Promise<IncrementalIndexResult>;

/**
 * Detect document type based on file path.
 * @param filePath - Relative path to the file
 * @returns Document type
 */
export function detectDocumentType(filePath: string): DocumentType;

/**
 * Compute SHA3-256 hash of file contents.
 * @param filePath - Absolute path to file
 * @returns Hex-encoded hash
 */
export function computeFileHash(filePath: string): Promise<string>;

/**
 * Parse frontmatter from content, with prototype pollution protection.
 * @param content - File content
 * @returns Parsed frontmatter and content
 */
export function parseFrontmatter(content: string): ParsedFrontmatter;

// Dependency indexer types

export type ImportType = "esm" | "commonjs" | "dynamic";

export interface Dependency {
  source: string;
  importType: ImportType;
  line: number;
}

/**
 * Extract import/require dependencies from file content.
 * @param content - File content
 * @returns Array of dependencies
 */
export function extractDependencies(content: string): Dependency[];

/**
 * Index dependencies for a single file.
 * @param db - Database instance
 * @param filePath - Path of the file being indexed
 * @param content - File content
 * @param rootDir - Root directory for resolution
 */
export function indexFileDependencies(
  db: Database,
  filePath: string,
  content: string,
  rootDir: string,
): void;

/**
 * Index dependencies for all files in database.
 * @param db - Database instance
 * @param rootDir - Root directory for resolution
 */
export function indexAllDependencies(db: Database, rootDir: string): void;

/**
 * Resolve import path to actual file.
 * @param importPath - Import path from source
 * @param fromFile - File containing the import
 * @param rootDir - Root directory
 * @returns Resolved file path or null
 */
export function resolveImportPath(
  importPath: string,
  fromFile: string,
  rootDir: string,
): string | null;

// Search types

export interface SearchResult {
  path: string;
  type: string;
  frontmatter: Record<string, unknown>;
  snippet?: string;
  rank?: number;
  content?: string;
}

export interface FanOutSearchResult extends SearchResult {
  relevanceScore: number;
  matchedStrategies: string[];
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  type?: string;
  silent?: boolean;
}

export interface MetadataFilter {
  type?: string;
  [key: `frontmatter.${string}`]:
    | string
    | number
    | boolean
    | { contains: string };
}

export interface FanOutSearchOptions {
  strategies?: Array<"fts5" | "metadata" | "semantic">;
  filters?: MetadataFilter;
  type?: string;
  limit?: number;
  weights?: Record<string, number>;
  silent?: boolean;
}

/**
 * Search documents using FTS5 full-text search.
 * @param db - Database instance
 * @param query - Search query (supports FTS5 operators)
 * @param options - Search options
 * @returns Array of search results
 */
export function searchFts5(
  db: Database,
  query: string,
  options?: SearchOptions,
): SearchResult[];

/**
 * Extract a relevant snippet from content around the search terms.
 * @param content - Document content
 * @param query - Search query
 * @param contextChars - Characters of context around match
 * @returns Snippet string
 */
export function extractSnippet(
  content: string,
  query: string,
  contextChars?: number,
): string;

/**
 * Highlight matching terms in text.
 * @param text - Text to highlight
 * @param query - Search query
 * @returns Text with markdown bold highlights
 */
export function highlightMatches(text: string, query: string): string;

/**
 * Search documents by metadata/frontmatter fields.
 * @param db - Database instance
 * @param filters - Filter conditions
 * @param options - Search options
 * @returns Array of search results
 */
export function searchMetadata(
  db: Database,
  filters?: MetadataFilter,
  options?: { limit?: number; offset?: number },
): SearchResult[];

/**
 * Get all unique values for a frontmatter field.
 * @param db - Database instance
 * @param field - Frontmatter field name
 * @returns Array of unique values
 */
export function getFieldValues(db: Database, field: string): string[];

/**
 * Get all unique document types.
 * @param db - Database instance
 * @returns Array of document types
 */
export function getDocumentTypes(db: Database): string[];

/**
 * Execute fan-out search across multiple strategies.
 * @param db - Database instance
 * @param query - Search query
 * @param options - Fan-out search options
 * @returns Promise of search results with relevance scores
 */
export function fanOutSearch(
  db: Database,
  query: string,
  options?: FanOutSearchOptions,
): Promise<FanOutSearchResult[]>;

/**
 * Aggregate results from multiple search strategies.
 * @param resultsByStrategy - Results grouped by strategy name
 * @param options - Aggregation options
 * @returns Aggregated and ranked results
 */
export function aggregateResults(
  resultsByStrategy: Record<string, SearchResult[]>,
  options?: { weights?: Record<string, number>; limit?: number },
): FanOutSearchResult[];

// Graph traversal types

export interface RelatedFile {
  file: string;
  depth: number;
  direction: "forward" | "reverse";
}

export interface TraversalOptions {
  maxDepth?: number;
}

export interface FindRelatedOptions extends TraversalOptions {
  direction?: "forward" | "reverse" | "both";
}

/**
 * Find all related files (forward, reverse, or both).
 * @param db - Database instance
 * @param filePath - Starting file path
 * @param options - Traversal options
 * @returns Array of related files
 */
export function findRelated(
  db: Database,
  filePath: string,
  options?: FindRelatedOptions,
): RelatedFile[];

/**
 * Get forward dependencies (files that this file imports).
 * @param db - Database instance
 * @param filePath - Starting file path
 * @param options - Traversal options
 * @returns Array of dependencies
 */
export function getForwardDeps(
  db: Database,
  filePath: string,
  options?: TraversalOptions,
): RelatedFile[];

/**
 * Get reverse dependencies (files that import this file).
 * @param db - Database instance
 * @param filePath - Target file path
 * @param options - Traversal options
 * @returns Array of dependents
 */
export function getReverseDeps(
  db: Database,
  filePath: string,
  options?: TraversalOptions,
): RelatedFile[];

/**
 * Get the full dependency graph as an adjacency list.
 * @param db - Database instance
 * @returns Map of file to its dependencies
 */
export function getDependencyGraph(db: Database): Map<string, string[]>;

/**
 * Find all entry points (files with no dependents).
 * @param db - Database instance
 * @returns Array of entry point file paths
 */
export function findEntryPoints(db: Database): string[];

/**
 * Find all leaf nodes (files with no dependencies).
 * @param db - Database instance
 * @returns Array of leaf node file paths
 */
export function findLeafNodes(db: Database): string[];
