import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, describe, test } from "vitest";

import { validateSource, validateTarget } from "./cli-core.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("validateSource", () => {
  test("missing source directory throws ValidationError", async () => {
    const nonExistentPath = path.join(__dirname, "does-not-exist");

    try {
      await validateSource({ source: nonExistentPath });
      assert({
        given: "a non-existent source directory",
        should: "throw ValidationError",
        actual: false,
        expected: true,
      });
    } catch (error) {
      assert({
        given: "a non-existent source directory",
        should: "throw error with VALIDATION_ERROR code",
        actual: error.cause.code,
        expected: "VALIDATION_ERROR",
      });
    }
  });

  test("missing source directory includes path in error message", async () => {
    const nonExistentPath = path.join(__dirname, "does-not-exist");

    try {
      await validateSource({ source: nonExistentPath });
    } catch (error) {
      assert({
        given: "a non-existent source directory",
        should: "include the path in error message",
        actual: error.message.includes(nonExistentPath),
        expected: true,
      });
    }
  });

  test("existing source directory returns valid result", async () => {
    const existingPath = __dirname;

    const result = await validateSource({ source: existingPath });

    assert({
      given: "an existing source directory",
      should: "return valid result",
      actual: result.valid,
      expected: true,
    });
  });
});

describe("validateTarget", () => {
  const tempDir = path.join(__dirname, "temp-test-dir");

  afterEach(async () => {
    // Clean up test directory
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  test("non-existent target directory should be valid", async () => {
    const nonExistentTarget = path.join(__dirname, "should-not-exist");

    const result = await validateTarget({
      target: nonExistentTarget,
      force: false,
    })();

    assert({
      given: "a non-existent target directory",
      should: "return valid result",
      actual: result.valid,
      expected: true,
    });
  });

  test("existing target without force throws ValidationError", async () => {
    // Create a test directory
    await fs.ensureDir(tempDir);

    try {
      await validateTarget({ target: tempDir, force: false })();
      assert({
        given: "an existing target directory without force flag",
        should: "throw ValidationError",
        actual: false,
        expected: true,
      });
    } catch (error) {
      assert({
        given: "an existing target directory without force flag",
        should: "throw error with VALIDATION_ERROR code",
        actual: error.cause.code,
        expected: "VALIDATION_ERROR",
      });
    }
  });

  test("existing target with force should be valid", async () => {
    // Create a test directory
    await fs.ensureDir(tempDir);

    const result = await validateTarget({ target: tempDir, force: true })();

    assert({
      given: "an existing target directory with force flag",
      should: "return valid result",
      actual: result.valid,
      expected: true,
    });
  });

  test("existing target error message mentions --force", async () => {
    // Create a test directory
    await fs.ensureDir(tempDir);

    try {
      await validateTarget({ target: tempDir, force: false })();
    } catch (error) {
      assert({
        given: "an existing target directory without force",
        should: "suggest using --force in error message",
        actual: error.message.includes("--force"),
        expected: true,
      });
    }
  });
});
