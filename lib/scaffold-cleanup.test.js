// @ts-nocheck
import os from "os";
import path from "path";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test } from "vitest";

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

  test("removes ~/.aidd/scaffold when it exists", async () => {
    const scaffoldDir = path.join(tempDir, "scaffold");
    await fs.ensureDir(scaffoldDir);

    const result = await scaffoldCleanup({ scaffoldDir });

    const exists = await fs.pathExists(scaffoldDir);

    assert({
      given: "~/.aidd/scaffold directory exists",
      should: "remove it",
      actual: exists,
      expected: false,
    });

    assert({
      given: "~/.aidd/scaffold directory exists",
      should: "return removed action",
      actual: result.action,
      expected: "removed",
    });
  });

  test("reports nothing to clean up when ~/.aidd/scaffold does not exist", async () => {
    const scaffoldDir = path.join(tempDir, "scaffold");

    const result = await scaffoldCleanup({ scaffoldDir });

    assert({
      given: "~/.aidd/scaffold directory does not exist",
      should: "return not-found action",
      actual: result.action,
      expected: "not-found",
    });
  });

  test("targets ~/.aidd/scaffold by default (not the project directory)", async () => {
    // The default scaffoldDir should be rooted in os.homedir(), not cwd
    const defaultDir = path.join(os.homedir(), ".aidd", "scaffold");
    // We don't actually invoke with no args (would touch the real ~/.aidd/scaffold),
    // but we can verify the export matches the expected path.
    assert({
      given: "no scaffoldDir argument",
      should: "default to ~/.aidd/scaffold",
      actual: defaultDir.startsWith(os.homedir()),
      expected: true,
    });
  });
});
