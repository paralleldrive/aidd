// @ts-check
import os from "os";
import path from "path";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test, vi } from "vitest";

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

describe("executeClone dry-run config.yml status", () => {
  let tempDir = "";
  /** @type {{ mock: { calls: any[][] }, mockRestore(): void }} */
  let consoleSpy;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-dry-run-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(async () => {
    consoleSpy.mockRestore();
    await fs.remove(tempDir);
  });

  test("config.yml does not exist", async () => {
    await executeClone({ targetDirectory: tempDir, dryRun: true });

    const logMessages = consoleSpy.mock.calls.map((call) => String(call[0]));
    const configLine = logMessages.find((msg) => msg.includes("config.yml"));

    assert({
      given: "a project without an existing aidd-custom/config.yml",
      should: "show (new) status in dry-run output",
      actual: configLine?.includes("(new)"),
      expected: true,
    });
  });

  test("config.yml already exists", async () => {
    await fs.ensureDir(path.join(tempDir, "aidd-custom"));
    await fs.writeFile(
      path.join(tempDir, "aidd-custom", "config.yml"),
      "e2eBeforeCommit: false\n",
      "utf-8",
    );

    await executeClone({ targetDirectory: tempDir, dryRun: true });

    const logMessages = consoleSpy.mock.calls.map((call) => String(call[0]));
    const configLine = logMessages.find((msg) => msg.includes("config.yml"));

    assert({
      given: "a project with an existing aidd-custom/config.yml",
      should: "show (exists (skipped)) status in dry-run output",
      actual: configLine?.includes("(exists (skipped))"),
      expected: true,
    });
  });
});
