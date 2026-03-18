// @ts-check
import os from "os";
import path from "path";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test, vi } from "vitest";

import {
  createAiddCustomAgentsMd,
  createAiddCustomConfig,
  createLogger,
  executeClone,
  resolvePaths,
} from "./cli-core.js";

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

describe("createAiddCustomConfig", () => {
  let tempDir = "";

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-config-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("creates aidd-custom/config.yml when it does not exist", async () => {
    const result = await createAiddCustomConfig({ targetBase: tempDir })();

    assert({
      given: "a target directory without aidd-custom/config.yml",
      should: "return created: true",
      actual: result.created,
      expected: true,
    });

    const exists = await fs.pathExists(
      path.join(tempDir, "aidd-custom", "config.yml"),
    );

    assert({
      given: "a target directory without aidd-custom/config.yml",
      should: "write the config file",
      actual: exists,
      expected: true,
    });
  });

  test("config.yml contains e2eBeforeCommit: false by default", async () => {
    await createAiddCustomConfig({ targetBase: tempDir })();
    const content = await fs.readFile(
      path.join(tempDir, "aidd-custom", "config.yml"),
      "utf-8",
    );

    assert({
      given: "a newly created config.yml",
      should: "default e2eBeforeCommit to false",
      actual: content.includes("e2eBeforeCommit: false"),
      expected: true,
    });
  });

  test("skips creation when config.yml already exists", async () => {
    await fs.ensureDir(path.join(tempDir, "aidd-custom"));
    await fs.writeFile(
      path.join(tempDir, "aidd-custom", "config.yml"),
      "e2eBeforeCommit: true\n",
      "utf-8",
    );

    const result = await createAiddCustomConfig({ targetBase: tempDir })();

    assert({
      given: "an existing config.yml",
      should: "return created: false",
      actual: result.created,
      expected: false,
    });

    const content = await fs.readFile(
      path.join(tempDir, "aidd-custom", "config.yml"),
      "utf-8",
    );

    assert({
      given: "an existing config.yml",
      should: "preserve the original content",
      actual: content,
      expected: "e2eBeforeCommit: true\n",
    });
  });
});

describe("createAiddCustomAgentsMd", () => {
  let tempDir = "";

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-agents-md-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("creates aidd-custom/AGENTS.md when it does not exist", async () => {
    const result = await createAiddCustomAgentsMd({ targetBase: tempDir })();

    assert({
      given: "a target directory without aidd-custom/AGENTS.md",
      should: "return created: true",
      actual: result.created,
      expected: true,
    });

    const exists = await fs.pathExists(
      path.join(tempDir, "aidd-custom", "AGENTS.md"),
    );

    assert({
      given: "a target directory without aidd-custom/AGENTS.md",
      should: "write the AGENTS.md file",
      actual: exists,
      expected: true,
    });
  });

  test("AGENTS.md contains override instruction", async () => {
    await createAiddCustomAgentsMd({ targetBase: tempDir })();
    const content = await fs.readFile(
      path.join(tempDir, "aidd-custom", "AGENTS.md"),
      "utf-8",
    );

    assert({
      given: "a newly created aidd-custom/AGENTS.md",
      should: "contain override instruction",
      actual: content.toLowerCase().includes("override"),
      expected: true,
    });
  });

  test("skips creation when AGENTS.md already exists", async () => {
    await fs.ensureDir(path.join(tempDir, "aidd-custom"));
    await fs.writeFile(
      path.join(tempDir, "aidd-custom", "AGENTS.md"),
      "# My Custom Agents\n",
      "utf-8",
    );

    const result = await createAiddCustomAgentsMd({ targetBase: tempDir })();

    assert({
      given: "an existing aidd-custom/AGENTS.md",
      should: "return created: false",
      actual: result.created,
      expected: false,
    });

    const content = await fs.readFile(
      path.join(tempDir, "aidd-custom", "AGENTS.md"),
      "utf-8",
    );

    assert({
      given: "an existing aidd-custom/AGENTS.md",
      should: "preserve the original content",
      actual: content,
      expected: "# My Custom Agents\n",
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
