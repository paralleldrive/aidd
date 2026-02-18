import os from "os";
import path from "path";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test } from "vitest";

import { parseManifest, runManifest } from "./scaffold-runner.js";

describe("parseManifest", () => {
  test("parses run steps from YAML", () => {
    const yaml = "steps:\n  - run: npm init -y\n";

    const steps = parseManifest(yaml);

    assert({
      given: "YAML content with a run step",
      should: "return array with run step",
      actual: steps,
      expected: [{ run: "npm init -y" }],
    });
  });

  test("parses prompt steps from YAML", () => {
    const yaml = "steps:\n  - prompt: Set up the project\n";

    const steps = parseManifest(yaml);

    assert({
      given: "YAML content with a prompt step",
      should: "return array with prompt step",
      actual: steps,
      expected: [{ prompt: "Set up the project" }],
    });
  });

  test("parses multiple mixed steps", () => {
    const yaml =
      "steps:\n  - run: npm init -y\n  - prompt: Configure the project\n  - run: npm install vitest\n";

    const steps = parseManifest(yaml);

    assert({
      given: "YAML with multiple mixed steps",
      should: "return all steps in order",
      actual: steps,
      expected: [
        { run: "npm init -y" },
        { prompt: "Configure the project" },
        { run: "npm install vitest" },
      ],
    });
  });

  test("returns empty array when no steps defined", () => {
    const yaml = "steps: []\n";

    const steps = parseManifest(yaml);

    assert({
      given: "YAML with empty steps array",
      should: "return empty array",
      actual: steps,
      expected: [],
    });
  });

  test("returns empty array when steps key is absent", () => {
    const yaml = "description: a scaffold\n";

    const steps = parseManifest(yaml);

    assert({
      given: "YAML without a steps key",
      should: "return empty array",
      actual: steps,
      expected: [],
    });
  });
});

describe("runManifest", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-runner-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("executes run steps as shell commands in folder", async () => {
    const executed = [];
    const mockExecStep = async (command, cwd) => {
      executed.push({ command, cwd });
    };

    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(manifestPath, "steps:\n  - run: npm init -y\n");

    await runManifest({
      manifestPath,
      folder: tempDir,
      execStep: mockExecStep,
    });

    assert({
      given: "a manifest with a run step",
      should: "execute the run command in the target folder",
      actual: executed[0],
      expected: { command: "npm init -y", cwd: tempDir },
    });
  });

  test("executes prompt steps via agent CLI", async () => {
    const executed = [];
    const mockExecStep = async (command, cwd) => {
      executed.push({ command, cwd });
    };

    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(
      manifestPath,
      "steps:\n  - prompt: Set up the project\n",
    );

    await runManifest({
      manifestPath,
      folder: tempDir,
      agent: "claude",
      execStep: mockExecStep,
    });

    assert({
      given: "a manifest with a prompt step",
      should: "invoke the agent CLI with the prompt string",
      actual: executed[0].command.includes("claude"),
      expected: true,
    });

    assert({
      given: "a manifest with a prompt step",
      should: "include the prompt text in the command",
      actual: executed[0].command.includes("Set up the project"),
      expected: true,
    });
  });

  test("executes steps in the target folder", async () => {
    const executed = [];
    const mockExecStep = async (command, cwd) => {
      executed.push({ command, cwd });
    };

    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(
      manifestPath,
      "steps:\n  - run: echo hello\n  - run: echo world\n",
    );

    await runManifest({
      manifestPath,
      folder: tempDir,
      execStep: mockExecStep,
    });

    assert({
      given: "multiple run steps",
      should: "execute all steps in the target folder",
      actual: executed.every(({ cwd }) => cwd === tempDir),
      expected: true,
    });
  });

  test("executes steps in order", async () => {
    const executed = [];
    const mockExecStep = async (command, cwd) => {
      executed.push({ command, cwd });
    };

    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(
      manifestPath,
      "steps:\n  - run: first\n  - run: second\n  - run: third\n",
    );

    await runManifest({
      manifestPath,
      folder: tempDir,
      execStep: mockExecStep,
    });

    assert({
      given: "multiple steps",
      should: "execute them in manifest order",
      actual: executed.map(({ command }) => command),
      expected: ["first", "second", "third"],
    });
  });

  test("halts execution when a step fails", async () => {
    const executed = [];
    const mockExecStep = async (command) => {
      executed.push(command);
      if (command === "failing-command") {
        throw new Error("Command failed: failing-command");
      }
    };

    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(
      manifestPath,
      "steps:\n  - run: failing-command\n  - run: should-not-run\n",
    );

    let errorThrown = null;
    try {
      await runManifest({
        manifestPath,
        folder: tempDir,
        execStep: mockExecStep,
      });
    } catch (err) {
      errorThrown = err;
    }

    assert({
      given: "a step that fails",
      should: "throw an error and halt execution",
      actual: errorThrown !== null,
      expected: true,
    });

    assert({
      given: "a step that fails",
      should: "not execute subsequent steps",
      actual: executed.includes("should-not-run"),
      expected: false,
    });
  });

  test("runs bin/extension.js after all manifest steps if present", async () => {
    const executed = [];
    const mockExecStep = async (command, cwd) => {
      executed.push({ command, cwd });
    };

    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    const extensionJsPath = path.join(tempDir, "bin/extension.js");
    await fs.ensureDir(path.join(tempDir, "bin"));
    await fs.writeFile(manifestPath, "steps:\n  - run: first-step\n");
    await fs.writeFile(extensionJsPath, "// extension");

    await runManifest({
      manifestPath,
      extensionJsPath,
      folder: tempDir,
      execStep: mockExecStep,
    });

    assert({
      given: "a bin/extension.js present",
      should: "execute it after all manifest steps",
      actual:
        executed.length === 2 && executed[1].command.includes("extension.js"),
      expected: true,
    });
  });

  test("skips bin/extension.js when not present", async () => {
    const executed = [];
    const mockExecStep = async (command, cwd) => {
      executed.push({ command, cwd });
    };

    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    const extensionJsPath = path.join(tempDir, "bin/extension.js");
    await fs.writeFile(manifestPath, "steps:\n  - run: only-step\n");

    await runManifest({
      manifestPath,
      extensionJsPath,
      folder: tempDir,
      execStep: mockExecStep,
    });

    assert({
      given: "no bin/extension.js present",
      should: "execute only manifest steps",
      actual: executed.length,
      expected: 1,
    });
  });

  test("uses claude as the default agent for prompt steps", async () => {
    const executed = [];
    const mockExecStep = async (command, cwd) => {
      executed.push({ command, cwd });
    };

    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(manifestPath, "steps:\n  - prompt: do something\n");

    await runManifest({
      manifestPath,
      folder: tempDir,
      execStep: mockExecStep,
    });

    assert({
      given: "a prompt step with no agent specified",
      should: "use claude as the default agent",
      actual: executed[0].command.startsWith("claude"),
      expected: true,
    });
  });
});
