import path from "path";
import fs from "fs-extra";
import { cruise } from "dependency-cruiser";

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
 * Extract markdown link references from content.
 * Uses regex because dependency-cruiser doesn't support markdown.
 *
 * @param {string} content - File content
 * @param {string} filePath - Path to file (for resolving relative imports)
 * @returns {Array<{rawPath: string, resolvedPath: string, importType: string, lineNumber: number, importText: string}>}
 */
const extractMarkdownLinks = (content, filePath) => {
  const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+\.(?:md|mdc))\)/g;

  return [...content.matchAll(markdownLinkRegex)]
    .filter((match) => isLocalImport(match[2]))
    .map((match) => ({
      rawPath: match[2],
      resolvedPath: resolveImportPath(match[2], filePath),
      importType: "reference",
      lineNumber: getLineNumber(content, match.index),
      importText: match[0],
    }));
};

/**
 * Map dependency-cruiser dependency type to our import type.
 *
 * @param {string} dependencyType
 * @returns {string}
 */
const mapDependencyType = (dependencyType) => {
  if (dependencyType === "require") return "require";
  if (dependencyType === "dynamic-import") return "dynamic-import";
  return "import"; // import, import-equals, export, re-export, etc.
};

/**
 * Extract dependencies from file content using regex patterns.
 * Kept for backward compatibility and testing.
 *
 * @param {string} content - File content
 * @param {string} filePath - Path to file (for resolving relative imports)
 * @returns {Array<{rawPath: string, resolvedPath: string, importType: string, lineNumber: number, importText: string}>}
 */
const extractDependencies = (content, filePath) => {
  // Use regex for all extraction (for single-file/content-based extraction)
  const extractors = [
    // ES module static imports
    {
      regex: /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g,
      type: "import",
      group: 1,
    },
    // CommonJS requires
    {
      regex: /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      type: "require",
      group: 1,
    },
    // Dynamic imports
    {
      regex: /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      type: "dynamic-import",
      group: 1,
    },
    // Markdown links
    {
      regex: /\[([^\]]*)\]\(([^)]+\.(?:md|mdc))\)/g,
      type: "reference",
      group: 2,
    },
  ];

  return extractors.flatMap(({ regex, type, group }) =>
    [...content.matchAll(regex)]
      .filter((match) => isLocalImport(match[group]))
      .map((match) => ({
        rawPath: match[group],
        resolvedPath: resolveImportPath(match[group], filePath),
        importType: type,
        lineNumber: getLineNumber(content, match.index),
        importText: match[0],
      })),
  );
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
 * Recursively find all markdown files for link extraction.
 *
 * @param {string} dirPath
 * @returns {Promise<string[]>}
 */
const findMarkdownFiles = async (dirPath) => {
  const files = [];
  const items = await fs.readdir(dirPath, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);

    if (item.isDirectory()) {
      // Skip node_modules and hidden directories
      if (item.name === "node_modules" || item.name.startsWith(".")) {
        continue;
      }
      const stats = await fs.lstat(fullPath);
      if (!stats.isSymbolicLink()) {
        const nested = await findMarkdownFiles(fullPath);
        files.push(...nested);
      }
    } else if (item.isFile()) {
      const ext = path.extname(item.name).toLowerCase();
      if ([".md", ".mdc"].includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
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
 * Normalize a path from dependency-cruiser to be relative to rootDir.
 * Handles symlinks and relative paths from different working directories.
 *
 * @param {string} cruiserPath - Path from dependency-cruiser
 * @param {string} rootDir - Root directory
 * @returns {string} Normalized relative path
 */
const normalizeCruiserPath = (cruiserPath, rootDir) => {
  // Resolve to absolute path (handles ../ prefixes)
  const absolutePath = path.resolve(process.cwd(), cruiserPath);
  // Resolve any symlinks (e.g., /var -> /private/var on macOS)
  const realPath = fs.realpathSync(absolutePath);
  const realRootDir = fs.realpathSync(rootDir);
  // Make relative to rootDir
  return path.relative(realRootDir, realPath).replace(/\\/g, "/");
};

/**
 * Index all dependencies in a directory.
 * Uses dependency-cruiser for JS/TS files and regex for markdown links.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} rootDir
 * @returns {Promise<{ indexed: number, files: number, errors: string[] }>}
 */
const indexAllDependencies = async (db, rootDir) => {
  const errors = [];
  const allDeps = [];

  // 1. Use dependency-cruiser for JS/TS dependencies
  try {
    const cruiseResult = await cruise([rootDir], {
      doNotFollow: {
        path: "node_modules",
      },
      exclude: {
        path: "node_modules",
      },
    });

    // Process dependency-cruiser results
    const modules = cruiseResult.output.modules || [];
    const jsExtensions = [".js", ".ts", ".jsx", ".tsx"];

    // Use a Set to deduplicate dependencies (symlink paths can cause duplicates)
    const seenDeps = new Set();

    modules.forEach((module) => {
      // Only process JS/TS files
      const sourceExt = path.extname(module.source).toLowerCase();
      if (!jsExtensions.includes(sourceExt)) return;

      // Normalize source path
      const fromFile = normalizeCruiserPath(module.source, rootDir);

      (module.dependencies || []).forEach((dep) => {
        // Only include local dependencies (not node_modules, not unresolved)
        if (
          !dep.resolved ||
          dep.resolved.includes("node_modules") ||
          dep.couldNotResolve
        ) {
          return;
        }

        const toFile = normalizeCruiserPath(dep.resolved, rootDir);

        // Skip if same file or external (starts with ..)
        if (!toFile || toFile.startsWith("..") || fromFile === toFile) {
          return;
        }

        // Deduplicate using a composite key
        const depKey = `${fromFile}:${toFile}`;
        if (seenDeps.has(depKey)) return;
        seenDeps.add(depKey);

        allDeps.push({
          fromFile,
          toFile,
          importType: mapDependencyType(dep.dependencyTypes?.[0] || "import"),
          lineNumber: dep.line || 0,
          importText: dep.module || "",
        });
      });
    });
  } catch (err) {
    errors.push(`dependency-cruiser: ${err.message}`);
  }

  // 2. Extract markdown links using regex
  try {
    const mdFiles = await findMarkdownFiles(rootDir);

    for (const filePath of mdFiles) {
      try {
        const relativePath = path
          .relative(rootDir, filePath)
          .replace(/\\/g, "/");
        const content = await fs.readFile(filePath, "utf-8");
        const mdLinks = extractMarkdownLinks(content, relativePath);

        mdLinks.forEach((link) => {
          allDeps.push({
            fromFile: relativePath,
            toFile: link.resolvedPath,
            importType: link.importType,
            lineNumber: link.lineNumber,
            importText: link.importText,
          });
        });
      } catch (err) {
        errors.push(`${filePath}: ${err.message}`);
      }
    }
  } catch (err) {
    errors.push(`markdown scan: ${err.message}`);
  }

  // 3. Insert into database
  db.prepare("DELETE FROM dependencies").run();

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO dependencies (from_file, to_file, import_type, line_number, import_text)
    VALUES (?, ?, ?, ?, ?)
  `);
  const checkExists = db.prepare("SELECT 1 FROM documents WHERE path = ?");

  let totalIndexed = 0;

  db.transaction(() => {
    allDeps
      .filter((dep) => checkExists.get(dep.toFile))
      .forEach((dep) => {
        insertStmt.run(
          dep.fromFile,
          dep.toFile,
          dep.importType,
          dep.lineNumber,
          dep.importText,
        );
        totalIndexed++;
      });
  })();

  // Count unique files that had dependencies
  const uniqueFiles = new Set(allDeps.map((d) => d.fromFile)).size;

  return {
    indexed: totalIndexed,
    files: uniqueFiles,
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
