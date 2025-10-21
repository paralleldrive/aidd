import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { isPrerelease, updateLatestTag } from "./release-helpers.js";

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
