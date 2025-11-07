import { assert } from "riteway/vitest";
import { describe, test, beforeEach, afterEach } from "vitest";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs-extra";
import path from "path";

const execAsync = promisify(exec);

describe("Enhanced Release Process E2E", () => {
  let originalLatestRef = null;
  let testTagsCreated = [];
  let originalPackageVersion = null;

  beforeEach(async () => {
    // Store current latest ref if it exists
    try {
      const { stdout } = await execAsync("git rev-parse latest");
      originalLatestRef = stdout.trim();
    } catch {
      originalLatestRef = null;
    }

    // Store original package.json version
    const packagePath = path.join(process.cwd(), "package.json");
    const packageContent = await fs.readJson(packagePath);
    originalPackageVersion = packageContent.version;
  });

  afterEach(async () => {
    // Clean up any test tags we created
    for (const tag of testTagsCreated) {
      try {
        await execAsync(`git tag -d ${tag}`);
      } catch {
        // Tag might not exist, that's fine
      }
    }
    testTagsCreated = [];

    // Clean up latest tag if we created one
    try {
      await execAsync("git tag -d latest");
    } catch {
      // Might not exist
    }

    // Restore original latest ref if it existed
    if (originalLatestRef) {
      try {
        await execAsync(`git tag -f latest ${originalLatestRef}`);
      } catch {
        // If restore fails, that's a problem but don't fail the test
      }
    }

    // Restore original package.json version
    if (originalPackageVersion) {
      const packagePath = path.join(process.cwd(), "package.json");
      const packageContent = await fs.readJson(packagePath);
      packageContent.version = originalPackageVersion;
      await fs.writeJson(packagePath, packageContent, { spaces: 2 });
    }
  });

  test("hook integration with stable version", async () => {
    const testVersion = "v9.9.9";
    const hookScript = path.join(
      process.cwd(),
      "lib/update-latest-tag-hook.js",
    );

    // Get the current HEAD commit - this is what we expect latest to point to
    const { stdout: headRef } = await execAsync("git rev-parse HEAD");
    const expectedCommit = headRef.trim();

    // Create a test version tag pointing to HEAD (simulating release-it)
    await execAsync(`git tag ${testVersion}`);
    testTagsCreated.push(testVersion);

    // Run the hook script - if this throws, test fails (which is correct)
    await execAsync(`node ${hookScript} ${testVersion}`);

    // Verify latest tag points to the same commit as HEAD (where we tagged v9.9.9)
    const { stdout: latestRef } = await execAsync("git rev-parse latest");
    const actualCommit = latestRef.trim();

    assert({
      given: "hook execution with stable version tag on HEAD",
      should: "create latest tag pointing to HEAD",
      actual: actualCommit,
      expected: expectedCommit,
    });
  });

  test("hook integration with prerelease version", async () => {
    const prereleaseVersion = "v9.9.9-rc.1";
    const hookScript = path.join(
      process.cwd(),
      "lib/update-latest-tag-hook.js",
    );

    // Store the latest tag ref before running hook (if it exists)
    let latestRefBefore = null;
    try {
      const { stdout } = await execAsync("git rev-parse latest");
      latestRefBefore = stdout.trim();
    } catch {
      latestRefBefore = null;
    }

    // Run the hook script with prerelease version
    // Hook should still exit 0 (it doesn't fail, just skips update)
    await execAsync(`node ${hookScript} ${prereleaseVersion}`);

    assert({
      given: "hook script execution with prerelease version",
      should: "exit successfully without error",
      actual: true, // If we reach here, execAsync didn't throw
      expected: true,
    });

    // Verify latest tag was NOT modified
    let latestRefAfter = null;
    try {
      const { stdout } = await execAsync("git rev-parse latest");
      latestRefAfter = stdout.trim();
    } catch {
      latestRefAfter = null;
    }

    assert({
      given: "prerelease version hook execution",
      should: "not modify the latest tag",
      actual: latestRefAfter,
      expected: latestRefBefore,
    });
  });

  test("release-it configuration is valid", async () => {
    const configPath = path.join(process.cwd(), ".release-it.json");

    // Verify config file exists and is valid JSON
    const configExists = await fs.pathExists(configPath);
    assert({
      given: "release-it integration",
      should: "have valid configuration file",
      actual: configExists,
      expected: true,
    });

    if (configExists) {
      const config = await fs.readJson(configPath);

      // Verify our hook is configured
      assert({
        given: "release-it configuration",
        should: "include our latest tag hook in after:release",
        actual:
          Array.isArray(config.hooks?.["after:release"]) &&
          config.hooks["after:release"].some(
            (hook) =>
              typeof hook === "string" &&
              hook.includes("update-latest-tag-hook.js"),
          ),
        expected: true,
      });
    }
  });

  test("error handling in hook script", async () => {
    const hookScript = path.join(
      process.cwd(),
      "lib/update-latest-tag-hook.js",
    );

    // Test with missing version argument
    try {
      await execAsync(`node ${hookScript}`);
      assert({
        given: "hook script without arguments",
        should: "not reach this point (should exit with error)",
        actual: false,
        expected: true,
      });
    } catch (error) {
      assert({
        given: "hook script without arguments",
        should: "exit with error and show helpful message",
        actual:
          error.code === 1 &&
          error.stderr.includes("Version argument required"),
        expected: true,
      });
    }
  });
});
