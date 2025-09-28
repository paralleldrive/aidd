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
      "lib/update-latest-tag-hook.js"
    );

    // Create a test version tag to simulate what release-it would create
    await execAsync(`git tag ${testVersion}`);
    testTagsCreated.push(testVersion);

    // Add small delay to ensure tag is fully created
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify tag exists before proceeding
    await execAsync(`git rev-parse ${testVersion}`);

    // Run the hook script directly (simulating release-it calling it)
    const { stdout } = await execAsync(`node ${hookScript} ${testVersion}`);

    // Verify hook output
    assert({
      given: "hook script execution with stable version",
      should: "show evaluation and success messages",
      actual:
        stdout.includes("Evaluating latest tag update") &&
        stdout.includes("✅"),
      expected: true,
    });

    // Verify latest tag was created and points to the test version
    try {
      const { stdout: latestRef } = await execAsync("git rev-parse latest");
      const { stdout: testRef } = await execAsync(
        `git rev-parse ${testVersion}`
      );

      assert({
        given: "successful hook execution",
        should: "update latest tag to point to the same commit as test version",
        actual: latestRef.trim(),
        expected: testRef.trim(),
      });
    } catch (error) {
      assert({
        given: "git tag verification",
        should: "not fail to find the created latest tag",
        actual: false,
        expected: true,
      });
    }
  });

  test("hook integration with prerelease version", async () => {
    const prereleaseVersion = "v9.9.9-rc.1";
    const hookScript = path.join(
      process.cwd(),
      "lib/update-latest-tag-hook.js"
    );

    // Run the hook script with prerelease version
    const { stdout } = await execAsync(
      `node ${hookScript} ${prereleaseVersion}`
    );

    // Verify hook output shows rejection
    assert({
      given: "hook script execution with prerelease version",
      should: "show evaluation and rejection messages",
      actual:
        stdout.includes("Evaluating latest tag update") &&
        stdout.includes("prerelease version"),
      expected: true,
    });

    // Verify no latest tag was created
    try {
      await execAsync("git rev-parse latest");
      // If we get here, the tag exists (it shouldn't for a fresh test)
      assert({
        given: "prerelease version hook execution",
        should: "not create latest tag",
        actual: false,
        expected: true,
      });
    } catch {
      // This is expected - no latest tag should exist
      assert({
        given: "prerelease version hook execution",
        should: "not create latest tag",
        actual: true,
        expected: true,
      });
    }
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
              hook.includes("update-latest-tag-hook.js")
          ),
        expected: true,
      });
    }
  });

  test("error handling in hook script", async () => {
    const hookScript = path.join(
      process.cwd(),
      "lib/update-latest-tag-hook.js"
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
