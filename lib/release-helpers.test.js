import { assert } from "riteway/vitest";
import { describe, test, beforeEach, afterEach } from "vitest";
import { exec } from "child_process";
import { promisify } from "util";

import { isPrerelease, updateLatestTag } from "./release-helpers.js";

const execAsync = promisify(exec);

describe("isPrerelease", () => {
  test("stable version detection", () => {
    const stableVersion = "1.2.3";

    assert({
      given: "a stable release version",
      should: "identify it as eligible for latest tag updates (not prerelease)",
      actual: isPrerelease(stableVersion),
      expected: false,
    });
  });

  test("release candidate detection", () => {
    const rcVersion = "1.2.3-rc.1";

    assert({
      given: "a release candidate version",
      should:
        "identify it as ineligible for latest tag updates (is prerelease)",
      actual: isPrerelease(rcVersion),
      expected: true,
    });
  });

  test("alpha prerelease detection", () => {
    const alphaVersion = "2.0.0-alpha";

    assert({
      given: "a version with alpha identifier",
      should:
        "identify it as ineligible for latest tag updates (is prerelease)",
      actual: isPrerelease(alphaVersion),
      expected: true,
    });
  });

  test("beta prerelease detection", () => {
    const betaVersion = "1.5.0-beta.2";

    assert({
      given: "a version with beta identifier",
      should:
        "identify it as ineligible for latest tag updates (is prerelease)",
      actual: isPrerelease(betaVersion),
      expected: true,
    });
  });
});

describe("updateLatestTag", () => {
  test("stable version tag creation", async () => {
    const stableVersion = "1.2.3";

    const result = await updateLatestTag({
      version: stableVersion,
      dryRun: true,
    });

    assert({
      given: "a stable release version in dry run mode",
      should: "indicate successful latest tag operation",
      actual: result.success,
      expected: true,
    });
  });

  test("prerelease version rejection", async () => {
    const prereleaseVersion = "1.2.3-rc.1";

    const result = await updateLatestTag({
      version: prereleaseVersion,
      dryRun: true,
    });

    assert({
      given: "a prerelease version",
      should: "reject the operation and return failure",
      actual: result.success,
      expected: false,
    });
  });
});

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
