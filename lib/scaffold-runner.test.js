import { EventEmitter } from "events";
import os from "os";
import path from "path";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test, vi } from "vitest";

vi.mock("child_process", async () => {
  const actual = await vi.importActual("child_process");
  // Default to real spawn so prompt-step tests can invoke `echo` and `false`
  // without a paid LLM. Individual tests may override with mockImplementationOnce.
  return { ...actual, spawn: vi.fn(/** @type {any} */ (actual).spawn) };
});

import { spawn } from "child_process";

import {
  defaultExecStep,
  parseManifest,
  runManifest,
} from "./scaffold-runner.js";

describe("defaultExecStep", () => {
  test("throws ScaffoldStepError with E2BIG-specific message when spawn fails with E2BIG", async () => {
    vi.mocked(spawn).mockImplementationOnce(() => {
      const proc = new EventEmitter();
      process.nextTick(() => {
        proc.emit(
          "error",
          Object.assign(new Error("spawn E2BIG"), { code: "E2BIG" }),
        );
      });
      return /** @type {any} */ (proc);
    });

    let error = null;
    try {
      await defaultExecStep(["claude", "some prompt"], "/tmp");
    } catch (err) {
      error = err;
    }

    assert({
      given: "spawn fails with E2BIG",
      should: "throw ScaffoldStepError with argument-list-too-long message",
      actual: {
        code: /** @type {any} */ (error)?.cause?.code,
        message: /** @type {any} */ (error)?.message,
      },
      expected: {
        code: "SCAFFOLD_STEP_ERROR",
        message: "Argument list too long for spawn: claude some prompt",
      },
    });
  });
});

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
    const yaml =
      "steps:\n  - run: npx aidd .\n  - prompt: Set up the project\n";

    const steps = parseManifest(yaml);

    assert({
      given: "YAML content with an aidd run step followed by a prompt step",
      should: "return array with both steps",
      actual: steps,
      expected: [{ run: "npx aidd ." }, { prompt: "Set up the project" }],
    });
  });

  test("parses multiple mixed steps", () => {
    const yaml =
      "steps:\n  - run: npx aidd .\n  - run: npm init -y\n  - prompt: Configure the project\n  - run: npm install vitest\n";

    const steps = parseManifest(yaml);

    assert({
      given: "YAML with multiple mixed steps where aidd run precedes prompts",
      should: "return all steps in order",
      actual: steps,
      expected: [
        { run: "npx aidd ." },
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

  test("parses steps when manifest begins with YAML document-start marker", () => {
    const yaml = "---\nsteps:\n  - run: npm init -y\n";

    const steps = parseManifest(yaml);

    assert({
      given: "YAML with a leading --- document-start marker",
      should: "parse steps correctly without silently dropping them",
      actual: steps,
      expected: [{ run: "npm init -y" }],
    });
  });

  test("throws ScaffoldValidationError for all invalid manifest shapes", () => {
    const cases = [
      { desc: "steps is a string", yaml: "steps: not-an-array\n" },
      { desc: "steps is an object", yaml: "steps:\n  run: npm init\n" },
      { desc: "step item is a string", yaml: "steps:\n  - just-a-string\n" },
      {
        desc: "step has no recognized keys",
        yaml: "steps:\n  - unknown: value\n",
      },
      { desc: "run value is a number", yaml: "steps:\n  - run: 123\n" },
      {
        desc: "run value is an array",
        yaml: "steps:\n  - run:\n      - a\n      - b\n",
      },
      {
        desc: "step has both run and prompt",
        yaml: "steps:\n  - run: npm init -y\n    prompt: also do this\n",
      },
      { desc: "prompt value is a number", yaml: "steps:\n  - prompt: 42\n" },
    ];
    for (const { desc, yaml } of cases) {
      /** @type {any} */
      let error = null;
      try {
        parseManifest(yaml);
      } catch (err) {
        error = err;
      }
      assert({
        given: desc,
        should: "throw ScaffoldValidationError",
        actual: error?.cause?.code,
        expected: "SCAFFOLD_VALIDATION_ERROR",
      });
    }
  });

  test("throws ScaffoldValidationError with a descriptive message when steps is not an array", () => {
    const yaml = "steps: 42\n";

    /** @type {any} */
    let error = null;
    try {
      parseManifest(yaml);
    } catch (err) {
      error = err;
    }

    assert({
      given: "YAML where steps is a number",
      should: "include 'steps' and the actual type in the error message",
      actual:
        typeof error?.message === "string" &&
        error.message.includes("steps") &&
        error.message.includes("number"),
      expected: true,
    });
  });

  test("includes both key names in the error message for ambiguous steps", () => {
    const yaml = "steps:\n  - run: npm init -y\n    prompt: also do this\n";

    /** @type {any} */
    let error = null;
    try {
      parseManifest(yaml);
    } catch (err) {
      error = err;
    }

    assert({
      given: "a step with both run and prompt keys",
      should: "name both conflicting keys in the error message",
      actual:
        typeof error?.message === "string" &&
        error.message.includes("run") &&
        error.message.includes("prompt"),
      expected: true,
    });
  });

  test("throws a parse error when YAML uses JS-specific type tags", () => {
    // !!js/regexp is a YAML extension that executes JS — safe schema must block it
    const maliciousYaml = "steps:\n  - run: !!js/regexp /evil/gi\n";

    let error = null;
    try {
      parseManifest(maliciousYaml);
    } catch (err) {
      error = err;
    }

    assert({
      given: "YAML with a JS-specific !!js/regexp tag",
      should: "throw a parse error rather than silently executing it",
      actual: error !== null,
      expected: true,
    });
  });

  test("includes step number, key name, and actual type in error message for non-string step value", () => {
    const yaml = "steps:\n  - run: 123\n";

    /** @type {any} */
    let error = null;
    try {
      parseManifest(yaml);
    } catch (err) {
      error = err;
    }

    assert({
      given: "a step where run is a number",
      should:
        "include the step number, key name, and actual type in the error message",
      actual:
        typeof error?.message === "string" &&
        error.message.includes("1") &&
        error.message.includes("run") &&
        error.message.includes("number"),
      expected: true,
    });
  });

  test("parses valid manifests with plain types without error under safe schema", () => {
    const yaml =
      "steps:\n  - run: npx aidd .\n  - run: npm install\n  - prompt: Set up the project\n";

    let error = null;
    let steps = null;
    try {
      steps = parseManifest(yaml);
    } catch (err) {
      error = err;
    }

    assert({
      given:
        "a valid manifest with only plain string steps preceded by an aidd run step",
      should: "parse without error under the safe schema",
      actual: error === null && Array.isArray(steps) && steps.length === 3,
      expected: true,
    });
  });

  test("throws ScaffoldValidationError when a prompt step precedes the aidd run step", () => {
    const yaml =
      "steps:\n  - prompt: Set up the project\n  - run: npx aidd .\n";

    /** @type {any} */
    let error = null;
    try {
      parseManifest(yaml);
    } catch (err) {
      error = err;
    }

    assert({
      given: "a manifest where a prompt step appears before the aidd run step",
      should: "throw ScaffoldValidationError",
      actual: error?.cause?.code,
      expected: "SCAFFOLD_VALIDATION_ERROR",
    });
  });

  test("returns steps without error when the aidd run step precedes all prompt steps", () => {
    const yaml =
      "steps:\n  - run: npx aidd .\n  - prompt: Set up the project\n";

    let error = null;
    let steps = /** @type {any} */ (null);
    try {
      steps = parseManifest(yaml);
    } catch (err) {
      error = err;
    }

    assert({
      given: "a manifest where the aidd run step precedes all prompt steps",
      should: "return steps without throwing",
      actual: error === null && Array.isArray(steps) && steps.length === 2,
      expected: true,
    });
  });

  test("returns steps without error when no prompt steps are present", () => {
    const yaml = "steps:\n  - run: npm install\n  - run: npm test\n";

    let error = null;
    let steps = /** @type {any} */ (null);
    try {
      steps = parseManifest(yaml);
    } catch (err) {
      error = err;
    }

    assert({
      given: "a manifest with only run steps and no prompt steps",
      should: "return steps without throwing",
      actual: error === null && Array.isArray(steps) && steps.length === 2,
      expected: true,
    });
  });

  test("throws ScaffoldValidationError when prompt steps exist but no aidd run step is present", () => {
    const yaml = "steps:\n  - prompt: Set up the project\n";

    /** @type {any} */
    let error = null;
    try {
      parseManifest(yaml);
    } catch (err) {
      error = err;
    }

    assert({
      given: "a manifest with a prompt step but no aidd run step at all",
      should: "throw ScaffoldValidationError",
      actual: error?.cause?.code,
      expected: "SCAFFOLD_VALIDATION_ERROR",
    });
  });

  test("throws ScaffoldValidationError when the only run step mentioning aidd is 'echo aidd'", () => {
    const yaml = "steps:\n  - run: echo aidd\n  - prompt: hi\n";

    /** @type {any} */
    let error = null;
    try {
      parseManifest(yaml);
    } catch (err) {
      error = err;
    }

    assert({
      given:
        "a manifest where the only run step mentioning aidd is 'echo aidd' (not a CLI invocation)",
      should: "throw ScaffoldValidationError",
      actual: error?.cause?.code,
      expected: "SCAFFOLD_VALIDATION_ERROR",
    });
  });

  test("throws ScaffoldValidationError when the only run step mentioning aidd is 'npm install aidd-something'", () => {
    const yaml =
      "steps:\n  - run: npm install aidd-something\n  - prompt: hi\n";

    /** @type {any} */
    let error = null;
    try {
      parseManifest(yaml);
    } catch (err) {
      error = err;
    }

    assert({
      given:
        "a manifest where the only run step mentioning aidd is 'npm install aidd-something' (a package name, not a CLI invocation)",
      should: "throw ScaffoldValidationError",
      actual: error?.cause?.code,
      expected: "SCAFFOLD_VALIDATION_ERROR",
    });
  });

  test("accepts manifest with 'npx -y aidd .' before a prompt step", () => {
    const yaml = "steps:\n  - run: npx -y aidd .\n  - prompt: hi\n";

    let error = null;
    let steps = /** @type {any} */ (null);
    try {
      steps = parseManifest(yaml);
    } catch (err) {
      error = err;
    }

    assert({
      given: "run: npx -y aidd . before a prompt step",
      should: "accept the manifest without throwing",
      actual: error === null && Array.isArray(steps) && steps.length === 2,
      expected: true,
    });
  });

  test("accepts manifest with 'npx --yes aidd .' before a prompt step", () => {
    const yaml = "steps:\n  - run: npx --yes aidd .\n  - prompt: hi\n";

    let error = null;
    let steps = /** @type {any} */ (null);
    try {
      steps = parseManifest(yaml);
    } catch (err) {
      error = err;
    }

    assert({
      given: "run: npx --yes aidd . before a prompt step",
      should: "accept the manifest without throwing",
      actual: error === null && Array.isArray(steps) && steps.length === 2,
      expected: true,
    });
  });
});

describe("runManifest", () => {
  /** @type {string} */
  let tempDir;
  /** @type {string | undefined} */
  let savedEnv;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-runner-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    savedEnv = process.env.AIDD_AGENT_CONFIG;
    // Write a real echo-agent config so prompt steps invoke `echo <prompt>`
    // (exits 0, prints the prompt) — no LLM required.
    const echoAgentConfig = path.join(tempDir, "echo-agent.yml");
    await fs.writeFile(echoAgentConfig, "command: echo\n");
    process.env.AIDD_AGENT_CONFIG = echoAgentConfig;
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    if (savedEnv !== undefined) {
      process.env.AIDD_AGENT_CONFIG = savedEnv;
    } else {
      delete process.env.AIDD_AGENT_CONFIG;
    }
  });

  test("executes run steps as shell commands in folder", async () => {
    const executed = /** @type {any[]} */ ([]);
    // @ts-expect-error -- mock: parameter types match runManifest's execStep signature
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

  test("invokes the configured agent in the project folder for prompt steps", async () => {
    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(
      manifestPath,
      "steps:\n  - run: npx aidd .\n  - prompt: Set up the project\n",
    );

    let error = null;
    try {
      await runManifest({
        manifestPath,
        folder: tempDir,
        execStep: async () => {},
      });
    } catch (err) {
      error = err;
    }

    assert({
      given:
        "a manifest with a prompt step and AIDD_AGENT_CONFIG pointing to echo",
      should: "invoke the configured agent in the project folder without error",
      actual: error,
      expected: null,
    });
  });

  test("executes steps in the target folder", async () => {
    const executed = /** @type {any[]} */ ([]);
    // @ts-expect-error -- mock: parameter types match runManifest's execStep signature
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
    const executed = /** @type {any[]} */ ([]);
    // @ts-expect-error -- mock: parameter types match runManifest's execStep signature
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
      given: "multiple run steps",
      should: "execute them in manifest order as shell strings",
      actual: executed.map(({ command }) => command),
      expected: ["first", "second", "third"],
    });
  });

  test("halts execution when a step fails", async () => {
    const executed = /** @type {any[]} */ ([]);
    // @ts-expect-error -- mock: parameter types match runManifest's execStep signature
    const mockExecStep = async (command) => {
      const label = Array.isArray(command) ? command.join(" ") : command;
      executed.push(label);
      if (label === "failing-command") {
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

  test("propagates error when the configured agent exits non-zero", async () => {
    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(
      manifestPath,
      "steps:\n  - run: npx aidd .\n  - prompt: do something\n",
    );

    // `false` is a POSIX utility that always exits 1, making it a reliable
    // stand-in for a failing agent without any LLM invocation.
    let error = null;
    try {
      await runManifest({
        manifestPath,
        folder: tempDir,
        agentConfig: { command: "false" },
        execStep: async () => {},
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "the configured agent exits non-zero",
      should: "propagate a ScaffoldStepError from runManifest",
      actual: /** @type {any} */ (error)?.cause?.code,
      expected: "SCAFFOLD_STEP_ERROR",
    });
  });

  test("executes all prompt steps without error when the agent succeeds for each", async () => {
    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(
      manifestPath,
      "steps:\n  - run: npx aidd .\n  - prompt: First task\n  - prompt: Second task\n",
    );

    let error = null;
    try {
      await runManifest({
        manifestPath,
        folder: tempDir,
        execStep: async () => {},
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "a manifest with multiple prompt steps and echo as the agent",
      should: "complete all prompt steps without error",
      actual: error,
      expected: null,
    });
  });

  test("does not invoke the agent when there are no prompt steps", async () => {
    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(
      manifestPath,
      "steps:\n  - run: npm install\n  - run: npm test\n",
    );

    // Passing a would-fail agent config proves the agent was never invoked:
    // if it had been called, runManifest would reject with ScaffoldStepError.
    let error = null;
    try {
      await runManifest({
        manifestPath,
        folder: tempDir,
        agentConfig: { command: "false" },
        execStep: async () => {},
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "a manifest with only run steps and no prompt steps",
      should:
        "complete without error even when the configured agent would fail if invoked",
      actual: error,
      expected: null,
    });
  });
});
