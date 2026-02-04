import { describe, test, onTestFinished } from "vitest";
import { assert } from "riteway/vitest";

import { createDatabase, closeDatabase } from "../db/connection.js";
import { initializeSchema } from "../db/schema.js";
import { fanOutSearch, aggregateResults } from "./fan-out.js";

const setupTestDatabase = () => {
  const db = createDatabase(":memory:");
  initializeSchema(db);

  // Seed test documents
  const insert = db.prepare(`
    INSERT INTO documents (path, type, frontmatter, content, hash)
    VALUES (?, ?, ?, ?, ?)
  `);

  insert.run(
    "ai/rules/auth.mdc",
    "rule",
    JSON.stringify({
      description: "Authentication rules",
      alwaysApply: true,
      tags: ["security"],
    }),
    "# Authentication\n\nHandle user login and JWT tokens.",
    "hash1",
  );

  insert.run(
    "ai/rules/security.mdc",
    "rule",
    JSON.stringify({
      description: "Security best practices",
      tags: ["security", "csrf"],
    }),
    "# Security\n\nProtect against XSS and CSRF attacks.",
    "hash2",
  );

  insert.run(
    "ai/commands/help.md",
    "command",
    JSON.stringify({ description: "Display help" }),
    "# Help\n\nShows available commands.",
    "hash3",
  );

  insert.run(
    "docs/getting-started.md",
    "other",
    JSON.stringify({ title: "Getting Started" }),
    "# Getting Started\n\nWelcome to the documentation.",
    "hash4",
  );

  onTestFinished(() => closeDatabase(db));

  return db;
};

describe("search/fan-out", () => {
  describe("fanOutSearch", () => {
    test("combines FTS5 and metadata results", async () => {
      const db = setupTestDatabase();
      const results = await fanOutSearch(db, "security", {
        filters: { "frontmatter.tags": { contains: "security" } },
      });

      assert({
        given: "query with both keyword and metadata match",
        should: "return results",
        actual: results.length >= 1,
        expected: true,
      });
    });

    test("deduplicates results by path", async () => {
      const db = setupTestDatabase();
      const results = await fanOutSearch(db, "authentication security", {
        filters: { type: "rule" },
      });

      const paths = results.map((r) => r.path);
      const uniquePaths = [...new Set(paths)];

      assert({
        given: "search that might find same doc multiple ways",
        should: "deduplicate by path",
        actual: paths.length,
        expected: uniquePaths.length,
      });
    });

    test("ranks results by relevance", async () => {
      const db = setupTestDatabase();
      const results = await fanOutSearch(db, "security");

      // Results should have relevanceScore
      assert({
        given: "search results",
        should: "include relevanceScore",
        actual: results.every((r) => "relevanceScore" in r),
        expected: true,
      });
    });

    test("respects limit option", async () => {
      const db = setupTestDatabase();
      const results = await fanOutSearch(db, "security", { limit: 1 });

      assert({
        given: "limit of 1",
        should: "return at most 1 result",
        actual: results.length,
        expected: 1,
      });
    });

    test("uses only specified strategies", async () => {
      const db = setupTestDatabase();
      const ftsResults = await fanOutSearch(db, "authentication", {
        strategies: ["fts5"],
      });

      assert({
        given: "only fts5 strategy",
        should: "return FTS results",
        actual: ftsResults.length >= 1,
        expected: true,
      });
    });

    test("returns empty array for no matches", async () => {
      const db = setupTestDatabase();
      const results = await fanOutSearch(db, "nonexistentterm12345");

      assert({
        given: "no matching documents",
        should: "return empty array",
        actual: results,
        expected: [],
      });
    });

    test("handles empty query gracefully", async () => {
      const db = setupTestDatabase();
      const results = await fanOutSearch(db, "");

      assert({
        given: "empty query",
        should: "return empty array",
        actual: results,
        expected: [],
      });
    });
  });

  describe("aggregateResults", () => {
    test("boosts documents found by multiple strategies", () => {
      const ftsResults = [
        { path: "doc1.md", type: "rule", frontmatter: {} },
        { path: "doc2.md", type: "rule", frontmatter: {} },
      ];
      const metadataResults = [
        { path: "doc1.md", type: "rule", frontmatter: {} },
        { path: "doc3.md", type: "rule", frontmatter: {} },
      ];

      const aggregated = aggregateResults({
        fts5: ftsResults,
        metadata: metadataResults,
      });

      // doc1 should be ranked higher since it appears in both
      const doc1 = aggregated.find((r) => r.path === "doc1.md");
      const doc2 = aggregated.find((r) => r.path === "doc2.md");

      assert({
        given: "document in multiple result sets",
        should: "have higher relevance score",
        actual: doc1.relevanceScore > doc2.relevanceScore,
        expected: true,
      });
    });

    test("applies strategy weights", () => {
      const ftsResults = [
        { path: "fts-doc.md", type: "rule", frontmatter: {} },
      ];
      const metadataResults = [
        { path: "meta-doc.md", type: "rule", frontmatter: {} },
      ];

      const aggregated = aggregateResults(
        { fts5: ftsResults, metadata: metadataResults },
        { weights: { fts5: 1.0, metadata: 0.5 } },
      );

      const ftsDoc = aggregated.find((r) => r.path === "fts-doc.md");
      const metaDoc = aggregated.find((r) => r.path === "meta-doc.md");

      assert({
        given: "different strategy weights",
        should: "weight FTS higher",
        actual: ftsDoc.relevanceScore > metaDoc.relevanceScore,
        expected: true,
      });
    });

    test("respects limit", () => {
      const ftsResults = Array.from({ length: 10 }, (_, i) => ({
        path: `doc${i}.md`,
        type: "rule",
        frontmatter: {},
      }));

      const aggregated = aggregateResults({ fts5: ftsResults }, { limit: 5 });

      assert({
        given: "limit of 5",
        should: "return at most 5 results",
        actual: aggregated.length,
        expected: 5,
      });
    });

    test("sorts by relevance score descending", () => {
      const ftsResults = [
        { path: "doc1.md", type: "rule", frontmatter: {} },
        { path: "doc2.md", type: "rule", frontmatter: {} },
      ];
      const metadataResults = [
        { path: "doc2.md", type: "rule", frontmatter: {} },
      ];

      const aggregated = aggregateResults({
        fts5: ftsResults,
        metadata: metadataResults,
      });

      assert({
        given: "multiple results",
        should: "sort by relevance descending",
        actual: aggregated[0].relevanceScore >= aggregated[1].relevanceScore,
        expected: true,
      });
    });
  });
});
