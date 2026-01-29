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
 * Extract dependencies from file content using regex patterns.
 *
 * @param {string} content - File content
 * @param {string} filePath - Path to file (for resolving relative imports)
 * @returns {Array<{rawPath: string, resolvedPath: string, importType: string, lineNumber: number, importText: string}>}
 */
const extractDependencies = (content, filePath) => {
  const deps = [];

  // ES module static imports: import x from 'y', import { x } from 'y', import * as x from 'y'
  const esImportRegex = /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g;

  // CommonJS requires: require('x'), require("x")
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  // Dynamic imports: import('x'), import("x")
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  // Markdown links: [text](./path.md)
  const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+\.(?:md|mdc))\)/g;

  // Extract ES imports
  for (const match of content.matchAll(esImportRegex)) {
    const rawPath = match[1];
    if (isLocalImport(rawPath)) {
      deps.push({
        rawPath,
        resolvedPath: resolveImportPath(rawPath, filePath),
        importType: "import",
        lineNumber: getLineNumber(content, match.index),
        importText: match[0],
      });
    }
  }

  // Extract requires
  for (const match of content.matchAll(requireRegex)) {
    const rawPath = match[1];
    if (isLocalImport(rawPath)) {
      deps.push({
        rawPath,
        resolvedPath: resolveImportPath(rawPath, filePath),
        importType: "require",
        lineNumber: getLineNumber(content, match.index),
        importText: match[0],
      });
    }
  }

  // Extract dynamic imports
  for (const match of content.matchAll(dynamicImportRegex)) {
    const rawPath = match[1];
    if (isLocalImport(rawPath)) {
      deps.push({
        rawPath,
        resolvedPath: resolveImportPath(rawPath, filePath),
        importType: "dynamic-import",
        lineNumber: getLineNumber(content, match.index),
        importText: match[0],
      });
    }
  }

  // Extract markdown links
  for (const match of content.matchAll(markdownLinkRegex)) {
    const rawPath = match[2];
    if (isLocalImport(rawPath)) {
      deps.push({
        rawPath,
        resolvedPath: resolveImportPath(rawPath, filePath),
        importType: "reference",
        lineNumber: getLineNumber(content, match.index),
        importText: match[0],
      });
    }
  }

  return deps;
};

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

  let indexed = 0;
  for (const dep of deps) {
    // Only insert if target file exists in documents table
    const targetExists = db
      .prepare("SELECT 1 FROM documents WHERE path = ?")
      .get(dep.resolvedPath);

    if (targetExists) {
      insertStmt.run(
        relativePath,
        dep.resolvedPath,
        dep.importType,
        dep.lineNumber,
        dep.importText,
      );
      indexed++;
    }
  }

  return indexed;
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

  db.transaction(() => {
    for (const filePath of files) {
      try {
        const relativePath = path
          .relative(rootDir, filePath)
          .replace(/\\/g, "/");
        const content = fs.readFileSync(filePath, "utf-8");

        const deps = extractDependencies(content, relativePath);

        const insertStmt = db.prepare(`
          INSERT OR IGNORE INTO dependencies (from_file, to_file, import_type, line_number, import_text)
          VALUES (?, ?, ?, ?, ?)
        `);

        for (const dep of deps) {
          // Only insert if target file exists in documents table
          const targetExists = db
            .prepare("SELECT 1 FROM documents WHERE path = ?")
            .get(dep.resolvedPath);

          if (targetExists) {
            insertStmt.run(
              relativePath,
              dep.resolvedPath,
              dep.importType,
              dep.lineNumber,
              dep.importText,
            );
            totalIndexed++;
          }
        }
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
