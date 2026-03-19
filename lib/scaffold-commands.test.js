import { Command } from "commander";
import { assert } from "riteway/vitest";
import { describe, test, vi } from "vitest";

vi.mock("./aidd-config.js", () => ({ writeConfig: vi.fn() }));
vi.mock("./scaffold-cleanup.js", () => ({ scaffoldCleanup: vi.fn() }));
vi.mock("./scaffold-create.js", () => ({
  resolveCreateArgs: vi.fn(),
  runCreate: vi.fn(),
}));
vi.mock("./scaffold-errors.js", () => ({
  handleScaffoldErrors: vi.fn(() => () => {}),
}));
vi.mock("./scaffold-verify-cmd.js", () => ({ runVerifyScaffold: vi.fn() }));

import { registerScaffoldCommands } from "./scaffold-commands.js";

describe("registerScaffoldCommands", () => {
  const createTestProgram = () => {
    const program = new Command();
    program.exitOverride(); // prevent process.exit during parsing
    return program;
  };

  /** @param {import("commander").Command} program */
  const commandNames = (program) =>
    program.commands.map((cmd) => cmd.name()).sort();

  test("registers the expected command names on the program", () => {
    const program = createTestProgram();
    registerScaffoldCommands(program);

    assert({
      given: "a Commander program",
      should:
        "register the create, verify-scaffold, scaffold-cleanup, and set commands",
      actual: commandNames(program),
      expected: ["create", "scaffold-cleanup", "set", "verify-scaffold"],
    });
  });

  test("registers the create command with an --agentConfig option", () => {
    const program = createTestProgram();
    registerScaffoldCommands(program);

    const createCmd = program.commands.find((cmd) => cmd.name() === "create");
    const agentOption = createCmd?.options.find(
      (opt) => opt.long === "--agentConfig",
    );

    assert({
      given: "the create command",
      should: "have an --agentConfig option",
      actual: agentOption?.long,
      expected: "--agentConfig",
    });
  });

  test("registers the create command --agentConfig option with no default so the resolution chain runs", () => {
    const program = createTestProgram();
    registerScaffoldCommands(program);

    const createCmd = program.commands.find((cmd) => cmd.name() === "create");
    const agentOption = createCmd?.options.find(
      (opt) => opt.long === "--agentConfig",
    );

    assert({
      given: "the create command --agentConfig option is not explicitly passed",
      should:
        "have no default value so AIDD_AGENT_CONFIG env var and aidd-custom/config.yml are consulted",
      actual: agentOption?.defaultValue,
      expected: undefined,
    });
  });

  test("registers the set command with <key> and <value> arguments", () => {
    const program = createTestProgram();
    registerScaffoldCommands(program);

    const setCmd = program.commands.find((cmd) => cmd.name() === "set");
    const argNames = setCmd?.registeredArguments.map((a) => a.name());

    assert({
      given: "the set command",
      should: "accept key and value arguments",
      actual: argNames,
      expected: ["key", "value"],
    });
  });
});
