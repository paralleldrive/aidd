import { assert } from "riteway/vitest";
import { describe, test } from "vitest";
import { exec } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import path from "path";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const hookScript = path.join(__dirname, "update-latest-tag-hook.js");

describe("update-latest-tag-hook CLI", () => {
  test("requires version argument", async () => {
    try {
      await execAsync(`node ${hookScript}`);
      assert({
        given: "hook script without version argument",
        should: "not reach this point (should exit with error)",
        actual: false,
        expected: true,
      });
    } catch (error) {
      assert({
        given: "hook script without version argument",
        should: "exit with error code 1",
        actual: error.code,
        expected: 1,
      });

      assert({
        given: "hook script without version argument",
        should: "show error message about missing version",
        actual: error.stderr.includes("Version argument required"),
        expected: true,
      });
    }
  });

  test("handles prerelease versions gracefully", async () => {
    const prereleaseVersion = "v1.2.3-rc.1";

    // This should not throw - prerelease rejection is handled gracefully
    const { stdout } = await execAsync(
      `node ${hookScript} ${prereleaseVersion}`,
    );

    assert({
      given: "hook script with prerelease version",
      should: "show evaluation message",
      actual: stdout.includes("Evaluating latest tag update"),
      expected: true,
    });

    assert({
      given: "hook script with prerelease version",
      should: "indicate prerelease rejection",
      actual: stdout.includes("prerelease version"),
      expected: true,
    });
  });
});
