import { describe, test, onTestFinished } from "vitest";
import { assert } from "riteway/vitest";

import { createDatabase, closeDatabase } from "./connection.js";
import {
  initializeSchema,
  getSchemaVersion,
  tableExists,
  CURRENT_SCHEMA_VERSION,
} from "./schema.js";

const setupTestDatabase = () => {
  const db = createDatabase(":memory:");
  onTestFinished(() => closeDatabase(db));
  return db;
};

describe("db/schema", () => {
  describe("initializeSchema", () => {
    test("creates schema_version table", () => {
      const db = setupTestDatabase();
      initializeSchema(db);

      assert({
        given: "initializeSchema called",
        should: "create schema_version table",
        actual: tableExists(db, "schema_version"),
        expected: true,
      });
    });

    test("creates documents table", () => {
      const db = setupTestDatabase();
      initializeSchema(db);

      assert({
        given: "initializeSchema called",
        should: "create documents table",
        actual: tableExists(db, "documents"),
        expected: true,
      });
    });

    test("creates fts_documents virtual table", () => {
      const db = setupTestDatabase();
      initializeSchema(db);

      assert({
        given: "initializeSchema called",
        should: "create fts_documents FTS5 virtual table",
        actual: tableExists(db, "fts_documents"),
        expected: true,
      });
    });

    test("creates dependencies table", () => {
      const db = setupTestDatabase();
      initializeSchema(db);

      assert({
        given: "initializeSchema called",
        should: "create dependencies table",
        actual: tableExists(db, "dependencies"),
        expected: true,
      });
    });

    test("sets schema version", () => {
      const db = setupTestDatabase();
      initializeSchema(db);

      assert({
        given: "initializeSchema called",
        should: "set current schema version",
        actual: getSchemaVersion(db),
        expected: CURRENT_SCHEMA_VERSION,
      });
    });

    test("is idempotent - safe to call multiple times", () => {
      const db = setupTestDatabase();
      initializeSchema(db);
      initializeSchema(db);
      initializeSchema(db);

      assert({
        given: "initializeSchema called multiple times",
        should: "still have correct schema version",
        actual: getSchemaVersion(db),
        expected: CURRENT_SCHEMA_VERSION,
      });
    });
  });

  describe("documents table structure", () => {
    test("allows inserting document with all fields", () => {
      const db = setupTestDatabase();
      initializeSchema(db);

      const insert = db.prepare(`
        INSERT INTO documents (path, type, frontmatter, content, hash, file_size, modified_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insert.run(
        "ai/rules/test.mdc",
        "rule",
        JSON.stringify({ description: "Test rule" }),
        "# Test\n\nContent here",
        "abc123",
        1024,
        Date.now(),
      );

      assert({
        given: "inserting a document",
        should: "succeed with changes = 1",
        actual: result.changes,
        expected: 1,
      });
    });

    test("enforces unique path constraint", () => {
      const db = setupTestDatabase();
      initializeSchema(db);

      const insert = db.prepare(`
        INSERT INTO documents (path, type, frontmatter, content, hash)
        VALUES (?, ?, ?, ?, ?)
      `);

      insert.run("ai/rules/test.mdc", "rule", "{}", "content", "hash1");

      let threw = false;
      try {
        insert.run("ai/rules/test.mdc", "rule", "{}", "content", "hash2");
      } catch {
        threw = true;
      }

      assert({
        given: "inserting duplicate path",
        should: "throw constraint error",
        actual: threw,
        expected: true,
      });
    });

    test("supports UPSERT via INSERT OR REPLACE", () => {
      const db = setupTestDatabase();
      initializeSchema(db);

      const upsert = db.prepare(`
        INSERT OR REPLACE INTO documents (path, type, frontmatter, content, hash)
        VALUES (?, ?, ?, ?, ?)
      `);

      upsert.run("ai/rules/test.mdc", "rule", "{}", "content v1", "hash1");
      upsert.run("ai/rules/test.mdc", "rule", "{}", "content v2", "hash2");

      const doc = db
        .prepare("SELECT content, hash FROM documents WHERE path = ?")
        .get("ai/rules/test.mdc");

      assert({
        given: "upserting a document",
        should: "update existing record",
        actual: { content: doc.content, hash: doc.hash },
        expected: { content: "content v2", hash: "hash2" },
      });
    });
  });

  describe("FTS5 full-text search", () => {
    test("syncs content to FTS index via trigger", () => {
      const db = setupTestDatabase();
      initializeSchema(db);

      db.prepare(
        `
        INSERT INTO documents (path, type, frontmatter, content, hash)
        VALUES (?, ?, ?, ?, ?)
      `,
      ).run(
        "ai/rules/auth.mdc",
        "rule",
        JSON.stringify({ description: "Authentication rules" }),
        "# Authentication\n\nHandle user login and sessions",
        "hash123",
      );

      const results = db
        .prepare(
          `
        SELECT path FROM fts_documents WHERE fts_documents MATCH ?
      `,
        )
        .all("authentication");

      assert({
        given: "document with 'authentication' in frontmatter",
        should: "be found via FTS search",
        actual: results.length,
        expected: 1,
      });
    });

    test("finds content matches", () => {
      const db = setupTestDatabase();
      initializeSchema(db);

      db.prepare(
        `
        INSERT INTO documents (path, type, frontmatter, content, hash)
        VALUES (?, ?, ?, ?, ?)
      `,
      ).run(
        "ai/rules/session.mdc",
        "rule",
        "{}",
        "# Session Management\n\nHandle user sessions and cookies",
        "hash456",
      );

      const results = db
        .prepare(
          `
        SELECT path FROM fts_documents WHERE fts_documents MATCH ?
      `,
        )
        .all("cookies");

      assert({
        given: "document with 'cookies' in content",
        should: "be found via FTS search",
        actual: results.map((r) => r.path),
        expected: ["ai/rules/session.mdc"],
      });
    });

    test("updates FTS index when document is updated", () => {
      const db = setupTestDatabase();
      initializeSchema(db);

      db.prepare(
        `
        INSERT INTO documents (path, type, frontmatter, content, hash)
        VALUES (?, ?, ?, ?, ?)
      `,
      ).run("ai/rules/test.mdc", "rule", "{}", "original content", "hash1");

      db.prepare(
        `
        UPDATE documents SET content = ?, hash = ? WHERE path = ?
      `,
      ).run("updated content with newterm", "hash2", "ai/rules/test.mdc");

      const results = db
        .prepare(
          `
        SELECT path FROM fts_documents WHERE fts_documents MATCH ?
      `,
        )
        .all("newterm");

      assert({
        given: "document updated with new content",
        should: "find new content via FTS",
        actual: results.length,
        expected: 1,
      });
    });

    test("removes from FTS index when document is deleted", () => {
      const db = setupTestDatabase();
      initializeSchema(db);

      db.prepare(
        `
        INSERT INTO documents (path, type, frontmatter, content, hash)
        VALUES (?, ?, ?, ?, ?)
      `,
      ).run("ai/rules/temp.mdc", "rule", "{}", "temporary content", "hash1");

      db.prepare("DELETE FROM documents WHERE path = ?").run(
        "ai/rules/temp.mdc",
      );

      const results = db
        .prepare(
          `
        SELECT path FROM fts_documents WHERE fts_documents MATCH ?
      `,
        )
        .all("temporary");

      assert({
        given: "document deleted",
        should: "no longer appear in FTS results",
        actual: results.length,
        expected: 0,
      });
    });
  });

  describe("dependencies table", () => {
    test("allows inserting dependency relationships", () => {
      const db = setupTestDatabase();
      initializeSchema(db);

      // Insert parent documents first
      const insertDoc = db.prepare(`
        INSERT INTO documents (path, type, frontmatter, content, hash)
        VALUES (?, ?, ?, ?, ?)
      `);
      insertDoc.run("src/index.js", "other", "{}", "content", "hash1");
      insertDoc.run("src/utils.js", "other", "{}", "content", "hash2");

      const insertDep = db.prepare(`
        INSERT INTO dependencies (from_file, to_file, import_type, line_number, import_text)
        VALUES (?, ?, ?, ?, ?)
      `);

      const result = insertDep.run(
        "src/index.js",
        "src/utils.js",
        "import",
        5,
        "import { helper } from './utils.js'",
      );

      assert({
        given: "inserting a dependency",
        should: "succeed with changes = 1",
        actual: result.changes,
        expected: 1,
      });
    });

    test("cascades delete when from_file document is deleted", () => {
      const db = setupTestDatabase();
      initializeSchema(db);

      const insertDoc = db.prepare(`
        INSERT INTO documents (path, type, frontmatter, content, hash)
        VALUES (?, ?, ?, ?, ?)
      `);
      insertDoc.run("src/a.js", "other", "{}", "content", "hash1");
      insertDoc.run("src/b.js", "other", "{}", "content", "hash2");

      db.prepare(
        `
        INSERT INTO dependencies (from_file, to_file, import_type)
        VALUES (?, ?, ?)
      `,
      ).run("src/a.js", "src/b.js", "import");

      db.prepare("DELETE FROM documents WHERE path = ?").run("src/a.js");

      const deps = db
        .prepare("SELECT * FROM dependencies WHERE from_file = ?")
        .all("src/a.js");

      assert({
        given: "from_file document deleted",
        should: "cascade delete the dependency",
        actual: deps.length,
        expected: 0,
      });
    });
  });

  describe("tableExists", () => {
    test("returns true for existing table", () => {
      const db = setupTestDatabase();
      initializeSchema(db);

      assert({
        given: "documents table created",
        should: "return true",
        actual: tableExists(db, "documents"),
        expected: true,
      });
    });

    test("returns false for non-existing table", () => {
      const db = setupTestDatabase();

      assert({
        given: "table does not exist",
        should: "return false",
        actual: tableExists(db, "nonexistent"),
        expected: false,
      });
    });
  });
});
