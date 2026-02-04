/**
 * Full-text search using SQLite FTS5.
 */

/**
 * Search documents using FTS5 full-text search.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} query - Search query (supports FTS5 operators)
 * @param {Object} options
 * @param {number} [options.limit=20] - Maximum results
 * @param {number} [options.offset=0] - Result offset
 * @param {string} [options.type] - Filter by document type
 * @param {boolean} [options.silent=false] - Suppress error logging
 * @returns {Array<{path: string, type: string, frontmatter: object, snippet: string, rank: number}>}
 */
const searchFts5 = (
  db,
  query,
  { limit = 20, offset = 0, type, silent = false } = {},
) => {
  if (!query || query.trim() === "") {
    return [];
  }

  // Build query with optional type filter
  const sqlParts = [
    `SELECT
      d.path,
      d.type,
      d.frontmatter,
      d.content,
      bm25(fts_documents) as rank
    FROM fts_documents f
    JOIN documents d ON d.path = f.path
    WHERE fts_documents MATCH ?`,
  ];

  const params = [query];

  if (type) {
    sqlParts.push(`AND d.type = ?`);
    params.push(type);
  }

  sqlParts.push(`ORDER BY rank LIMIT ? OFFSET ?`);
  params.push(limit, offset);

  const sql = sqlParts.join(" ");

  try {
    const rows = db.prepare(sql).all(...params);

    return rows.map((row) => ({
      path: row.path,
      type: row.type,
      frontmatter: JSON.parse(row.frontmatter ?? "{}"),
      snippet: extractSnippet(row.content, query),
      rank: row.rank,
    }));
  } catch (err) {
    // FTS5 query syntax error - log and return empty results
    if (!silent) {
      console.error(`FTS5 query error: ${err.message}`);
    }
    return [];
  }
};

/**
 * Extract a relevant snippet from content around the search terms.
 *
 * @param {string} content
 * @param {string} query
 * @param {number} contextChars - Characters of context around match
 * @returns {string}
 */
const extractSnippet = (content, query, contextChars = 100) => {
  // Get first significant word from query (ignore operators)
  const words = query
    .replace(/['"()]/g, "")
    .split(/\s+/)
    .filter((w) => !["AND", "OR", "NOT", "NEAR"].includes(w.toUpperCase()));

  if (words.length === 0) {
    return content.slice(0, contextChars * 2) + "...";
  }

  const searchWord = words[0].toLowerCase();
  const contentLower = content.toLowerCase();
  const idx = contentLower.indexOf(searchWord);

  if (idx === -1) {
    return content.slice(0, contextChars * 2) + "...";
  }

  const start = Math.max(0, idx - contextChars);
  const end = Math.min(content.length, idx + searchWord.length + contextChars);

  const snippet =
    (start > 0 ? "..." : "") +
    content.slice(start, end) +
    (end < content.length ? "..." : "");

  return snippet;
};

/**
 * Highlight matching terms in text.
 *
 * @param {string} text
 * @param {string} query
 * @returns {string}
 */
const highlightMatches = (text, query) => {
  // Get words from query (ignore operators)
  const words = query
    .replace(/['"()]/g, "")
    .split(/\s+/)
    .filter((w) => !["AND", "OR", "NOT", "NEAR"].includes(w.toUpperCase()))
    .filter((w) => w.length > 0);

  return words.reduce(
    (result, word) =>
      result.replace(new RegExp(`(${escapeRegex(word)})`, "gi"), "**$1**"),
    text,
  );
};

/**
 * Escape special regex characters.
 *
 * @param {string} str
 * @returns {string}
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export { searchFts5, extractSnippet, highlightMatches };
