/**
 * Database schema for aidd index.
 * Creates tables for documents, full-text search, and dependencies.
 */

const CURRENT_SCHEMA_VERSION = 1;

/**
 * Check if a table exists in the database.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} tableName
 * @returns {boolean}
 */
const tableExists = (db, tableName) => {
  const result = db
    .prepare(
      `
    SELECT name FROM sqlite_master
    WHERE type='table' AND name = ?
  `,
    )
    .get(tableName);
  return result !== undefined;
};

/**
 * Get the current schema version from the database.
 * Returns 0 if schema_version table doesn't exist.
 *
 * @param {import('better-sqlite3').Database} db
 * @returns {number}
 */
const getSchemaVersion = (db) => {
  if (!tableExists(db, "schema_version")) {
    return 0;
  }
  const result = db
    .prepare("SELECT version FROM schema_version ORDER BY version DESC LIMIT 1")
    .get();
  return result?.version ?? 0;
};

/**
 * Create the schema_version table for tracking migrations.
 *
 * @param {import('better-sqlite3').Database} db
 */
const createSchemaVersionTable = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    )
  `);
};

/**
 * Create the documents table for storing file metadata and content.
 *
 * @param {import('better-sqlite3').Database} db
 */
const createDocumentsTable = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      path TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'other',
      frontmatter TEXT NOT NULL DEFAULT '{}',
      content TEXT NOT NULL DEFAULT '',
      hash TEXT NOT NULL,
      file_size INTEGER,
      modified_at INTEGER,
      indexed_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    )
  `);

  // Index for querying by type
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type)
  `);

  // Index for finding stale entries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(hash)
  `);
};

/**
 * Create FTS5 virtual table for full-text search.
 * Includes triggers to keep it in sync with documents table.
 *
 * @param {import('better-sqlite3').Database} db
 */
const createFtsTable = (db) => {
  // FTS5 virtual table for full-text search on content and frontmatter
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS fts_documents USING fts5(
      path,
      frontmatter,
      content,
      content='documents',
      content_rowid='rowid'
    )
  `);

  // Trigger to sync inserts
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS fts_documents_insert AFTER INSERT ON documents BEGIN
      INSERT INTO fts_documents(rowid, path, frontmatter, content)
      VALUES (NEW.rowid, NEW.path, NEW.frontmatter, NEW.content);
    END
  `);

  // Trigger to sync updates
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS fts_documents_update AFTER UPDATE ON documents BEGIN
      INSERT INTO fts_documents(fts_documents, rowid, path, frontmatter, content)
      VALUES ('delete', OLD.rowid, OLD.path, OLD.frontmatter, OLD.content);
      INSERT INTO fts_documents(rowid, path, frontmatter, content)
      VALUES (NEW.rowid, NEW.path, NEW.frontmatter, NEW.content);
    END
  `);

  // Trigger to sync deletes
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS fts_documents_delete AFTER DELETE ON documents BEGIN
      INSERT INTO fts_documents(fts_documents, rowid, path, frontmatter, content)
      VALUES ('delete', OLD.rowid, OLD.path, OLD.frontmatter, OLD.content);
    END
  `);
};

/**
 * Create the dependencies table for tracking file imports.
 *
 * @param {import('better-sqlite3').Database} db
 */
const createDependenciesTable = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS dependencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_file TEXT NOT NULL,
      to_file TEXT NOT NULL,
      import_type TEXT NOT NULL DEFAULT 'import',
      line_number INTEGER,
      import_text TEXT,
      FOREIGN KEY (from_file) REFERENCES documents(path) ON DELETE CASCADE,
      UNIQUE(from_file, to_file, import_type)
    )
  `);

  // Index for forward dependency lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_dependencies_from ON dependencies(from_file)
  `);

  // Index for reverse dependency lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_dependencies_to ON dependencies(to_file)
  `);
};

/**
 * Initialize the database schema.
 * Safe to call multiple times (idempotent).
 *
 * @param {import('better-sqlite3').Database} db
 */
const initializeSchema = (db) => {
  const currentVersion = getSchemaVersion(db);

  if (currentVersion >= CURRENT_SCHEMA_VERSION) {
    return; // Already up to date
  }

  db.transaction(() => {
    createSchemaVersionTable(db);
    createDocumentsTable(db);
    createFtsTable(db);
    createDependenciesTable(db);

    // Record schema version
    db.prepare(
      `
      INSERT OR REPLACE INTO schema_version (version) VALUES (?)
    `,
    ).run(CURRENT_SCHEMA_VERSION);
  })();
};

export {
  initializeSchema,
  getSchemaVersion,
  tableExists,
  CURRENT_SCHEMA_VERSION,
};
