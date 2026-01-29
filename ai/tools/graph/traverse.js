/**
 * Dependency graph traversal using recursive CTEs.
 */

// Delimiter for tracking visited paths in recursive CTEs.
// Using char(0) (null byte) which is invalid in file paths on all operating systems.
const VISITED_DELIMITER = "char(0)";

/**
 * Get forward dependencies (files that this file imports).
 * Uses recursive CTE for efficient traversal.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} filePath - Starting file path
 * @param {Object} options
 * @param {number} [options.maxDepth=3] - Maximum traversal depth
 * @returns {Array<{file: string, depth: number, importType: string}>}
 */
const getForwardDeps = (db, filePath, { maxDepth = 3 } = {}) => {
  const query = `
    WITH RECURSIVE forward_deps(file, depth, visited) AS (
      -- Base case: direct dependencies
      SELECT
        to_file,
        1,
        from_file || ${VISITED_DELIMITER} || to_file
      FROM dependencies
      WHERE from_file = ?

      UNION

      -- Recursive case
      SELECT
        d.to_file,
        fd.depth + 1,
        fd.visited || ${VISITED_DELIMITER} || d.to_file
      FROM dependencies d
      JOIN forward_deps fd ON d.from_file = fd.file
      WHERE fd.depth < ?
        AND instr(${VISITED_DELIMITER} || fd.visited || ${VISITED_DELIMITER}, ${VISITED_DELIMITER} || d.to_file || ${VISITED_DELIMITER}) = 0
    )
    SELECT DISTINCT file, MIN(depth) as depth
    FROM forward_deps
    GROUP BY file
    ORDER BY depth, file
  `;

  return db
    .prepare(query)
    .all(filePath, maxDepth)
    .map((row) => ({
      file: row.file,
      depth: row.depth,
      direction: "forward",
    }));
};

/**
 * Get reverse dependencies (files that import this file).
 * Uses recursive CTE for efficient traversal.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} filePath - Target file path
 * @param {Object} options
 * @param {number} [options.maxDepth=3] - Maximum traversal depth
 * @returns {Array<{file: string, depth: number, importType: string}>}
 */
const getReverseDeps = (db, filePath, { maxDepth = 3 } = {}) => {
  const query = `
    WITH RECURSIVE reverse_deps(file, depth, visited) AS (
      -- Base case: files that directly import target
      SELECT
        from_file,
        1,
        to_file || ${VISITED_DELIMITER} || from_file
      FROM dependencies
      WHERE to_file = ?

      UNION

      -- Recursive case
      SELECT
        d.from_file,
        rd.depth + 1,
        rd.visited || ${VISITED_DELIMITER} || d.from_file
      FROM dependencies d
      JOIN reverse_deps rd ON d.to_file = rd.file
      WHERE rd.depth < ?
        AND instr(${VISITED_DELIMITER} || rd.visited || ${VISITED_DELIMITER}, ${VISITED_DELIMITER} || d.from_file || ${VISITED_DELIMITER}) = 0
    )
    SELECT DISTINCT file, MIN(depth) as depth
    FROM reverse_deps
    GROUP BY file
    ORDER BY depth, file
  `;

  return db
    .prepare(query)
    .all(filePath, maxDepth)
    .map((row) => ({
      file: row.file,
      depth: row.depth,
      direction: "reverse",
    }));
};

/**
 * Find all related files (forward, reverse, or both).
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} filePath - Starting file path
 * @param {Object} options
 * @param {'forward' | 'reverse' | 'both'} [options.direction='both'] - Direction to traverse
 * @param {number} [options.maxDepth=3] - Maximum traversal depth
 * @returns {Array<{file: string, depth: number, direction: string}>}
 */
const findRelated = (
  db,
  filePath,
  { direction = "both", maxDepth = 3 } = {},
) => {
  const results = [];

  if (direction === "forward" || direction === "both") {
    results.push(...getForwardDeps(db, filePath, { maxDepth }));
  }

  if (direction === "reverse" || direction === "both") {
    results.push(...getReverseDeps(db, filePath, { maxDepth }));
  }

  // Deduplicate by file path, keeping the shortest depth
  const byFile = new Map();
  for (const result of results) {
    const existing = byFile.get(result.file);
    if (!existing || result.depth < existing.depth) {
      byFile.set(result.file, result);
    }
  }

  return [...byFile.values()].sort((a, b) => {
    if (a.depth !== b.depth) return a.depth - b.depth;
    return a.file.localeCompare(b.file);
  });
};

/**
 * Get the full dependency graph as an adjacency list.
 *
 * @param {import('better-sqlite3').Database} db
 * @returns {Map<string, string[]>}
 */
const getDependencyGraph = (db) => {
  const deps = db.prepare("SELECT from_file, to_file FROM dependencies").all();

  const graph = new Map();
  for (const { from_file, to_file } of deps) {
    if (!graph.has(from_file)) {
      graph.set(from_file, []);
    }
    graph.get(from_file).push(to_file);
  }

  return graph;
};

/**
 * Find all entry points (files with no dependents).
 *
 * @param {import('better-sqlite3').Database} db
 * @returns {Array<string>}
 */
const findEntryPoints = (db) => {
  const query = `
    SELECT DISTINCT d.path
    FROM documents d
    WHERE d.path NOT IN (SELECT to_file FROM dependencies)
      AND d.path IN (SELECT from_file FROM dependencies)
    ORDER BY d.path
  `;

  return db
    .prepare(query)
    .all()
    .map((row) => row.path);
};

/**
 * Find all leaf nodes (files with no dependencies).
 *
 * @param {import('better-sqlite3').Database} db
 * @returns {Array<string>}
 */
const findLeafNodes = (db) => {
  const query = `
    SELECT DISTINCT d.path
    FROM documents d
    WHERE d.path NOT IN (SELECT from_file FROM dependencies)
      AND d.path IN (SELECT to_file FROM dependencies)
    ORDER BY d.path
  `;

  return db
    .prepare(query)
    .all()
    .map((row) => row.path);
};

export {
  findRelated,
  getForwardDeps,
  getReverseDeps,
  getDependencyGraph,
  findEntryPoints,
  findLeafNodes,
};
