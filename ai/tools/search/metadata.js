/**
 * Metadata search for filtering documents by frontmatter fields.
 */

/**
 * Validate JSON path to prevent SQL injection.
 * Only allows alphanumeric characters, underscores, and dots.
 *
 * @param {string} jsonPath
 * @returns {boolean}
 */
const isValidJsonPath = (jsonPath) => /^[a-zA-Z0-9_.]+$/.test(jsonPath);

/**
 * Search documents by metadata/frontmatter fields.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {Object} filters - Filter conditions
 * @param {Object} options
 * @param {number} [options.limit=20] - Maximum results
 * @param {number} [options.offset=0] - Result offset
 * @returns {Array<{path: string, type: string, frontmatter: object}>}
 */
const searchMetadata = (db, filters = {}, { limit = 20, offset = 0 } = {}) => {
  const conditions = [];
  const params = [];

  for (const [key, value] of Object.entries(filters)) {
    if (key === "type") {
      // Direct column filter
      conditions.push("type = ?");
      params.push(value);
    } else if (key.startsWith("frontmatter.")) {
      // JSON field filter
      const jsonPath = key.replace("frontmatter.", "");

      // Validate jsonPath to prevent SQL injection
      if (!isValidJsonPath(jsonPath)) {
        throw new Error(
          `Invalid JSON path: ${jsonPath}. Only alphanumeric characters, underscores, and dots are allowed.`,
        );
      }

      if (typeof value === "object" && value !== null && "contains" in value) {
        // Array contains check using JSON functions
        conditions.push(
          `EXISTS (
            SELECT 1 FROM json_each(json_extract(frontmatter, '$.${jsonPath}'))
            WHERE value = ?
          )`,
        );
        params.push(value.contains);
      } else if (typeof value === "boolean") {
        // Boolean comparison
        conditions.push(`json_extract(frontmatter, '$.${jsonPath}') = ?`);
        params.push(value ? 1 : 0);
      } else if (typeof value === "number") {
        // Numeric comparison
        conditions.push(`json_extract(frontmatter, '$.${jsonPath}') = ?`);
        params.push(value);
      } else {
        // String comparison
        conditions.push(`json_extract(frontmatter, '$.${jsonPath}') = ?`);
        params.push(value);
      }
    }
  }

  let sql = "SELECT path, type, frontmatter, content FROM documents";

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  sql += " ORDER BY path LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const rows = db.prepare(sql).all(...params);

  return rows.map((row) => ({
    path: row.path,
    type: row.type,
    frontmatter: JSON.parse(row.frontmatter || "{}"),
    content: row.content,
  }));
};

/**
 * Get all unique values for a frontmatter field.
 * Useful for building filter UIs.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} field - Frontmatter field name
 * @returns {Array<string>}
 */
const getFieldValues = (db, field) => {
  // Validate field to prevent SQL injection
  if (!isValidJsonPath(field)) {
    throw new Error(
      `Invalid field name: ${field}. Only alphanumeric characters, underscores, and dots are allowed.`,
    );
  }

  const sql = `
    SELECT DISTINCT json_extract(frontmatter, '$.${field}') as value
    FROM documents
    WHERE json_extract(frontmatter, '$.${field}') IS NOT NULL
    ORDER BY value
  `;

  return db
    .prepare(sql)
    .all()
    .map((row) => row.value)
    .filter((v) => v !== null);
};

/**
 * Get all unique document types.
 *
 * @param {import('better-sqlite3').Database} db
 * @returns {Array<string>}
 */
const getDocumentTypes = (db) => {
  const sql = `SELECT DISTINCT type FROM documents ORDER BY type`;
  return db
    .prepare(sql)
    .all()
    .map((row) => row.type);
};

export { searchMetadata, getFieldValues, getDocumentTypes };
