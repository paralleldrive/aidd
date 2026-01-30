import path from "path";
import fs from "fs-extra";
import matter from "gray-matter";
import sha3 from "js-sha3";

const { sha3_256 } = sha3;

// Keys that could cause prototype pollution
const FORBIDDEN_KEYS = ["__proto__", "prototype", "constructor"];

/**
 * Detect document type based on file path.
 *
 * @param {string} filePath - Relative path to the file
 * @returns {'rule' | 'command' | 'skill' | 'task' | 'story-map' | 'other'}
 */
const detectDocumentType = (filePath) => {
  const normalized = filePath.replace(/\\/g, "/");

  if (normalized.includes("ai/rules/") || normalized.startsWith("rules/")) {
    return "rule";
  }
  if (
    normalized.includes("ai/commands/") ||
    normalized.startsWith("commands/")
  ) {
    return "command";
  }
  if (normalized.includes("ai/skills/") || normalized.startsWith("skills/")) {
    return "skill";
  }
  if (normalized.includes("tasks/") || normalized.startsWith("tasks/")) {
    return "task";
  }
  if (
    normalized.includes("plan/story-map/") ||
    normalized.includes("story-map/")
  ) {
    return "story-map";
  }

  return "other";
};

/**
 * Compute SHA3-256 hash of file contents.
 *
 * @param {string} filePath - Absolute path to file
 * @returns {Promise<string>} Hex-encoded hash
 */
const computeFileHash = async (filePath) => {
  const content = await fs.readFile(filePath, "utf-8");
  return sha3_256(content);
};

/**
 * Parse frontmatter from content, with prototype pollution protection.
 *
 * @param {string} content - File content
 * @returns {{ frontmatter: object, content: string }}
 */
const parseFrontmatter = (content) => {
  try {
    const { data, content: body } = matter(content);

    // Filter out prototype pollution keys
    const safeFrontmatter = Object.create(null);
    for (const [key, value] of Object.entries(data)) {
      if (!FORBIDDEN_KEYS.includes(key)) {
        safeFrontmatter[key] = value;
      }
    }

    return {
      frontmatter: safeFrontmatter,
      content: body.trim(),
    };
  } catch {
    return {
      frontmatter: {},
      content: content.trim(),
    };
  }
};

/**
 * Index a single file into the database.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} filePath - Absolute path to file
 * @param {string} rootDir - Root directory for relative paths
 */
const indexFile = async (db, filePath, rootDir) => {
  const relativePath = path.relative(rootDir, filePath).replace(/\\/g, "/");
  const content = await fs.readFile(filePath, "utf-8");
  const hash = sha3_256(content);
  const stats = await fs.stat(filePath);

  const { frontmatter, content: body } = parseFrontmatter(content);
  const type = detectDocumentType(relativePath);

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO documents (path, type, frontmatter, content, hash, file_size, modified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    relativePath,
    type,
    JSON.stringify(frontmatter),
    body,
    hash,
    stats.size,
    stats.mtimeMs,
  );
};

/**
 * Recursively find all markdown files in a directory.
 *
 * @param {string} dirPath - Directory to search
 * @param {string} rootDir - Root directory for relative paths
 * @returns {Promise<string[]>} Array of absolute file paths
 */
// Directories to skip during indexing
const SKIP_DIRECTORIES = ["node_modules", ".git", ".aidd", "dist", "build"];

const findMarkdownFiles = async (dirPath, rootDir = dirPath) => {
  const files = [];
  const items = await fs.readdir(dirPath, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);

    if (item.isDirectory()) {
      // Skip node_modules, .git, and other build directories
      if (SKIP_DIRECTORIES.includes(item.name) || item.name.startsWith(".")) {
        continue;
      }
      // Skip symlinks to prevent infinite recursion
      const stats = await fs.lstat(fullPath);
      if (!stats.isSymbolicLink()) {
        const nested = await findMarkdownFiles(fullPath, rootDir);
        files.push(...nested);
      }
    } else if (item.isFile()) {
      const ext = path.extname(item.name).toLowerCase();
      // Include .md and .mdc, exclude index.md
      if ((ext === ".md" || ext === ".mdc") && item.name !== "index.md") {
        files.push(fullPath);
      }
    }
  }

  return files;
};

/**
 * Index all markdown files in a directory.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} rootDir - Root directory to index
 * @returns {Promise<{ indexed: number, errors: string[] }>}
 */
const indexDirectory = async (db, rootDir) => {
  const files = await findMarkdownFiles(rootDir);
  const errors = [];

  const indexAll = db.transaction(() => {
    for (const filePath of files) {
      try {
        // Sync version for transaction
        const relativePath = path
          .relative(rootDir, filePath)
          .replace(/\\/g, "/");
        const content = fs.readFileSync(filePath, "utf-8");
        const hash = sha3_256(content);
        const stats = fs.statSync(filePath);

        const { frontmatter, content: body } = parseFrontmatter(content);
        const type = detectDocumentType(relativePath);

        db.prepare(
          `
          INSERT OR REPLACE INTO documents (path, type, frontmatter, content, hash, file_size, modified_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        ).run(
          relativePath,
          type,
          JSON.stringify(frontmatter),
          body,
          hash,
          stats.size,
          stats.mtimeMs,
        );
      } catch (err) {
        errors.push(`${filePath}: ${err.message}`);
      }
    }
  });

  indexAll();

  return {
    indexed: files.length - errors.length,
    errors,
  };
};

/**
 * Incrementally index only changed files.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} rootDir - Root directory to index
 * @returns {Promise<{ updated: number, deleted: number, unchanged: number }>}
 */
const indexIncremental = async (db, rootDir) => {
  // Get current state from database
  const existingDocs = db.prepare("SELECT path, hash FROM documents").all();
  const existingMap = new Map(existingDocs.map((d) => [d.path, d.hash]));

  // Get current files on disk
  const files = await findMarkdownFiles(rootDir);
  const currentPaths = new Set();

  const toUpdate = [];
  const toDelete = [];

  // Check each file on disk
  for (const filePath of files) {
    const relativePath = path.relative(rootDir, filePath).replace(/\\/g, "/");
    currentPaths.add(relativePath);

    const content = await fs.readFile(filePath, "utf-8");
    const newHash = sha3_256(content);

    if (existingMap.get(relativePath) !== newHash) {
      toUpdate.push(filePath);
    }
  }

  // Find deleted files
  for (const [existingPath] of existingMap) {
    if (!currentPaths.has(existingPath)) {
      toDelete.push(existingPath);
    }
  }

  // Apply changes in transaction
  db.transaction(() => {
    // Delete removed files
    const deleteStmt = db.prepare("DELETE FROM documents WHERE path = ?");
    for (const deletePath of toDelete) {
      deleteStmt.run(deletePath);
    }

    // Update/insert changed files
    for (const filePath of toUpdate) {
      const relativePath = path.relative(rootDir, filePath).replace(/\\/g, "/");
      const content = fs.readFileSync(filePath, "utf-8");
      const hash = sha3_256(content);
      const stats = fs.statSync(filePath);

      const { frontmatter, content: body } = parseFrontmatter(content);
      const type = detectDocumentType(relativePath);

      db.prepare(
        `
        INSERT OR REPLACE INTO documents (path, type, frontmatter, content, hash, file_size, modified_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      ).run(
        relativePath,
        type,
        JSON.stringify(frontmatter),
        body,
        hash,
        stats.size,
        stats.mtimeMs,
      );
    }
  })();

  return {
    updated: toUpdate.length,
    deleted: toDelete.length,
    unchanged: files.length - toUpdate.length,
  };
};

export {
  indexFile,
  indexDirectory,
  indexIncremental,
  detectDocumentType,
  computeFileHash,
  parseFrontmatter,
  findMarkdownFiles,
};
