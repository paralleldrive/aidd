import { describe, test, onTestFinished } from "vitest";
import { assert } from "riteway/vitest";

import { createDatabase, closeDatabase } from "../db/connection.js";
import { initializeSchema } from "../db/schema.js";
import { searchMetadata, getFieldValues } from "./metadata.js";

const setupTestDatabase = () => {
  const db = createDatabase(":memory:");
  initializeSchema(db);

  // Seed test documents with varied frontmatter
  const insert = db.prepare(`
    INSERT INTO documents (path, type, frontmatter, content, hash)
    VALUES (?, ?, ?, ?, ?)
  `);

  insert.run(
    "ai/rules/always-on.mdc",
    "rule",
    JSON.stringify({ description: "Always active rule", alwaysApply: true }),
    "Content here",
    "hash1",
  );

  insert.run(
    "ai/rules/conditional.mdc",
    "rule",
    JSON.stringify({
      description: "Conditional rule",
      alwaysApply: false,
      globs: "**/*.js",
    }),
    "Content here",
    "hash2",
  );

  insert.run(
    "ai/rules/tagged.mdc",
    "rule",
    JSON.stringify({
      description: "Tagged rule",
      tags: ["security", "authentication"],
    }),
    "Content here",
    "hash3",
  );

  insert.run(
    "ai/commands/test.md",
    "command",
    JSON.stringify({ description: "Test command" }),
    "Content here",
    "hash4",
  );

  onTestFinished(() => closeDatabase(db));

  return db;
};

describe("search/metadata", () => {
  describe("searchMetadata", () => {
    test("filters by boolean frontmatter field", () => {
      const db = setupTestDatabase();
      const results = searchMetadata(db, { "frontmatter.alwaysApply": true });

      assert({
        given: "filter for alwaysApply: true",
        should: "find matching documents",
        actual: results.map((r) => r.path),
        expected: ["ai/rules/always-on.mdc"],
      });
    });

    test("filters by document type", () => {
      const db = setupTestDatabase();
      const results = searchMetadata(db, { type: "command" });

      assert({
        given: "filter for type: command",
        should: "find commands only",
        actual: results.map((r) => r.path),
        expected: ["ai/commands/test.md"],
      });
    });

    test("filters by string field with LIKE", () => {
      const db = setupTestDatabase();
      const results = searchMetadata(db, { "frontmatter.globs": "**/*.js" });

      assert({
        given: "filter for specific globs value",
        should: "find matching document",
        actual: results.length,
        expected: 1,
      });
    });

    test("filters by array contains", () => {
      const db = setupTestDatabase();
      const results = searchMetadata(db, {
        "frontmatter.tags": { contains: "security" },
      });

      assert({
        given: "filter for tag contains 'security'",
        should: "find document with that tag",
        actual: results.map((r) => r.path),
        expected: ["ai/rules/tagged.mdc"],
      });
    });

    test("combines multiple filters with AND", () => {
      const db = setupTestDatabase();
      const results = searchMetadata(db, {
        type: "rule",
        "frontmatter.alwaysApply": true,
      });

      assert({
        given: "multiple filters",
        should: "apply all filters",
        actual: results.length,
        expected: 1,
      });
    });

    test("returns empty array for no matches", () => {
      const db = setupTestDatabase();
      const results = searchMetadata(db, { type: "nonexistent" });

      assert({
        given: "no matching documents",
        should: "return empty array",
        actual: results,
        expected: [],
      });
    });

    test("respects limit option", () => {
      const db = setupTestDatabase();
      const results = searchMetadata(db, { type: "rule" }, { limit: 2 });

      assert({
        given: "limit of 2",
        should: "return at most 2 results",
        actual: results.length <= 2,
        expected: true,
      });
    });

    test("returns full document metadata", () => {
      const db = setupTestDatabase();
      const results = searchMetadata(db, { type: "rule" }, { limit: 1 });

      assert({
        given: "search result",
        should: "include path, type, and frontmatter",
        actual:
          results[0] &&
          "path" in results[0] &&
          "type" in results[0] &&
          "frontmatter" in results[0],
        expected: true,
      });
    });

    test("rejects SQL injection in filter keys", () => {
      const db = setupTestDatabase();

      let error;
      try {
        searchMetadata(db, { "frontmatter.foo') OR 1=1; --": "evil" });
      } catch (err) {
        error = err;
      }

      assert({
        given: "filter key with SQL injection attempt",
        should: "throw error with cause",
        actual: error instanceof Error && error.cause !== undefined,
        expected: true,
      });

      assert({
        given: "filter key with SQL injection attempt",
        should: "have ValidationError cause name",
        actual: error.cause.name,
        expected: "ValidationError",
      });

      assert({
        given: "filter key with SQL injection attempt",
        should: "have VALIDATION_ERROR code",
        actual: error.cause.code,
        expected: "VALIDATION_ERROR",
      });

      assert({
        given: "filter key with SQL injection attempt",
        should: "include the invalid jsonPath in cause",
        actual: error.cause.jsonPath,
        expected: "foo') OR 1=1; --",
      });
    });

    test("allows valid nested JSON paths", () => {
      const db = setupTestDatabase();

      // Should not throw
      const results = searchMetadata(db, {
        "frontmatter.nested.deep_value": "test",
      });

      assert({
        given: "valid nested JSON path with underscore",
        should: "not throw and return results",
        actual: Array.isArray(results),
        expected: true,
      });
    });
  });

  describe("getFieldValues", () => {
    test("rejects SQL injection in field name", () => {
      const db = setupTestDatabase();

      let error;
      try {
        getFieldValues(db, "foo') OR 1=1; --");
      } catch (err) {
        error = err;
      }

      assert({
        given: "field name with SQL injection attempt",
        should: "throw error with cause",
        actual: error instanceof Error && error.cause !== undefined,
        expected: true,
      });

      assert({
        given: "field name with SQL injection attempt",
        should: "have ValidationError cause name",
        actual: error.cause.name,
        expected: "ValidationError",
      });

      assert({
        given: "field name with SQL injection attempt",
        should: "have VALIDATION_ERROR code",
        actual: error.cause.code,
        expected: "VALIDATION_ERROR",
      });

      assert({
        given: "field name with SQL injection attempt",
        should: "include the invalid field in cause",
        actual: error.cause.field,
        expected: "foo') OR 1=1; --",
      });
    });
  });
});
