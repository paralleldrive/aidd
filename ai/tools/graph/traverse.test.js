import { describe, test, onTestFinished } from "vitest";
import { assert } from "riteway/vitest";

import { createDatabase, closeDatabase } from "../db/connection.js";
import { initializeSchema } from "../db/schema.js";
import { findRelated, getForwardDeps, getReverseDeps } from "./traverse.js";

const setupTestDatabase = () => {
  const db = createDatabase(":memory:");
  initializeSchema(db);

  // Create a dependency graph:
  // a.js -> b.js -> c.js -> d.js
  //      -> e.js
  // f.js -> b.js (another path to b)

  const insertDoc = db.prepare(`
    INSERT INTO documents (path, type, frontmatter, content, hash)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertDoc.run("a.js", "other", "{}", "content", "hash1");
  insertDoc.run("b.js", "other", "{}", "content", "hash2");
  insertDoc.run("c.js", "other", "{}", "content", "hash3");
  insertDoc.run("d.js", "other", "{}", "content", "hash4");
  insertDoc.run("e.js", "other", "{}", "content", "hash5");
  insertDoc.run("f.js", "other", "{}", "content", "hash6");

  const insertDep = db.prepare(`
    INSERT INTO dependencies (from_file, to_file, import_type)
    VALUES (?, ?, ?)
  `);

  insertDep.run("a.js", "b.js", "import");
  insertDep.run("a.js", "e.js", "import");
  insertDep.run("b.js", "c.js", "import");
  insertDep.run("c.js", "d.js", "import");
  insertDep.run("f.js", "b.js", "import");

  onTestFinished(() => closeDatabase(db));

  return db;
};

describe("graph/traverse", () => {
  describe("getForwardDeps", () => {
    test("finds direct dependencies", () => {
      const db = setupTestDatabase();
      const deps = getForwardDeps(db, "a.js", { maxDepth: 1 });

      assert({
        given: "file with two imports",
        should: "return both direct dependencies",
        actual: deps.map((d) => d.file).sort(),
        expected: ["b.js", "e.js"],
      });
    });

    test("finds transitive dependencies", () => {
      const db = setupTestDatabase();
      const deps = getForwardDeps(db, "a.js", { maxDepth: 3 });
      const files = deps.map((d) => d.file);

      assert({
        given: "maxDepth of 3",
        should: "include transitive deps (b, c, d, e)",
        actual: files.includes("d.js"),
        expected: true,
      });
    });

    test("respects maxDepth limit", () => {
      const db = setupTestDatabase();
      const deps = getForwardDeps(db, "a.js", { maxDepth: 2 });
      const files = deps.map((d) => d.file);

      assert({
        given: "maxDepth of 2",
        should: "not include depth 3 deps",
        actual: files.includes("d.js"),
        expected: false,
      });
    });

    test("includes depth information", () => {
      const db = setupTestDatabase();
      const deps = getForwardDeps(db, "a.js", { maxDepth: 3 });
      const bDep = deps.find((d) => d.file === "b.js");
      const dDep = deps.find((d) => d.file === "d.js");

      assert({
        given: "traversed dependencies",
        should: "include correct depth",
        actual: { bDepth: bDep.depth, dDepth: dDep.depth },
        expected: { bDepth: 1, dDepth: 3 },
      });
    });

    test("returns empty array for file with no deps", () => {
      const db = setupTestDatabase();
      const deps = getForwardDeps(db, "d.js", { maxDepth: 3 });

      assert({
        given: "file with no dependencies",
        should: "return empty array",
        actual: deps,
        expected: [],
      });
    });
  });

  describe("getReverseDeps", () => {
    test("finds files that depend on target", () => {
      const db = setupTestDatabase();
      const deps = getReverseDeps(db, "b.js", { maxDepth: 1 });

      assert({
        given: "file that is imported by two others",
        should: "return both dependents",
        actual: deps.map((d) => d.file).sort(),
        expected: ["a.js", "f.js"],
      });
    });

    test("finds transitive dependents", () => {
      const db = setupTestDatabase();
      const deps = getReverseDeps(db, "d.js", { maxDepth: 3 });
      const files = deps.map((d) => d.file);

      assert({
        given: "file at end of chain",
        should: "find all files that transitively depend on it",
        actual: files.includes("a.js"),
        expected: true,
      });
    });

    test("returns empty for file with no dependents", () => {
      const db = setupTestDatabase();
      const deps = getReverseDeps(db, "a.js", { maxDepth: 3 });

      assert({
        given: "root file with no dependents",
        should: "return empty array",
        actual: deps,
        expected: [],
      });
    });
  });

  describe("findRelated", () => {
    test("finds both forward and reverse with direction=both", () => {
      const db = setupTestDatabase();
      const related = findRelated(db, "b.js", {
        direction: "both",
        maxDepth: 2,
      });
      const files = related.map((r) => r.file);

      // Should find: a.js and f.js (reverse), c.js and d.js (forward)
      assert({
        given: "direction: both",
        should: "find files in both directions",
        actual: files.includes("a.js") && files.includes("c.js"),
        expected: true,
      });
    });

    test("marks direction in results", () => {
      const db = setupTestDatabase();
      const related = findRelated(db, "b.js", {
        direction: "both",
        maxDepth: 1,
      });
      const aResult = related.find((r) => r.file === "a.js");
      const cResult = related.find((r) => r.file === "c.js");

      assert({
        given: "bidirectional search",
        should: "mark direction for each result",
        actual: { aDir: aResult.direction, cDir: cResult.direction },
        expected: { aDir: "reverse", cDir: "forward" },
      });
    });

    test("defaults to both direction", () => {
      const db = setupTestDatabase();
      const related = findRelated(db, "b.js", { maxDepth: 1 });

      assert({
        given: "no direction specified",
        should: "search both directions",
        actual: related.length >= 2,
        expected: true,
      });
    });

    test("handles circular dependencies gracefully", () => {
      const db = setupTestDatabase();

      // Add circular dependency: d.js -> a.js
      db.prepare(
        `
        INSERT INTO dependencies (from_file, to_file, import_type)
        VALUES (?, ?, ?)
      `,
      ).run("d.js", "a.js", "import");

      // Should not throw or hang
      const related = findRelated(db, "a.js", { maxDepth: 10 });

      assert({
        given: "circular dependency",
        should: "complete without infinite loop",
        actual: Array.isArray(related),
        expected: true,
      });
    });

    test("deduplicates files found via multiple paths", () => {
      const db = setupTestDatabase();
      const related = findRelated(db, "b.js", {
        direction: "forward",
        maxDepth: 3,
      });
      const paths = related.map((r) => r.file);
      const uniquePaths = [...new Set(paths)];

      assert({
        given: "graph with multiple paths",
        should: "deduplicate results",
        actual: paths.length,
        expected: uniquePaths.length,
      });
    });
  });
});
