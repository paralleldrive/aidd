import path from "path";
import fs from "fs-extra";

/**
 * Check if an import path is a local/relative import (not npm package).
 *
 * @param {string} importPath
 * @returns {boolean}
 */
const isLocalImport = (importPath) =>
  importPath.startsWith("./") || importPath.startsWith("../");

/**
 * Resolve a relative import path to a normalized path.
 *
 * @param {string} importPath - The raw import path (e.g., './utils.js')
 * @param {string} fromFile - The file containing the import (e.g., 'src/index.js')
 * @returns {string} Resolved path (e.g., 'src/utils.js')
 */
const resolveImportPath = (importPath, fromFile) => {
  const fromDir = path.dirname(fromFile);
  const resolved = path.join(fromDir, importPath);
  // Normalize to forward slashes
  return resolved.replace(/\\/g, "/");
};

/**
 * Get line number for a match index in content.
 *
 * @param {string} content
 * @param {number} index
 * @returns {number} 1-based line number
 */
const getLineNumber = (content, index) => {
  const lines = content.slice(0, index).split("\n");
  return lines.length;
};

/**
 * Create a dependency extractor for a given pattern and import type.
 *
 * @param {RegExp} pattern - Regex pattern with a capturing group for the path
 * @param {string} importType - Type label for extracted dependencies
 * @param {number} [pathGroup=1] - Which capture group contains the path
 * @returns {(content: string, filePath: string) => Array}
 */
const createExtractor =
  (pattern, importType, pathGroup = 1) =>
  (content, filePath) =>
    [...content.matchAll(pattern)]
      .filter((match) => isLocalImport(match[pathGroup]))
      .map((match) => ({
        rawPath: match[pathGroup],
        resolvedPath: resolveImportPath(match[pathGroup], filePath),
        importType,
        lineNumber: getLineNumber(content, match.index),
        importText: match[0],
      }));

// Dependency extraction patterns.
// Using regex here (vs dependency-cruiser) because:
// 1. We need to extract markdown links which dependency-cruiser doesn't support
// 2. These patterns cover our use case (local imports/references for AI context)
// 3. Keeps the module self-contained without heavy dependencies
const extractors = [
  // ES module static imports: import x from 'y', import { x } from 'y', import * as x from 'y'
  createExtractor(
    /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g,
    "import",
  ),
  // CommonJS requires: require('x'), require("x")
  createExtractor(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g, "require"),
  // Dynamic imports: import('x'), import("x")
  createExtractor(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g, "dynamic-import"),
  // Markdown links: [text](./path.md)
  createExtractor(/\[([^\]]*)\]\(([^)]+\.(?:md|mdc))\)/g, "reference", 2),
];

/**
 * Extract dependencies from file content using regex patterns.
 *
 * @param {string} content - File content
 * @param {string} filePath - Path to file (for resolving relative imports)
 * @returns {Array<{rawPath: string, resolvedPath: string, importType: string, lineNumber: number, importText: string}>}
 */
const extractDependencies = (content, filePath) =>
  extractors.flatMap((extractor) => extractor(content, filePath));

/**
 * Index dependencies for a single file.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} filePath - Absolute path to file
 * @param {string} rootDir - Root directory for relative paths
 * @returns {Promise<number>} Number of dependencies indexed
 */
const indexFileDependencies = async (db, filePath, rootDir) => {
  const relativePath = path.relative(rootDir, filePath).replace(/\\/g, "/");
  const content = await fs.readFile(filePath, "utf-8");

  const deps = extractDependencies(content, relativePath);

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO dependencies (from_file, to_file, import_type, line_number, import_text)
    VALUES (?, ?, ?, ?, ?)
  `);

  const checkExists = db.prepare("SELECT 1 FROM documents WHERE path = ?");

  // Filter to deps with existing targets, then insert
  const validDeps = deps.filter((dep) => checkExists.get(dep.resolvedPath));

  validDeps.forEach((dep) =>
    insertStmt.run(
      relativePath,
      dep.resolvedPath,
      dep.importType,
      dep.lineNumber,
      dep.importText,
    ),
  );

  return validDeps.length;
};

/**
 * Recursively find all indexable files (JS, TS, MD, MDC).
 *
 * @param {string} dirPath
 * @param {string} rootDir
 * @returns {Promise<string[]>}
 */
const findIndexableFiles = async (dirPath, rootDir = dirPath) => {
  const files = [];
  const items = await fs.readdir(dirPath, { withFileTypes: true });

  const indexableExtensions = [".js", ".ts", ".jsx", ".tsx", ".md", ".mdc"];

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);

    if (item.isDirectory()) {
      // Skip node_modules and hidden directories
      if (item.name === "node_modules" || item.name.startsWith(".")) {
        continue;
      }
      const stats = await fs.lstat(fullPath);
      if (!stats.isSymbolicLink()) {
        const nested = await findIndexableFiles(fullPath, rootDir);
        files.push(...nested);
      }
    } else if (item.isFile()) {
      const ext = path.extname(item.name).toLowerCase();
      if (indexableExtensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
};

/**
 * Index all dependencies in a directory.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} rootDir
 * @returns {Promise<{ indexed: number, files: number, errors: string[] }>}
 */
const indexAllDependencies = async (db, rootDir) => {
  const files = await findIndexableFiles(rootDir);
  const errors = [];

  // Clear existing dependencies (will be rebuilt)
  db.prepare("DELETE FROM dependencies").run();

  let totalIndexed = 0;

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO dependencies (from_file, to_file, import_type, line_number, import_text)
    VALUES (?, ?, ?, ?, ?)
  `);
  const checkExists = db.prepare("SELECT 1 FROM documents WHERE path = ?");

  db.transaction(() => {
    for (const filePath of files) {
      try {
        const relativePath = path
          .relative(rootDir, filePath)
          .replace(/\\/g, "/");
        const content = fs.readFileSync(filePath, "utf-8");

        const deps = extractDependencies(content, relativePath);

        // Filter to deps with existing targets, then insert
        const validDeps = deps.filter((dep) =>
          checkExists.get(dep.resolvedPath),
        );

        validDeps.forEach((dep) =>
          insertStmt.run(
            relativePath,
            dep.resolvedPath,
            dep.importType,
            dep.lineNumber,
            dep.importText,
          ),
        );

        totalIndexed += validDeps.length;
      } catch (err) {
        errors.push(`${filePath}: ${err.message}`);
      }
    }
  })();

  return {
    indexed: totalIndexed,
    files: files.length,
    errors,
  };
};

export {
  extractDependencies,
  indexFileDependencies,
  indexAllDependencies,
  resolveImportPath,
  isLocalImport,
  findIndexableFiles,
};
