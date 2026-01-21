#!/usr/bin/env bun
/**
 * SQLite Schema Creation
 * Creates the complete database schema for aidd indexing system
 */

import { Database } from 'bun:sqlite';

/**
 * Creates the complete database schema
 * @param {Database} db - SQLite database instance
 */
export function createSchema(db) {
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON');

  // Schema version tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )
  `);

  // Documents table - main frontmatter index
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      path TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      frontmatter JSON,
      content TEXT,
      hash TEXT NOT NULL,
      indexed_at INTEGER NOT NULL,
      file_size INTEGER,
      modified_at INTEGER
    )
  `);

  // Indexes for documents
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
    CREATE INDEX IF NOT EXISTS idx_documents_indexed_at ON documents(indexed_at);
    CREATE INDEX IF NOT EXISTS idx_documents_modified_at ON documents(modified_at);
  `);

  // FTS5 virtual table for full-text search
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
      path UNINDEXED,
      type,
      content,
      frontmatter_text,
      tokenize='porter unicode61'
    )
  `);

  // Triggers to keep FTS5 in sync with documents table
  db.exec(`
    DROP TRIGGER IF EXISTS documents_fts_insert;
    CREATE TRIGGER documents_fts_insert AFTER INSERT ON documents BEGIN
      INSERT INTO documents_fts(rowid, path, type, content, frontmatter_text)
      VALUES (
        new.rowid,
        new.path,
        new.type,
        new.content,
        json_extract(new.frontmatter, '$')
      );
    END;
  `);

  db.exec(`
    DROP TRIGGER IF EXISTS documents_fts_update;
    CREATE TRIGGER documents_fts_update AFTER UPDATE ON documents BEGIN
      UPDATE documents_fts
      SET
        type = new.type,
        content = new.content,
        frontmatter_text = json_extract(new.frontmatter, '$')
      WHERE rowid = old.rowid;
    END;
  `);

  db.exec(`
    DROP TRIGGER IF EXISTS documents_fts_delete;
    CREATE TRIGGER documents_fts_delete AFTER DELETE ON documents BEGIN
      DELETE FROM documents_fts WHERE rowid = old.rowid;
    END;
  `);

  // Dependencies table - import graph
  db.exec(`
    CREATE TABLE IF NOT EXISTS dependencies (
      from_file TEXT NOT NULL,
      to_file TEXT NOT NULL,
      import_type TEXT NOT NULL,
      line_number INTEGER,
      import_text TEXT,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (from_file, to_file, import_type)
    )
  `);

  // Indexes for dependency traversal
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_dependencies_from ON dependencies(from_file);
    CREATE INDEX IF NOT EXISTS idx_dependencies_to ON dependencies(to_file);
    CREATE INDEX IF NOT EXISTS idx_dependencies_type ON dependencies(import_type);
  `);

  // ProductManager tables

  // Personas
  db.exec(`
    CREATE TABLE IF NOT EXISTS personas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      metadata JSON
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_personas_name ON personas(name);
    CREATE INDEX IF NOT EXISTS idx_personas_created_at ON personas(created_at);
  `);

  // Journeys
  db.exec(`
    CREATE TABLE IF NOT EXISTS journeys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      metadata JSON
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_journeys_name ON journeys(name);
    CREATE INDEX IF NOT EXISTS idx_journeys_created_at ON journeys(created_at);
  `);

  // Many-to-many: journeys <-> personas
  db.exec(`
    CREATE TABLE IF NOT EXISTS journey_personas (
      journey_id TEXT NOT NULL,
      persona_id TEXT NOT NULL,
      PRIMARY KEY (journey_id, persona_id),
      FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
      FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_journey_personas_journey ON journey_personas(journey_id);
    CREATE INDEX IF NOT EXISTS idx_journey_personas_persona ON journey_personas(persona_id);
  `);

  // Steps
  db.exec(`
    CREATE TABLE IF NOT EXISTS steps (
      id TEXT PRIMARY KEY,
      journey_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      order_index INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      metadata JSON,
      FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_steps_journey ON steps(journey_id);
    CREATE INDEX IF NOT EXISTS idx_steps_order ON steps(journey_id, order_index);
    CREATE INDEX IF NOT EXISTS idx_steps_created_at ON steps(created_at);
  `);

  // Pain Points
  db.exec(`
    CREATE TABLE IF NOT EXISTS pain_points (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      impact INTEGER NOT NULL CHECK(impact BETWEEN 1 AND 10),
      frequency INTEGER NOT NULL CHECK(frequency BETWEEN 1 AND 10),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      metadata JSON
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_pain_points_impact ON pain_points(impact);
    CREATE INDEX IF NOT EXISTS idx_pain_points_frequency ON pain_points(frequency);
  `);

  // Stories
  db.exec(`
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      step_id TEXT,
      pain_point_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      priority INTEGER,
      status TEXT CHECK(status IN ('backlog', 'inProgress', 'released', 'cancelled')),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      metadata JSON,
      FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE SET NULL,
      FOREIGN KEY (pain_point_id) REFERENCES pain_points(id) ON DELETE SET NULL
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_stories_step ON stories(step_id);
    CREATE INDEX IF NOT EXISTS idx_stories_pain_point ON stories(pain_point_id);
    CREATE INDEX IF NOT EXISTS idx_stories_priority ON stories(priority DESC);
    CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
    CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at);
  `);

  // Functional Requirements
  db.exec(`
    CREATE TABLE IF NOT EXISTS functional_requirements (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL,
      description TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      metadata JSON,
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_requirements_story ON functional_requirements(story_id);
    CREATE INDEX IF NOT EXISTS idx_requirements_order ON functional_requirements(story_id, order_index);
  `);

  // Record schema version
  const version = 1;
  const now = Date.now();

  const existing = db.prepare('SELECT version FROM schema_version WHERE version = ?').get(version);
  if (!existing) {
    db.prepare('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)').run(version, now);
  }

  return { version, tablesCreated: true };
}

/**
 * Main execution when run as script
 */
if (import.meta.main) {
  const dbPath = process.argv[2] || '.aidd/index.db';

  console.log(`Creating schema in ${dbPath}...`);

  const db = new Database(dbPath);
  const result = createSchema(db);

  console.log(`✓ Schema created successfully (version ${result.version})`);

  // Show table count
  const tables = db.prepare(`
    SELECT COUNT(*) as count
    FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `).get();

  console.log(`✓ Created ${tables.count} tables`);

  db.close();
}
