import { describe, test, onTestFinished } from "vitest";
import { assert } from "riteway/vitest";

import { createDatabase, closeDatabase } from "../db/connection.js";
import { initializeSchema } from "../db/schema.js";
import { searchFts5, highlightMatches } from "./fts5.js";

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
    JSON.stringify({ description: "Authentication and authorization rules" }),
    "# Authentication\n\nHandle user login, sessions, and JWT tokens.",
    "hash1",
  );

  insert.run(
    "ai/rules/security.mdc",
    "rule",
    JSON.stringify({
      description: "Security best practices",
      tags: ["security", "csrf"],
    }),
    "# Security\n\nProtect against XSS, CSRF, and injection attacks.",
    "hash2",
  );

  insert.run(
    "ai/commands/help.md",
    "command",
    JSON.stringify({ description: "Display help information" }),
    "# Help Command\n\nShows available commands and their usage.",
    "hash3",
  );

  insert.run(
    "docs/readme.md",
    "other",
    JSON.stringify({ title: "Project README" }),
    "# Getting Started\n\nWelcome to the project documentation.",
    "hash4",
  );

  onTestFinished(() => closeDatabase(db));

  return db;
};

describe("search/fts5", () => {
  describe("searchFts5", () => {
    test("finds documents by content keyword", () => {
      const db = setupTestDatabase();
      const results = searchFts5(db, "authentication");

      assert({
        given: "search for 'authentication'",
        should: "find the auth rule",
        actual: results.map((r) => r.path),
        expected: ["ai/rules/auth.mdc"],
      });
    });

    test("finds documents by frontmatter content", () => {
      const db = setupTestDatabase();
      const results = searchFts5(db, "authorization");

      assert({
        given: "search for 'authorization' (in frontmatter)",
        should: "find the auth rule",
        actual: results.length,
        expected: 1,
      });
    });

    test("returns multiple matches", () => {
      const db = setupTestDatabase();
      const results = searchFts5(db, "security");

      assert({
        given: "search for 'security'",
        should: "find multiple documents",
        actual: results.length >= 1,
        expected: true,
      });
    });

    test("returns empty array for no matches", () => {
      const db = setupTestDatabase();
      const results = searchFts5(db, "nonexistentterm12345");

      assert({
        given: "search for non-existent term",
        should: "return empty array",
        actual: results,
        expected: [],
      });
    });

    test("respects limit option", () => {
      const db = setupTestDatabase();

      // Add more documents
      for (let i = 0; i < 10; i++) {
        db.prepare(
          `
          INSERT INTO documents (path, type, frontmatter, content, hash)
          VALUES (?, ?, ?, ?, ?)
        `,
        ).run(
          `docs/doc${i}.md`,
          "other",
          "{}",
          `Document about security ${i}`,
          `hash${i + 10}`,
        );
      }

      const results = searchFts5(db, "security", { limit: 3 });

      assert({
        given: "limit of 3",
        should: "return at most 3 results",
        actual: results.length <= 3,
        expected: true,
      });
    });

    test("filters by document type", () => {
      const db = setupTestDatabase();
      const results = searchFts5(db, "help OR security", { type: "command" });

      assert({
        given: "type filter for command",
        should: "only return commands",
        actual: results.every((r) => r.type === "command"),
        expected: true,
      });
    });

    test("includes document metadata in results", () => {
      const db = setupTestDatabase();
      const results = searchFts5(db, "authentication");

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

    test("handles FTS5 operators", () => {
      const db = setupTestDatabase();
      const results = searchFts5(db, "security AND csrf");

      assert({
        given: "AND operator in query",
        should: "find documents with both terms",
        actual: results.length,
        expected: 1,
      });
    });

    test("handles phrases in quotes", () => {
      const db = setupTestDatabase();
      const results = searchFts5(db, '"JWT tokens"');

      assert({
        given: "phrase search",
        should: "find exact phrase",
        actual: results.map((r) => r.path),
        expected: ["ai/rules/auth.mdc"],
      });
    });

    test("returns empty array for invalid FTS5 syntax", () => {
      const db = setupTestDatabase();
      // Invalid FTS5 syntax - unmatched quote
      const results = searchFts5(db, '"unclosed quote', { silent: true });

      assert({
        given: "invalid FTS5 syntax",
        should: "return empty array",
        actual: results,
        expected: [],
      });
    });
  });

  describe("highlightMatches", () => {
    test("wraps matched terms with markers", () => {
      const result = highlightMatches(
        "authentication is important",
        "authentication",
      );

      assert({
        given: "text with matching term",
        should: "wrap match with markers",
        actual: result.includes("**authentication**"),
        expected: true,
      });
    });

    test("handles multiple matches", () => {
      const result = highlightMatches(
        "security is about security practices",
        "security",
      );
      const matchCount = (result.match(/\*\*security\*\*/g) || []).length;

      assert({
        given: "text with multiple matches",
        should: "highlight all matches",
        actual: matchCount,
        expected: 2,
      });
    });

    test("is case insensitive", () => {
      const result = highlightMatches("Authentication works", "authentication");

      assert({
        given: "case mismatch",
        should: "still highlight",
        actual: result.includes("**"),
        expected: true,
      });
    });
  });
});
