import { assert } from "riteway/vitest";
import { describe, test, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

import { executeClone } from "./cli-core.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Windows file locking retry helper - matches implementation in cli-core.js
const removeWithRetry = async (
  filePath,
  { maxRetries = 5, delayMs = 150 } = {},
) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
      }
      return; // Success
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const isRetryableError =
        error.code === "EBUSY" ||
        error.code === "EPERM" ||
        error.code === "ENOTEMPTY";

      if (isLastAttempt || !isRetryableError) {
        throw error; // Fail loud on last attempt or non-retryable error
      }

      // Wait before retry with exponential backoff
      const waitTime = delayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
};

describe("cursor symlink functionality", () => {
  // Use unique directory per test run to avoid conflicts in parallel test execution
  const uniqueId = `temp-cursor-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const tempTestDir = path.join(__dirname, uniqueId);
  const aiPath = path.join(tempTestDir, "ai");
  const cursorPath = path.join(tempTestDir, ".cursor");

  beforeEach(async () => {
    // Clean up any existing test directory with retry for Windows file locking
    await removeWithRetry(tempTestDir);
    await fs.ensureDir(tempTestDir);
  });

  afterEach(async () => {
    // Clean up test directory with retry and delay for Windows file locking
    // Add small delay to let file handles close
    await new Promise((resolve) => setTimeout(resolve, 50));
    await removeWithRetry(tempTestDir);
  });

  test("cursor option false should not create symlink", async () => {
    const result = await executeClone({
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
  });

  test("cursor option true should create symlink to ai folder", async () => {
    const result = await executeClone({
      targetDirectory: tempTestDir,
      cursor: true,
    });

    // Fail loud if operation failed
    if (!result.success) {
      throw new Error(
        `executeClone failed: ${result.error?.message || "Unknown error"}. Code: ${result.error?.code}`,
      );
    }

    const symlinkExists = await fs.pathExists(cursorPath);

    assert({
      given: "cursor option is true",
      should: "create .cursor symlink",
      actual: symlinkExists,
      expected: true,
    });
  });

  test("created symlink should point to ai folder", async () => {
    const result = await executeClone({
      targetDirectory: tempTestDir,
      cursor: true,
    });

    // Fail loud if operation failed
    if (!result.success) {
      throw new Error(
        `executeClone failed: ${result.error?.message || "Unknown error"}. Code: ${result.error?.code}`,
      );
    }

    const symlinkStat = await fs.lstat(cursorPath);
    const symlinkTarget = await fs.readlink(cursorPath);

    assert({
      given: "cursor symlink is created",
      should: "be a symbolic link",
      actual: symlinkStat.isSymbolicLink(),
      expected: true,
    });

    // On Windows, junctions return absolute paths; on Unix, relative paths
    // Normalize by checking if the target ends with "ai" or equals "ai"
    const normalizedTarget = symlinkTarget.replace(/[\\\/]+$/, ""); // Remove trailing slashes
    const pointsToAiFolder =
      normalizedTarget === "ai" || normalizedTarget.endsWith(path.sep + "ai");

    assert({
      given: "cursor symlink is created",
      should: "point to ai folder",
      actual: pointsToAiFolder,
      expected: true,
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
    // First create the ai folder by running executeClone without cursor
    // This ensures the target ai directory exists for the symlink
    await executeClone({
      targetDirectory: tempTestDir,
      cursor: false,
      force: true,
    });

    // Windows file locking: delay to ensure all file handles are released
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Create existing .cursor file (not a symlink)
    await fs.writeFile(cursorPath, "existing content");

    // Verify the file exists and is not a symlink
    const beforeStat = await fs.lstat(cursorPath);
    if (beforeStat.isSymbolicLink()) {
      throw new Error(
        "Test setup failed: .cursor should be a file, not a symlink",
      );
    }

    // Windows file locking: delay before second executeClone
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Now run with cursor: true and force: true to replace file with symlink
    const result = await executeClone({
      targetDirectory: tempTestDir,
      cursor: true,
      force: true,
    });

    // Fail loud if operation failed
    if (!result.success) {
      throw new Error(
        `executeClone failed: ${result.error?.message || "Unknown error"}. Code: ${result.error?.code}`,
      );
    }

    const symlinkStat = await fs.lstat(cursorPath);

    assert({
      given: "existing .cursor file with force option",
      should: "replace with symlink",
      actual: symlinkStat.isSymbolicLink(),
      expected: true,
    });
  });
});
