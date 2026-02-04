import { describe, test, onTestFinished } from "vitest";
import { assert } from "riteway/vitest";
import path from "path";
import fs from "fs-extra";
import os from "os";

import { ensureDatabase, formatDuration } from "./index-cli.js";
import { closeDatabase } from "../db/connection.js";

const createTempDir = async () => {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const tempDir = path.join(os.tmpdir(), `aidd-test-${uniqueId}`);
  await fs.ensureDir(tempDir);
  return tempDir;
};

describe("cli/index-cli", () => {
  describe("formatDuration", () => {
    test("formats milliseconds under 1 second", () => {
      assert({
        given: "500 milliseconds",
        should: "return value in ms format",
        actual: formatDuration(500),
        expected: "500ms",
      });
    });

    test("formats zero milliseconds", () => {
      assert({
        given: "0 milliseconds",
        should: "return 0ms",
        actual: formatDuration(0),
        expected: "0ms",
      });
    });

    test("formats exactly 1 second", () => {
      assert({
        given: "1000 milliseconds",
        should: "return value in seconds format",
        actual: formatDuration(1000),
        expected: "1.00s",
      });
    });

    test("formats seconds with decimal precision", () => {
      assert({
        given: "1500 milliseconds",
        should: "return 1.50s",
        actual: formatDuration(1500),
        expected: "1.50s",
      });
    });

    test("formats large durations in seconds", () => {
      assert({
        given: "65432 milliseconds",
        should: "return value in seconds",
        actual: formatDuration(65432),
        expected: "65.43s",
      });
    });

    test("handles value just under 1 second", () => {
      assert({
        given: "999 milliseconds",
        should: "return value in ms format",
        actual: formatDuration(999),
        expected: "999ms",
      });
    });
  });

  describe("ensureDatabase", () => {
    test("creates database directory if it does not exist", async () => {
      const tempDir = await createTempDir();
      const dbPath = path.join(tempDir, "nested", "dir", "test.db");

      const db = await ensureDatabase(dbPath);
      onTestFinished(async () => {
        closeDatabase(db);
        await fs.remove(tempDir);
      });

      const dirExists = await fs.pathExists(path.dirname(dbPath));

      assert({
        given: "database path with non-existent directories",
        should: "create the directory structure",
        actual: dirExists,
        expected: true,
      });
    });

    test("creates database file", async () => {
      const tempDir = await createTempDir();
      const dbPath = path.join(tempDir, "test.db");

      const db = await ensureDatabase(dbPath);
      onTestFinished(async () => {
        closeDatabase(db);
        await fs.remove(tempDir);
      });

      const dbExists = await fs.pathExists(dbPath);

      assert({
        given: "valid database path",
        should: "create the database file",
        actual: dbExists,
        expected: true,
      });
    });

    test("initializes schema with documents table", async () => {
      const tempDir = await createTempDir();
      const dbPath = path.join(tempDir, "test.db");

      const db = await ensureDatabase(dbPath);
      onTestFinished(async () => {
        closeDatabase(db);
        await fs.remove(tempDir);
      });

      const tables = db
        .prepare(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='documents'`,
        )
        .all();

      assert({
        given: "newly created database",
        should: "have documents table",
        actual: tables.length,
        expected: 1,
      });
    });

    test("initializes schema with fts_documents virtual table", async () => {
      const tempDir = await createTempDir();
      const dbPath = path.join(tempDir, "test.db");

      const db = await ensureDatabase(dbPath);
      onTestFinished(async () => {
        closeDatabase(db);
        await fs.remove(tempDir);
      });

      const tables = db
        .prepare(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='fts_documents'`,
        )
        .all();

      assert({
        given: "newly created database",
        should: "have fts_documents virtual table",
        actual: tables.length,
        expected: 1,
      });
    });

    test("initializes schema with dependencies table", async () => {
      const tempDir = await createTempDir();
      const dbPath = path.join(tempDir, "test.db");

      const db = await ensureDatabase(dbPath);
      onTestFinished(async () => {
        closeDatabase(db);
        await fs.remove(tempDir);
      });

      const tables = db
        .prepare(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='dependencies'`,
        )
        .all();

      assert({
        given: "newly created database",
        should: "have dependencies table",
        actual: tables.length,
        expected: 1,
      });
    });

    test("returns valid database connection", async () => {
      const tempDir = await createTempDir();
      const dbPath = path.join(tempDir, "test.db");

      const db = await ensureDatabase(dbPath);
      onTestFinished(async () => {
        closeDatabase(db);
        await fs.remove(tempDir);
      });

      const result = db.prepare("SELECT 1 as value").get();

      assert({
        given: "database connection",
        should: "be able to execute queries",
        actual: result.value,
        expected: 1,
      });
    });

    test("works with existing directory", async () => {
      const tempDir = await createTempDir();
      const dbPath = path.join(tempDir, "test.db");

      const db = await ensureDatabase(dbPath);
      onTestFinished(async () => {
        closeDatabase(db);
        await fs.remove(tempDir);
      });

      assert({
        given: "existing directory",
        should: "create database without error",
        actual: db !== null,
        expected: true,
      });
    });
  });
});
