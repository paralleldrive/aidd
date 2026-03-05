// @ts-check
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test } from "vitest";

import { executeClone } from "./cli-core.js";
import { createSymlink } from "./symlinks.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("createSymlink error dispatch", () => {
  const tempTestDir = path.join(__dirname, "temp-symlink-errors-test");

  beforeEach(async () => {
    if (await fs.pathExists(tempTestDir)) await fs.remove(tempTestDir);
    await fs.ensureDir(tempTestDir);
  });

  afterEach(async () => {
    if (await fs.pathExists(tempTestDir)) await fs.remove(tempTestDir);
  });

  test("existing target without force should set cause.name to ValidationError", async () => {
    await fs.writeFile(path.join(tempTestDir, ".cursor"), "existing");

    try {
      await createSymlink({
        name: ".cursor",
        targetBase: tempTestDir,
        force: false,
      })();
      assert({
        given: "a symlink target that already exists and force is false",
        should: "throw an error",
        actual: false,
        expected: true,
      });
    } catch (e) {
      const error = /** @type {any} */ (e);
      assert({
        given: "a symlink target that already exists and force is false",
        should:
          "set cause.name to ValidationError for handleCliErrors dispatch",
        actual: error.cause.name,
        expected: "ValidationError",
      });
    }
  });

  test("existing target without force should set cause.code to VALIDATION_ERROR", async () => {
    await fs.writeFile(path.join(tempTestDir, ".cursor"), "existing");

    try {
      await createSymlink({
        name: ".cursor",
        targetBase: tempTestDir,
        force: false,
      })();
      assert({
        given: "a symlink target that already exists and force is false",
        should: "throw an error",
        actual: false,
        expected: true,
      });
    } catch (e) {
      const error = /** @type {any} */ (e);
      assert({
        given: "a symlink target that already exists and force is false",
        should: "set cause.code to VALIDATION_ERROR",
        actual: error.cause.code,
        expected: "VALIDATION_ERROR",
      });
    }
  });
});

describe("claude symlink functionality", () => {
  const tempTestDir = path.join(__dirname, "temp-claude-test");
  const claudePath = path.join(tempTestDir, ".claude");

  beforeEach(async () => {
    if (await fs.pathExists(tempTestDir)) await fs.remove(tempTestDir);
    await fs.ensureDir(tempTestDir);
  });

  afterEach(async () => {
    if (await fs.pathExists(tempTestDir)) await fs.remove(tempTestDir);
  });

  test("claude option false should not create symlink", async () => {
    await executeClone({ targetDirectory: tempTestDir, claude: false });

    assert({
      given: "claude option is false",
      should: "not create .claude symlink",
      actual: await fs.pathExists(claudePath),
      expected: false,
    });
  });

  test("claude option true should create symlink to ai folder", async () => {
    await executeClone({ targetDirectory: tempTestDir, claude: true });

    assert({
      given: "claude option is true",
      should: "create .claude symlink",
      actual: await fs.pathExists(claudePath),
      expected: true,
    });
  });

  test("created .claude symlink should point to ai folder", async () => {
    await executeClone({ targetDirectory: tempTestDir, claude: true });

    const symlinkStat = await fs.lstat(claudePath);
    const symlinkTarget = await fs.readlink(claudePath);

    assert({
      given: ".claude symlink is created",
      should: "be a symbolic link",
      actual: symlinkStat.isSymbolicLink(),
      expected: true,
    });

    assert({
      given: ".claude symlink is created",
      should: "point to ai folder",
      actual: symlinkTarget,
      expected: "ai",
    });
  });

  test("dry run with claude should not create symlink", async () => {
    const result = await executeClone({
      targetDirectory: tempTestDir,
      claude: true,
      dryRun: true,
    });

    assert({
      given: "dry run mode with claude option",
      should: "not actually create symlink",
      actual: await fs.pathExists(claudePath),
      expected: false,
    });

    assert({
      given: "dry run mode with claude option",
      should: "indicate success",
      actual: result.success,
      expected: true,
    });
  });

  test("existing .claude file should be replaced with force", async () => {
    await fs.writeFile(claudePath, "existing content");

    await executeClone({
      targetDirectory: tempTestDir,
      claude: true,
      force: true,
    });

    assert({
      given: "existing .claude file with force option",
      should: "replace with symlink",
      actual: (await fs.lstat(claudePath)).isSymbolicLink(),
      expected: true,
    });
  });
});

describe("cursor and claude symlinks together", () => {
  const tempTestDir = path.join(__dirname, "temp-both-symlinks-test");

  beforeEach(async () => {
    if (await fs.pathExists(tempTestDir)) await fs.remove(tempTestDir);
    await fs.ensureDir(tempTestDir);
  });

  afterEach(async () => {
    if (await fs.pathExists(tempTestDir)) await fs.remove(tempTestDir);
  });

  test("cursor and claude both true should create both symlinks", async () => {
    await executeClone({
      targetDirectory: tempTestDir,
      cursor: true,
      claude: true,
    });

    const cursorStat = await fs.lstat(path.join(tempTestDir, ".cursor"));
    const claudeStat = await fs.lstat(path.join(tempTestDir, ".claude"));

    assert({
      given: "both cursor and claude options are true",
      should: "create .cursor symlink",
      actual: cursorStat.isSymbolicLink(),
      expected: true,
    });

    assert({
      given: "both cursor and claude options are true",
      should: "create .claude symlink",
      actual: claudeStat.isSymbolicLink(),
      expected: true,
    });
  });
});
