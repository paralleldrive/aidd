import { EventEmitter } from "events";
import os from "os";
import path from "path";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test, vi } from "vitest";

vi.mock("child_process", async () => {
  const actual = await vi.importActual("child_process");
  return { ...actual, spawn: vi.fn() };
});

vi.mock("./agent-cli/runner.js", () => ({ runAgent: vi.fn() }));
vi.mock("./agent-cli/config.js", () => ({ resolveAgentConfig: vi.fn() }));

import { spawn } from "child_process";

import { resolveAgentConfig } from "./agent-cli/config.js";
import { runAgent } from "./agent-cli/runner.js";
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
});

describe("runManifest", () => {
  /** @type {string} */
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-runner-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    vi.clearAllMocks();
    vi.mocked(resolveAgentConfig).mockResolvedValue({
      command: "claude",
      args: ["-p"],
    });
    vi.mocked(runAgent).mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
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

  test("executes prompt steps via agent CLI", async () => {
    const executed = /** @type {any[]} */ ([]);
    // @ts-expect-error -- mock: parameter types match runManifest's execStep signature
    const mockExecStep = async (command, cwd) => {
      executed.push({ command, cwd });
    };

    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(
      manifestPath,
      "steps:\n  - run: npx aidd .\n  - prompt: Set up the project\n",
    );

    await runManifest({
      manifestPath,
      folder: tempDir,
      agentConfig: "claude",
      execStep: mockExecStep,
    });

    const call = vi.mocked(runAgent).mock.calls[0][0];
    const spawnedCommand = [
      call.agentConfig.command,
      ...(call.agentConfig.args ?? []),
      call.prompt,
    ];

    assert({
      given: "a manifest with a prompt step preceded by an aidd run step",
      should: "invoke agent CLI with [command, ...args, promptText]",
      actual: spawnedCommand,
      expected: ["claude", "-p", "Set up the project"],
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

  test("throws ScaffoldStepError when a prompt step spawn fails with E2BIG", async () => {
    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(
      manifestPath,
      "steps:\n  - run: npx aidd .\n  - prompt: set up the project\n",
    );

    // run step — let defaultExecStep succeed via spawn mock
    vi.mocked(spawn).mockImplementationOnce(() => {
      const proc = new EventEmitter();
      process.nextTick(() => proc.emit("close", 0));
      return /** @type {any} */ (proc);
    });

    // prompt step — runAgent throws an E2BIG-style ScaffoldStepError
    const e2BigError = Object.assign(
      new Error(
        "Argument list too long for spawn: claude -p set up the project",
      ),
      { cause: { code: "SCAFFOLD_STEP_ERROR" } },
    );
    vi.mocked(runAgent).mockRejectedValueOnce(e2BigError);

    let error = null;
    try {
      await runManifest({ manifestPath, folder: tempDir });
    } catch (err) {
      error = err;
    }

    assert({
      given: "a prompt step whose spawn fails with E2BIG",
      should: "throw ScaffoldStepError with argument-list-too-long message",
      actual: {
        code: /** @type {any} */ (error)?.cause?.code,
        message: /** @type {any} */ (error)?.message,
      },
      expected: {
        code: "SCAFFOLD_STEP_ERROR",
        message:
          "Argument list too long for spawn: claude -p set up the project",
      },
    });
  });

  test("uses claude as the default agent for prompt steps", async () => {
    const mockExecStep = async () => {};

    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(
      manifestPath,
      "steps:\n  - run: npx aidd .\n  - prompt: do something\n",
    );

    await runManifest({
      manifestPath,
      folder: tempDir,
      execStep: mockExecStep,
    });

    const call = vi.mocked(runAgent).mock.calls[0][0];
    const spawnedCommand = [
      call.agentConfig.command,
      ...(call.agentConfig.args ?? []),
      call.prompt,
    ];

    assert({
      given: "a prompt step with no agent specified",
      should: "use claude as the default agent in the command array",
      actual: spawnedCommand[0],
      expected: "claude",
    });
  });

  test("calls resolveAgentConfig exactly once for a manifest with multiple prompt steps", async () => {
    const mockExecStep = async () => {};

    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(
      manifestPath,
      `${[
        "steps:",
        "  - run: npx aidd .",
        "  - prompt: First task",
        "  - run: npx aidd .",
        "  - prompt: Second task",
      ].join("\n")}\n`,
    );

    await runManifest({
      manifestPath,
      folder: tempDir,
      execStep: mockExecStep,
    });

    assert({
      given: "a manifest with multiple prompt steps",
      should: "call resolveAgentConfig exactly once per runManifest invocation",
      actual: vi.mocked(resolveAgentConfig).mock.calls.length,
      expected: 1,
    });
  });

  test("passes value:undefined to resolveAgentConfig when agentConfig is not provided, so the env var and config file are consulted", async () => {
    const mockExecStep = async () => {};

    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(
      manifestPath,
      "steps:\n  - run: npx aidd .\n  - prompt: do something\n",
    );

    await runManifest({
      manifestPath,
      folder: tempDir,
      execStep: mockExecStep,
    });

    const callArgs = vi.mocked(resolveAgentConfig).mock.calls[0]?.[0];
    assert({
      given: "agentConfig is not passed to runManifest",
      should:
        "call resolveAgentConfig with value:undefined so AIDD_AGENT_CONFIG and aidd-custom/config.yml are consulted",
      actual: callArgs?.value,
      expected: undefined,
    });
  });

  test("does not call resolveAgentConfig when there are no prompt steps", async () => {
    const mockExecStep = async () => {};

    const manifestPath = path.join(tempDir, "SCAFFOLD-MANIFEST.yml");
    await fs.writeFile(
      manifestPath,
      "steps:\n  - run: npm install\n  - run: npm test\n",
    );

    await runManifest({
      manifestPath,
      folder: tempDir,
      execStep: mockExecStep,
    });

    assert({
      given: "a manifest with only run steps and no prompt steps",
      should: "never call resolveAgentConfig",
      actual: vi.mocked(resolveAgentConfig).mock.calls.length,
      expected: 0,
    });
  });
});
