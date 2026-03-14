import chalk from "chalk";
import { Command } from "commander";
import { createError } from "error-causes";
import { assert } from "riteway/vitest";
import { beforeEach, describe, test, vi } from "vitest";

vi.mock("./config.js", () => ({
  resolveAgentConfig: vi.fn(),
}));

vi.mock("./runner.js", () => ({
  runAgent: vi.fn(),
}));

vi.mock("./errors.js", async () => {
  const actual = await vi.importActual("./errors.js");
  return { ...actual };
});

import { registerAgentCommand } from "./command.js";
import { resolveAgentConfig } from "./config.js";
import {
  AgentConfigParseError,
  AgentConfigReadError,
  AgentConfigValidationError,
} from "./errors.js";
import { runAgent } from "./runner.js";

const createProgram = () => {
  const program = new Command();
  program.exitOverride();
  return program;
};

/**
 * @param {import("commander").Command} program
 * @param {string[]} args
 */
const runCommand = async (program, args) => {
  await program.parseAsync(["node", "aidd", ...args]);
};

describe("registerAgentCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("registers the agent subcommand on the program", () => {
    const program = createProgram();
    registerAgentCommand(program);

    const commandNames = program.commands.map((c) => c.name());

    assert({
      given: "registerAgentCommand called with a Commander program",
      should: "register an 'agent' subcommand",
      actual: commandNames.includes("agent"),
      expected: true,
    });
  });

  test("calls resolveAgentConfig and runAgent when --prompt is provided", async () => {
    const agentConfig = { command: "claude", args: ["-p"] };
    vi.mocked(resolveAgentConfig).mockResolvedValueOnce(agentConfig);
    vi.mocked(runAgent).mockResolvedValueOnce(undefined);

    const program = createProgram();
    registerAgentCommand(program);
    await runCommand(program, ["agent", "--prompt", "Build a todo app"]);

    assert({
      given: "--prompt flag provided",
      should: "call resolveAgentConfig with value undefined and process cwd",
      actual: vi.mocked(resolveAgentConfig).mock.calls[0],
      expected: [{ cwd: process.cwd(), value: undefined }],
    });

    assert({
      given: "--prompt flag provided",
      should: "call runAgent with resolved config and prompt text",
      actual: vi.mocked(runAgent).mock.calls[0],
      expected: [
        {
          agentConfig,
          cwd: process.cwd(),
          prompt: "Build a todo app",
        },
      ],
    });
  });

  test("passes --agentConfig value to resolveAgentConfig", async () => {
    const agentConfig = { command: "opencode", args: ["run"] };
    vi.mocked(resolveAgentConfig).mockResolvedValueOnce(agentConfig);
    vi.mocked(runAgent).mockResolvedValueOnce(undefined);

    const program = createProgram();
    registerAgentCommand(program);
    await runCommand(program, [
      "agent",
      "--prompt",
      "Build a todo app",
      "--agentConfig",
      "opencode",
    ]);

    assert({
      given: "--agentConfig flag set to 'opencode'",
      should: "pass the value to resolveAgentConfig",
      actual: vi.mocked(resolveAgentConfig).mock.calls[0]?.[0]?.value,
      expected: "opencode",
    });
  });

  test("prints an error and exits 1 when --prompt is not provided", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(/** @type {() => never} */ (() => {}));

    const program = createProgram();
    registerAgentCommand(program);

    try {
      await runCommand(program, ["agent"]);
    } catch {
      // exitOverride may throw on process.exit; swallow it
    }

    assert({
      given: "agent command invoked without --prompt",
      should: "print an error message to stderr",
      actual: consoleErrorSpy.mock.calls.length > 0,
      expected: true,
    });

    assert({
      given: "agent command invoked without --prompt",
      should: "exit with code 1",
      actual: processExitSpy.mock.calls[0]?.[0],
      expected: 1,
    });

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  test("calls handleAgentErrors and exits 1 on agent config error", async () => {
    vi.mocked(resolveAgentConfig).mockRejectedValueOnce(
      createError(AgentConfigReadError),
    );

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(/** @type {() => never} */ (() => {}));

    const program = createProgram();
    registerAgentCommand(program);

    try {
      await runCommand(program, ["agent", "--prompt", "Build a todo app"]);
    } catch {
      // swallow any exit override throws
    }

    assert({
      given: "resolveAgentConfig throws an AgentConfigReadError",
      should: "print the formatted config error message to stderr",
      actual: consoleErrorSpy.mock.calls[0]?.[0],
      expected: chalk.red(
        `\n❌ Agent config error: ${AgentConfigReadError.message}`,
      ),
    });

    assert({
      given: "resolveAgentConfig throws an AgentConfigReadError",
      should: "exit with code 1",
      actual: processExitSpy.mock.calls[0]?.[0],
      expected: 1,
    });

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  test("prints formatted error message on AgentConfigParseError", async () => {
    vi.mocked(resolveAgentConfig).mockRejectedValueOnce(
      createError(AgentConfigParseError),
    );

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(/** @type {() => never} */ (() => {}));

    const program = createProgram();
    registerAgentCommand(program);

    try {
      await runCommand(program, ["agent", "--prompt", "Build a todo app"]);
    } catch {
      // swallow any exit override throws
    }

    assert({
      given: "resolveAgentConfig throws an AgentConfigParseError",
      should: "print the formatted config error message to stderr",
      actual: consoleErrorSpy.mock.calls[0]?.[0],
      expected: chalk.red(
        `\n❌ Agent config error: ${AgentConfigParseError.message}`,
      ),
    });

    assert({
      given: "resolveAgentConfig throws an AgentConfigParseError",
      should: "exit with code 1",
      actual: processExitSpy.mock.calls[0]?.[0],
      expected: 1,
    });

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  test("prints formatted error message on AgentConfigValidationError", async () => {
    vi.mocked(resolveAgentConfig).mockRejectedValueOnce(
      createError(AgentConfigValidationError),
    );

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(/** @type {() => never} */ (() => {}));

    const program = createProgram();
    registerAgentCommand(program);

    try {
      await runCommand(program, ["agent", "--prompt", "Build a todo app"]);
    } catch {
      // swallow any exit override throws
    }

    assert({
      given: "resolveAgentConfig throws an AgentConfigValidationError",
      should: "print the formatted config error message to stderr",
      actual: consoleErrorSpy.mock.calls[0]?.[0],
      expected: chalk.red(
        `\n❌ Agent config error: ${AgentConfigValidationError.message}`,
      ),
    });

    assert({
      given: "resolveAgentConfig throws an AgentConfigValidationError",
      should: "exit with code 1",
      actual: processExitSpy.mock.calls[0]?.[0],
      expected: 1,
    });

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });
});
