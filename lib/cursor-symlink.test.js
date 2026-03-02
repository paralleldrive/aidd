import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test } from "vitest";

import { executeClone } from "./cli-core.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("cursor symlink functionality", () => {
  const tempTestDir = path.join(__dirname, "temp-cursor-test");
  const cursorPath = path.join(tempTestDir, ".cursor");

  beforeEach(async () => {
    // Clean up any existing test directory
    if (await fs.pathExists(tempTestDir)) {
      await fs.remove(tempTestDir);
    }
    await fs.ensureDir(tempTestDir);
  });

  afterEach(async () => {
    // Clean up test directory
    if (await fs.pathExists(tempTestDir)) {
      await fs.remove(tempTestDir);
    }
  });

  test("cursor option false should not create symlink", async () => {
    await executeClone({
      targetDirectory: tempTestDir,
      cursor: false,
    });

    const symlinkExists = await fs.pathExists(cursorPath);

    assert({
      given: "cursor option is false",
      should: "not create .cursor symlink",
      actual: symlinkExists,
      expected: false,
    });

    const configExists = await fs.pathExists(
      path.join(tempTestDir, "aidd-custom", "config.yml"),
    );

    assert({
      given: "a full executeClone run",
      should: "create aidd-custom/config.yml",
      actual: configExists,
      expected: true,
    });
  });

  test("cursor option true should create symlink to ai folder", async () => {
    await executeClone({
      targetDirectory: tempTestDir,
      cursor: true,
    });

    const symlinkExists = await fs.pathExists(cursorPath);

    assert({
      given: "cursor option is true",
      should: "create .cursor symlink",
      actual: symlinkExists,
      expected: true,
    });
  });

  test("created symlink should point to ai folder", async () => {
    await executeClone({
      targetDirectory: tempTestDir,
      cursor: true,
    });

    const symlinkStat = await fs.lstat(cursorPath);
    const symlinkTarget = await fs.readlink(cursorPath);

    assert({
      given: "cursor symlink is created",
      should: "be a symbolic link",
      actual: symlinkStat.isSymbolicLink(),
      expected: true,
    });

    assert({
      given: "cursor symlink is created",
      should: "point to ai folder",
      actual: symlinkTarget,
      expected: "ai",
    });
  });

  test("dry run with cursor should show symlink creation", async () => {
    const result = await executeClone({
      targetDirectory: tempTestDir,
      cursor: true,
      dryRun: true,
    });

    const symlinkExists = await fs.pathExists(cursorPath);

    assert({
      given: "dry run mode with cursor option",
      should: "not actually create symlink",
      actual: symlinkExists,
      expected: false,
    });

    assert({
      given: "dry run mode with cursor option",
      should: "indicate success",
      actual: result.success,
      expected: true,
    });
  });

  test("existing .cursor file should be handled with force", async () => {
    // Create existing .cursor file (not a symlink)
    await fs.writeFile(cursorPath, "existing content");

    // Pre-create a custom config with non-default value
    await fs.ensureDir(path.join(tempTestDir, "aidd-custom"));
    await fs.writeFile(
      path.join(tempTestDir, "aidd-custom", "config.yml"),
      "e2eBeforeCommit: true\n",
      "utf-8",
    );

    await executeClone({
      targetDirectory: tempTestDir,
      cursor: true,
      force: true,
    });

    const symlinkStat = await fs.lstat(cursorPath);

    assert({
      given: "existing .cursor file with force option",
      should: "replace with symlink",
      actual: symlinkStat.isSymbolicLink(),
      expected: true,
    });

    const configContent = await fs.readFile(
      path.join(tempTestDir, "aidd-custom", "config.yml"),
      "utf-8",
    );

    assert({
      given: "existing config.yml with --force",
      should: "preserve user config even when force is set",
      actual: configContent,
      expected: "e2eBeforeCommit: true\n",
    });
  });
});
