import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { createLogger, resolvePaths } from "./cli-core.js";

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
