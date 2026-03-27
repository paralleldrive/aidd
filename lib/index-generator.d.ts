/**
 * Index file generation for ai/ directory structure
 */

/** Parsed frontmatter from a markdown file */
export interface Frontmatter {
  description?: string;
  globs?: string;
  alwaysApply?: boolean;
  [key: string]: string | boolean | undefined;
}

/** Result of writing an index file */
export interface IndexWriteResult {
  path: string;
  success: boolean;
}

/** Result of generateAllIndexes operation */
export interface GenerateAllResult {
  success: boolean;
  message?: string;
  error?: { cause?: unknown; message: string };
  indexes: IndexWriteResult[];
}

/**
 * Parse YAML frontmatter from file content
 * @param content - File content to parse
 * @returns Parsed frontmatter object, or null if no frontmatter found
 */
export function parseFrontmatter(content: string): Frontmatter | null;

/**
 * Extract title from file content
 * Looks for first # heading, falls back to filename
 * @param content - File content to search
 * @param filename - Filename to use as fallback
 */
export function extractTitle(content: string, filename: string): string;

/**
 * Get all indexable files in a directory (non-recursive)
 * Returns .md and .mdc files, excluding index.md
 * @param dirPath - Directory to scan
 */
export function getIndexableFiles(dirPath: string): Promise<string[]>;

/**
 * Get all subdirectories in a directory
 * @param dirPath - Directory to scan
 */
export function getSubdirectories(dirPath: string): Promise<string[]>;

/**
 * Generate markdown entry for a file
 * @param dirPath - Directory containing the file
 * @param filename - Name of the file
 */
export function generateFileEntry(
  dirPath: string,
  filename: string,
): Promise<string>;

/**
 * Generate markdown entry for a subdirectory
 * @param subdirName - Name of the subdirectory
 */
export function generateSubdirEntry(subdirName: string): string;

/**
 * Check if a directory is a skills directory
 * @param dirPath - Directory to check
 */
export function isSkillsDirectory(dirPath: string): Promise<boolean>;

/**
 * Generate a simple bullet entry for a skill from its SKILL.md frontmatter
 * @param dirPath - Parent directory containing the skill subdirectory
 * @param subdirName - Name of the skill subdirectory
 */
export function generateSkillEntry(
  dirPath: string,
  subdirName: string,
): Promise<string | null>;

/**
 * Generate skills index content with simple bullet format
 * @param dirPath - Skills directory to generate index for
 */
export function generateSkillsIndexContent(dirPath: string): Promise<string>;

/**
 * Generate index.md content for a directory
 * @param dirPath - Directory to generate index for
 */
export function generateIndexContent(dirPath: string): Promise<string>;

/**
 * Write index.md to a directory
 * @param dirPath - Directory to write index.md to
 * @throws {Error} If file cannot be written
 */
export function writeIndex(dirPath: string): Promise<IndexWriteResult>;

/**
 * Recursively generate index.md files for all subdirectories
 * @param dirPath - Starting directory
 * @param results - Accumulator for results (internal use)
 * @param depth - Current recursion depth (internal use)
 */
export function generateIndexRecursive(
  dirPath: string,
  results?: IndexWriteResult[],
  depth?: number,
): Promise<IndexWriteResult[]>;

/**
 * Generate all index files for the ai/ directory
 *
 * @param targetBase - Base directory containing ai/ folder
 * @returns Result indicating success/failure and list of generated files
 *
 * @example
 * const result = await generateAllIndexes('/path/to/project');
 * if (result.success) {
 *   console.log(`Generated ${result.indexes.length} files`);
 * }
 */
export function generateAllIndexes(
  targetBase: string,
): Promise<GenerateAllResult>;
