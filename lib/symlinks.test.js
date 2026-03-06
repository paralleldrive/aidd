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

  test("existing target without force throws a CausedError", async () => {
    await fs.writeFile(path.join(tempTestDir, ".cursor"), "existing");

    let caughtError;
    try {
      await createSymlink({
        name: ".cursor",
        targetBase: tempTestDir,
        force: false,
      })();
    } catch (e) {
      caughtError = /** @type {any} */ (e);
    }

    assert({
      given: "a symlink target that already exists and force is false",
      should: "throw with a message indicating --force is needed",
      actual: caughtError?.message,
      expected: ".cursor already exists (use --force to overwrite)",
    });
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

  test("claude option true should create symlink pointing to ai/", async () => {
    await executeClone({ targetDirectory: tempTestDir, claude: true });

    const symlinkTarget = await fs.readlink(claudePath);

    assert({
      given: "claude option is true",
      should: "create .claude as a symbolic link pointing to ai/",
      actual: {
        isSymlink: (await fs.lstat(claudePath)).isSymbolicLink(),
        target: symlinkTarget,
      },
      expected: { isSymlink: true, target: "ai" },
    });
  });

  test("dry run with claude should not create symlink and still succeed", async () => {
    const result = await executeClone({
      targetDirectory: tempTestDir,
      claude: true,
      dryRun: true,
    });

    assert({
      given: "dry run mode with claude option",
      should: "not create the symlink and return success",
      actual: {
        exists: await fs.pathExists(claudePath),
        success: result.success,
      },
      expected: { exists: false, success: true },
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

    assert({
      given: "both cursor and claude options are true",
      should: "create both symlinks pointing to ai/",
      actual: {
        cursor: (
          await fs.lstat(path.join(tempTestDir, ".cursor"))
        ).isSymbolicLink(),
        claude: (
          await fs.lstat(path.join(tempTestDir, ".claude"))
        ).isSymbolicLink(),
      },
      expected: { cursor: true, claude: true },
    });
  });
});
