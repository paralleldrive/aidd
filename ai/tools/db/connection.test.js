import { describe, test, onTestFinished } from "vitest";
import { assert } from "riteway/vitest";
import path from "path";
import fs from "fs-extra";
import os from "os";
import { createId } from "@paralleldrive/cuid2";

import { createDatabase, closeDatabase } from "./connection.js";

const setupTestDirectory = async () => {
  const tempDir = path.join(os.tmpdir(), `aidd-test-${createId()}`);
  await fs.ensureDir(tempDir);
  const dbPath = path.join(tempDir, "test.db");

  onTestFinished(async () => {
    await fs.remove(tempDir);
  });

  return { tempDir, dbPath };
};

describe("db/connection", () => {
  describe("createDatabase", () => {
    test("creates a database connection", async () => {
      const { dbPath } = await setupTestDirectory();
      const db = createDatabase(dbPath);

      assert({
        given: "a valid database path",
        should: "return a database object",
        actual: typeof db.prepare,
        expected: "function",
      });

      closeDatabase(db);
    });

    test("enables WAL mode for better concurrency", async () => {
      const { dbPath } = await setupTestDirectory();
      const db = createDatabase(dbPath);
      const result = db.pragma("journal_mode", { simple: true });

      assert({
        given: "a new database",
        should: "use WAL journal mode",
        actual: result,
        expected: "wal",
      });

      closeDatabase(db);
    });

    test("enables foreign keys", async () => {
      const { dbPath } = await setupTestDirectory();
      const db = createDatabase(dbPath);
      const result = db.pragma("foreign_keys", { simple: true });

      assert({
        given: "a new database",
        should: "have foreign keys enabled",
        actual: result,
        expected: 1,
      });

      closeDatabase(db);
    });

    test("creates the database file on disk", async () => {
      const { dbPath } = await setupTestDirectory();
      const db = createDatabase(dbPath);
      closeDatabase(db);

      const exists = await fs.pathExists(dbPath);

      assert({
        given: "createDatabase called",
        should: "create the database file",
        actual: exists,
        expected: true,
      });
    });

    test("uses in-memory database when path is :memory:", () => {
      const db = createDatabase(":memory:");

      assert({
        given: ":memory: as path",
        should: "create an in-memory database",
        actual: db.memory,
        expected: true,
      });

      closeDatabase(db);
    });
  });

  describe("closeDatabase", () => {
    test("closes the database connection", async () => {
      const { dbPath } = await setupTestDirectory();
      const db = createDatabase(dbPath);
      const result = closeDatabase(db);

      assert({
        given: "an open database",
        should: "close successfully and return true",
        actual: result,
        expected: true,
      });
    });

    test("returns false for already closed database", async () => {
      const { dbPath } = await setupTestDirectory();
      const db = createDatabase(dbPath);
      closeDatabase(db);
      const result = closeDatabase(db);

      assert({
        given: "an already closed database",
        should: "return false",
        actual: result,
        expected: false,
      });
    });
  });
});
