import { assert } from "riteway/vitest";
import { describe, test, beforeEach, afterEach } from "vitest";
import { exec } from "child_process";
import { promisify } from "util";

import { updateLatestTag } from "./release-helpers.js";

const execAsync = promisify(exec);

describe("updateLatestTag integration", () => {
  let originalLatestRef = null;
  let testTagCreated = false;

  beforeEach(async () => {
    // Store current latest ref if it exists
    try {
      const { stdout } = await execAsync("git rev-parse latest");
      originalLatestRef = stdout.trim();
    } catch {
      // No existing latest tag - that's fine
      originalLatestRef = null;
    }
  });

  afterEach(async () => {
    // Clean up: remove test tag if we created one
    if (testTagCreated) {
      try {
        await execAsync("git tag -d latest");
        testTagCreated = false;
      } catch {
        // Tag might not exist, that's fine
      }
    }

    // Restore original latest ref if it existed
    if (originalLatestRef) {
      try {
        await execAsync(`git tag -f latest ${originalLatestRef}`);
      } catch {
        // If restore fails, that's a problem but don't fail the test
      }
    }
  });

  test("creates latest tag for stable version", async () => {
    const stableVersion = "1.2.3";

    // First, create a test version tag pointing to current HEAD
    await execAsync(`git tag v${stableVersion}`);

    const result = await updateLatestTag({
      version: stableVersion,
      dryRun: false,
    });

    // Clean up the test version tag
    await execAsync(`git tag -d v${stableVersion}`);

    // Verify the result
    assert({
      given: "a stable version with actual git operations",
      should: "indicate successful tag creation",
      actual: result.success,
      expected: true,
    });

    // Verify the tag was actually created
    try {
      const { stdout } = await execAsync("git tag -l latest");
      testTagCreated = true;

      assert({
        given: "successful updateLatestTag operation",
        should: "create the latest git tag",
        actual: stdout.trim(),
        expected: "latest",
      });
    } catch (error) {
      assert({
        given: "git tag verification",
        should: "not fail to find the created tag",
        actual: false,
        expected: true,
      });
    }
  });
});
