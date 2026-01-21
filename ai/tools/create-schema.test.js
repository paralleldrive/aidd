import { describe, test, beforeEach, afterEach } from 'vitest';
import { assert } from 'riteway/vitest';
import { Database } from 'bun:sqlite';
import { createSchema } from './create-schema.js';

describe('createSchema()', async () => {
  let db;

  beforeEach(async () => {
    // Create in-memory database for fast tests
    db = new Database(':memory:');
  });

  afterEach(async () => {
    if (db) db.close();
  });

  test('should return version and success status', async () => {
    const result = createSchema(db);

    assert({
      given: 'schema creation',
      should: 'return version 1',
      actual: result.version,
      expected: 1
    });

    assert({
      given: 'schema creation',
      should: 'indicate tables were created',
      actual: result.tablesCreated,
      expected: true
    });
  });

  test('should create documents table', async () => {
    createSchema(db);

    const tableInfo = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='documents'
    `).get();

    assert({
      given: 'schema creation',
      should: 'create documents table',
      actual: tableInfo?.name,
      expected: 'documents'
    });
  });

  test('should create documents table with correct columns', async () => {
    createSchema(db);

    const columns = db.prepare(`
      PRAGMA table_info(documents)
    `).all();

    const columnNames = columns.map(c => c.name).sort();
    const expectedColumns = ['path', 'type', 'frontmatter', 'content', 'hash', 'indexed_at', 'file_size', 'modified_at'].sort();

    assert({
      given: 'documents table',
      should: 'have all required columns',
      actual: JSON.stringify(columnNames),
      expected: JSON.stringify(expectedColumns)
    });
  });

  test('should create FTS5 virtual table', async () => {
    createSchema(db);

    const tableInfo = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='documents_fts'
    `).get();

    assert({
      given: 'schema creation',
      should: 'create documents_fts virtual table',
      actual: tableInfo?.name,
      expected: 'documents_fts'
    });
  });

  test('should create dependencies table', async () => {
    createSchema(db);

    const tableInfo = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='dependencies'
    `).get();

    assert({
      given: 'schema creation',
      should: 'create dependencies table',
      actual: tableInfo?.name,
      expected: 'dependencies'
    });
  });

  test('should create productmanager tables', async () => {
    createSchema(db);

    const tables = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name IN (
        'personas', 'journeys', 'journey_personas', 'steps',
        'pain_points', 'stories', 'functional_requirements'
      )
      ORDER BY name
    `).all();

    assert({
      given: 'schema creation',
      should: 'create all 7 productmanager tables',
      actual: tables.length,
      expected: 7
    });
  });

  test('should create indexes for documents table', async () => {
    createSchema(db);

    const indexes = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='index' AND tbl_name='documents'
    `).all();

    assert({
      given: 'documents table',
      should: 'create at least 3 indexes',
      actual: indexes.length >= 3,
      expected: true
    });
  });

  test('should enable foreign keys', async () => {
    createSchema(db);

    const result = db.query('PRAGMA foreign_keys').get();
    const fkStatus = result?.foreign_keys;

    assert({
      given: 'schema creation',
      should: 'enable foreign key constraints',
      actual: fkStatus,
      expected: 1
    });
  });

  test('should record schema version', async () => {
    createSchema(db);

    const version = db.prepare(`
      SELECT version FROM schema_version WHERE version = 1
    `).get();

    assert({
      given: 'schema creation',
      should: 'record schema version 1',
      actual: version?.version,
      expected: 1
    });
  });

  test('should create FTS5 triggers', async () => {
    createSchema(db);

    const triggers = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='trigger' AND name LIKE 'documents_fts_%'
    `).all();

    assert({
      given: 'schema creation',
      should: 'create 3 FTS5 triggers (insert, update, delete)',
      actual: triggers.length,
      expected: 3
    });
  });

  test('should enforce foreign key constraints', async () => {
    createSchema(db);

    let errorThrown = false;
    let errorMessage = '';

    try {
      db.prepare(`
        INSERT INTO stories (
          id, step_id, name, priority, status, created_at, updated_at
        ) VALUES (
          'story1', 'nonexistent', 'Test Story', 50, 'backlog', ?, ?
        )
      `).run(Date.now(), Date.now());
    } catch (error) {
      errorThrown = true;
      errorMessage = error.message;
    }

    assert({
      given: 'invalid foreign key',
      should: 'throw foreign key constraint error',
      actual: errorThrown && errorMessage.includes('FOREIGN KEY'),
      expected: true
    });
  });

  test('should be idempotent', async () => {
    createSchema(db);
    const result2 = createSchema(db);

    const versionCount = db.prepare(`
      SELECT COUNT(*) as count FROM schema_version WHERE version = 1
    `).get();

    assert({
      given: 'multiple schema creation calls',
      should: 'not duplicate schema version records',
      actual: versionCount.count,
      expected: 1
    });
  });

  test('should create indexes for dependency traversal', async () => {
    createSchema(db);

    const indexes = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='index' AND tbl_name='dependencies'
      ORDER BY name
    `).all();

    const indexNames = indexes.map(i => i.name);

    assert({
      given: 'dependencies table',
      should: 'create index on from_file',
      actual: indexNames.includes('idx_dependencies_from'),
      expected: true
    });

    assert({
      given: 'dependencies table',
      should: 'create index on to_file',
      actual: indexNames.includes('idx_dependencies_to'),
      expected: true
    });
  });

  test('should validate pain point impact range', async () => {
    createSchema(db);

    let errorThrown = false;
    let errorMessage = '';

    try {
      db.prepare(`
        INSERT INTO pain_points (
          id, name, impact, frequency, created_at, updated_at
        ) VALUES (
          'pp1', 'Test Pain', 15, 5, ?, ?
        )
      `).run(Date.now(), Date.now());
    } catch (error) {
      errorThrown = true;
      errorMessage = error.message;
    }

    assert({
      given: 'impact value > 10',
      should: 'enforce CHECK constraint on impact',
      actual: errorThrown && errorMessage.includes('CHECK constraint'),
      expected: true
    });
  });

  test('should validate story status values', async () => {
    createSchema(db);

    let errorThrown = false;
    let errorMessage = '';

    try{
      db.prepare(`
        INSERT INTO stories (
          id, name, status, priority, created_at, updated_at
        ) VALUES (
          'story1', 'Test', 'invalid_status', 50, ?, ?
        )
      `).run(Date.now(), Date.now());
    } catch (error) {
      errorThrown = true;
      errorMessage = error.message;
    }

    assert({
      given: 'invalid status value',
      should: 'enforce CHECK constraint on status',
      actual: errorThrown && errorMessage.includes('CHECK constraint'),
      expected: true
    });
  });
});
