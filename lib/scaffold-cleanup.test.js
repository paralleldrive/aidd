import os from "os";
import path from "path";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test, vi } from "vitest";

import { scaffoldCleanup } from "./scaffold-cleanup.js";

describe("scaffoldCleanup", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-cleanup-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("deletes .aidd/ directory when it exists", async () => {
    const aiddDir = path.join(tempDir, ".aidd");
    await fs.ensureDir(path.join(aiddDir, "scaffold"));

    const result = await scaffoldCleanup({ folder: tempDir });

    const exists = await fs.pathExists(aiddDir);

    assert({
      given: ".aidd/ directory exists",
      should: "delete it",
      actual: exists,
      expected: false,
    });

    assert({
      given: ".aidd/ directory exists",
      should: "return removed action",
      actual: result.action,
      expected: "removed",
    });
  });

  test("reports nothing to clean up when .aidd/ does not exist", async () => {
    const result = await scaffoldCleanup({ folder: tempDir });

    assert({
      given: ".aidd/ directory does not exist",
      should: "return not-found action",
      actual: result.action,
      expected: "not-found",
    });
  });

  test("uses current working directory when no folder is given", async () => {
    // Point process.cwd() to tempDir (which has no .aidd) via spy
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tempDir);

    const result = await scaffoldCleanup({});

    cwdSpy.mockRestore();

    assert({
      given: "no folder argument and no .aidd/ in the effective cwd",
      should: "return not-found action",
      actual: result.action,
      expected: "not-found",
    });
  });
});
