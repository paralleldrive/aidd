import os from "os";
import path from "path";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test } from "vitest";

import { scaffoldCleanup } from "./scaffold-cleanup.js";

describe("scaffoldCleanup", () => {
  /** @type {string} */
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-cleanup-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("removes <folder>/.aidd/ when it exists", async () => {
    const aiDdDir = path.join(tempDir, ".aidd");
    await fs.ensureDir(aiDdDir);

    const result = await scaffoldCleanup({ folder: tempDir });

    const exists = await fs.pathExists(aiDdDir);

    assert({
      given: "<folder>/.aidd/ directory exists",
      should: "remove it",
      actual: exists,
      expected: false,
    });

    assert({
      given: "<folder>/.aidd/ directory exists",
      should: "return removed action",
      actual: result.action,
      expected: "removed",
    });
  });

  test("reports nothing to clean up when <folder>/.aidd/ does not exist", async () => {
    const result = await scaffoldCleanup({ folder: tempDir });

    assert({
      given: "<folder>/.aidd/ does not exist",
      should: "return not-found action",
      actual: result.action,
      expected: "not-found",
    });
  });

  test("defaults to cwd when no folder argument is given", async () => {
    const aiDdDir = path.join(tempDir, ".aidd");
    await fs.ensureDir(aiDdDir);

    const originalCwd = process.cwd();
    try {
      process.chdir(tempDir);
      const result = await scaffoldCleanup();
      assert({
        given: "no folder argument",
        should: "remove .aidd/ from the current working directory",
        actual: result.action,
        expected: "removed",
      });
    } finally {
      process.chdir(originalCwd);
    }
  });
});
