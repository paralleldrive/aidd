import os from "os";
import path from "path";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test } from "vitest";

import { createLogger, executeClone, resolvePaths } from "./cli-core.js";

describe("resolvePaths", () => {
  test("default path resolution", () => {
    const paths = resolvePaths();

    assert({
      given: "no parameters provided",
      should: "resolve to current directory as target base",
      actual: paths.targetBase,
      expected: process.cwd(),
    });
  });

  test("custom target directory resolution", () => {
    const testDir = "./test-target";
    const paths = resolvePaths({ targetDirectory: testDir });

    assert({
      given: "a custom target directory",
      should: "resolve target base to the specified directory",
      actual: paths.targetBase.endsWith("test-target"),
      expected: true,
    });
  });

  test("ai folder target path", () => {
    const paths = resolvePaths({ targetDirectory: "./my-project" });

    assert({
      given: "a target directory",
      should: "create ai subfolder within target",
      actual: paths.target.endsWith("my-project/ai"),
      expected: true,
    });
  });
});

describe("executeClone error result shape", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-cli-core-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    // Pre-create an ai/ folder so the ai/ already-exists validation fires
    await fs.ensureDir(path.join(tempDir, "ai"));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("returns result.error as an Error instance (not a plain object) when clone fails", async () => {
    // ai/ already exists without force — triggers ValidationError
    const result = await executeClone({ targetDirectory: tempDir });

    assert({
      given: "a clone that fails validation",
      should: "return result.error as an instanceof Error",
      actual: result.success === false && result.error instanceof Error,
      expected: true,
    });
  });

  test("result.error has a cause.code identifying the error type", async () => {
    const result = await executeClone({ targetDirectory: tempDir });

    assert({
      given: "a clone that fails with a validation error",
      should: "have result.error.cause.code equal to VALIDATION_ERROR",
      actual: result.error?.cause?.code,
      expected: "VALIDATION_ERROR",
    });
  });
});

describe("createLogger", () => {
  test("logger initialization with defaults", () => {
    const logger = createLogger();

    assert({
      given: "default logger options",
      should: "return logger object with expected methods",
      actual:
        typeof logger.info === "function" && typeof logger.error === "function",
      expected: true,
    });
  });

  test("verbose logging flag", () => {
    const verboseLogger = createLogger({ verbose: true });

    assert({
      given: "verbose logging enabled",
      should: "create logger with verbose capability",
      actual: typeof verboseLogger.verbose === "function",
      expected: true,
    });
  });
});
