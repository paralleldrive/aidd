import Database from "better-sqlite3";

/**
 * Create a new SQLite database connection with optimized settings.
 * Uses WAL mode for better concurrency and enables foreign keys.
 *
 * @param {string} dbPath - Path to database file, or ':memory:' for in-memory
 * @returns {Database.Database} Configured database instance
 */
const createDatabase = (dbPath) => {
  const db = new Database(dbPath);

  // Enable WAL mode for better concurrent read/write performance
  db.pragma("journal_mode = WAL");

  // Enable foreign key constraints
  db.pragma("foreign_keys = ON");

  return db;
};

/**
 * Safely close a database connection.
 *
 * @param {Database.Database} db - Database instance to close
 * @returns {boolean} True if closed successfully, false if already closed
 */
const closeDatabase = (db) => {
  try {
    if (db.open) {
      db.close();
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

export { createDatabase, closeDatabase };
