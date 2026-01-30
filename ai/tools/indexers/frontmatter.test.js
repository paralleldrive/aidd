import { describe, test, onTestFinished } from "vitest";
import { assert } from "riteway/vitest";
import path from "path";
import fs from "fs-extra";
import os from "os";
import { createId } from "@paralleldrive/cuid2";

import { createDatabase, closeDatabase } from "../db/connection.js";
import { initializeSchema } from "../db/schema.js";
import {
  indexFile,
  indexDirectory,
  indexIncremental,
  detectDocumentType,
  computeFileHash,
} from "./frontmatter.js";

const setupTestDatabaseWithDirectory = async () => {
  const db = createDatabase(":memory:");
  initializeSchema(db);

  const tempDir = path.join(os.tmpdir(), `aidd-test-${createId()}`);
  await fs.ensureDir(tempDir);

  onTestFinished(async () => {
    closeDatabase(db);
    await fs.remove(tempDir);
  });

  return { db, tempDir };
};

describe("indexers/frontmatter", () => {
  describe("detectDocumentType", () => {
    test("detects rule type from ai/rules path", () => {
      assert({
        given: "path in ai/rules/",
        should: "return 'rule'",
        actual: detectDocumentType("ai/rules/test.mdc"),
        expected: "rule",
      });
    });

    test("detects command type from ai/commands path", () => {
      assert({
        given: "path in ai/commands/",
        should: "return 'command'",
        actual: detectDocumentType("ai/commands/help.md"),
        expected: "command",
      });
    });

    test("detects skill type from ai/skills path", () => {
      assert({
        given: "path in ai/skills/",
        should: "return 'skill'",
        actual: detectDocumentType("ai/skills/rlm/SKILL.md"),
        expected: "skill",
      });
    });

    test("detects task type from tasks path", () => {
      assert({
        given: "path in tasks/",
        should: "return 'task'",
        actual: detectDocumentType("tasks/rlm/phase-1.md"),
        expected: "task",
      });
    });

    test("detects story-map type from plan/story-map path", () => {
      assert({
        given: "path in plan/story-map/",
        should: "return 'story-map'",
        actual: detectDocumentType("plan/story-map/personas.yaml"),
        expected: "story-map",
      });
    });

    test("returns other for unknown paths", () => {
      assert({
        given: "path not matching known patterns",
        should: "return 'other'",
        actual: detectDocumentType("docs/readme.md"),
        expected: "other",
      });
    });
  });

  describe("computeFileHash", () => {
    test("computes consistent hash for same content", async () => {
      const { tempDir } = await setupTestDatabaseWithDirectory();
      const filePath = path.join(tempDir, "test.md");
      await fs.writeFile(filePath, "# Test\n\nSome content");

      const hash1 = await computeFileHash(filePath);
      const hash2 = await computeFileHash(filePath);

      assert({
        given: "same file content",
        should: "return same hash",
        actual: hash1 === hash2,
        expected: true,
      });
    });

    test("computes different hash for different content", async () => {
      const { tempDir } = await setupTestDatabaseWithDirectory();
      const file1 = path.join(tempDir, "test1.md");
      const file2 = path.join(tempDir, "test2.md");
      await fs.writeFile(file1, "content A");
      await fs.writeFile(file2, "content B");

      const hash1 = await computeFileHash(file1);
      const hash2 = await computeFileHash(file2);

      assert({
        given: "different file content",
        should: "return different hashes",
        actual: hash1 !== hash2,
        expected: true,
      });
    });
  });

  describe("indexFile", () => {
    test("indexes file with frontmatter", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();
      const filePath = path.join(tempDir, "test.mdc");
      await fs.writeFile(
        filePath,
        `---
description: Test description
alwaysApply: true
---

# Test Rule

Some content here.
`,
      );

      await indexFile(db, filePath, tempDir);

      const doc = db
        .prepare("SELECT * FROM documents WHERE path = ?")
        .get("test.mdc");

      assert({
        given: "file with frontmatter",
        should: "store frontmatter as JSON",
        actual: JSON.parse(doc.frontmatter),
        expected: { description: "Test description", alwaysApply: true },
      });
    });

    test("indexes file without frontmatter", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();
      const filePath = path.join(tempDir, "simple.md");
      await fs.writeFile(filePath, "# Simple\n\nJust content.");

      await indexFile(db, filePath, tempDir);

      const doc = db
        .prepare("SELECT * FROM documents WHERE path = ?")
        .get("simple.md");

      assert({
        given: "file without frontmatter",
        should: "store empty frontmatter object",
        actual: JSON.parse(doc.frontmatter),
        expected: {},
      });
    });

    test("stores content without frontmatter delimiter", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();
      const filePath = path.join(tempDir, "test.md");
      await fs.writeFile(
        filePath,
        `---
title: Test
---

# Heading

Body content.
`,
      );

      await indexFile(db, filePath, tempDir);

      const doc = db
        .prepare("SELECT content FROM documents WHERE path = ?")
        .get("test.md");

      assert({
        given: "file with frontmatter",
        should: "store content without frontmatter",
        actual: doc.content.trim(),
        expected: "# Heading\n\nBody content.",
      });
    });

    test("computes and stores file hash", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();
      const filePath = path.join(tempDir, "hashed.md");
      await fs.writeFile(filePath, "test content");

      await indexFile(db, filePath, tempDir);

      const doc = db
        .prepare("SELECT hash FROM documents WHERE path = ?")
        .get("hashed.md");

      assert({
        given: "indexed file",
        should: "have non-empty hash",
        actual: doc.hash.length > 0,
        expected: true,
      });
    });
  });

  describe("indexDirectory", () => {
    test("indexes all .md and .mdc files recursively", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();
      await fs.ensureDir(path.join(tempDir, "subdir"));
      await fs.writeFile(path.join(tempDir, "root.md"), "# Root");
      await fs.writeFile(path.join(tempDir, "subdir/nested.mdc"), "# Nested");
      await fs.writeFile(path.join(tempDir, "ignore.txt"), "Not markdown");

      await indexDirectory(db, tempDir);

      const count = db
        .prepare("SELECT COUNT(*) as count FROM documents")
        .get().count;

      assert({
        given: "directory with .md and .mdc files",
        should: "index only markdown files",
        actual: count,
        expected: 2,
      });
    });

    test("returns indexing statistics", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();
      await fs.writeFile(path.join(tempDir, "file1.md"), "# File 1");
      await fs.writeFile(path.join(tempDir, "file2.md"), "# File 2");
      await fs.writeFile(path.join(tempDir, "file3.mdc"), "# File 3");

      const stats = await indexDirectory(db, tempDir);

      assert({
        given: "indexing multiple files",
        should: "return count of indexed files",
        actual: stats.indexed,
        expected: 3,
      });
    });

    test("skips index.md files", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();
      await fs.writeFile(path.join(tempDir, "index.md"), "# Index");
      await fs.writeFile(path.join(tempDir, "regular.md"), "# Regular");

      await indexDirectory(db, tempDir);

      const paths = db
        .prepare("SELECT path FROM documents")
        .all()
        .map((d) => d.path);

      assert({
        given: "directory with index.md",
        should: "skip index.md file",
        actual: paths,
        expected: ["regular.md"],
      });
    });

    test("uses transaction for atomicity", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();
      await fs.writeFile(path.join(tempDir, "file1.md"), "# File 1");
      await fs.writeFile(path.join(tempDir, "file2.md"), "# File 2");

      await indexDirectory(db, tempDir);

      // If transaction worked, both should be indexed
      const count = db
        .prepare("SELECT COUNT(*) as count FROM documents")
        .get().count;

      assert({
        given: "indexing with transaction",
        should: "index all files atomically",
        actual: count,
        expected: 2,
      });
    });
  });

  describe("indexIncremental", () => {
    test("only indexes changed files", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();
      const file1 = path.join(tempDir, "unchanged.md");
      const file2 = path.join(tempDir, "changed.md");

      await fs.writeFile(file1, "# Unchanged");
      await fs.writeFile(file2, "# Original");

      // Initial index
      await indexDirectory(db, tempDir);

      // Modify one file
      await fs.writeFile(file2, "# Modified content");

      const stats = await indexIncremental(db, tempDir);

      assert({
        given: "one file changed",
        should: "only update changed file",
        actual: stats.updated,
        expected: 1,
      });
    });

    test("removes deleted files from index", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();
      const file1 = path.join(tempDir, "keep.md");
      const file2 = path.join(tempDir, "delete.md");

      await fs.writeFile(file1, "# Keep");
      await fs.writeFile(file2, "# Delete");

      await indexDirectory(db, tempDir);

      // Delete one file
      await fs.remove(file2);

      const stats = await indexIncremental(db, tempDir);

      assert({
        given: "file deleted from disk",
        should: "report deleted count",
        actual: stats.deleted,
        expected: 1,
      });
    });

    test("deleted files are removed from database", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();
      const filePath = path.join(tempDir, "temp.md");
      await fs.writeFile(filePath, "# Temp");

      await indexDirectory(db, tempDir);
      await fs.remove(filePath);
      await indexIncremental(db, tempDir);

      const doc = db
        .prepare("SELECT * FROM documents WHERE path = ?")
        .get("temp.md");

      assert({
        given: "file deleted and incremental run",
        should: "remove from database",
        actual: doc,
        expected: undefined,
      });
    });

    test("adds new files", async () => {
      const { db, tempDir } = await setupTestDatabaseWithDirectory();
      await fs.writeFile(path.join(tempDir, "existing.md"), "# Existing");
      await indexDirectory(db, tempDir);

      await fs.writeFile(path.join(tempDir, "new.md"), "# New");
      const stats = await indexIncremental(db, tempDir);

      assert({
        given: "new file added",
        should: "report as updated",
        actual: stats.updated >= 1,
        expected: true,
      });
    });
  });
});
