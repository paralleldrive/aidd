import { Command } from "commander";
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { registerAgentCommand } from "./command.js";

describe("registerAgentCommand", () => {
  test("registers the agent subcommand on the program", () => {
    const program = new Command();
    registerAgentCommand(program);

    assert({
      given: "registerAgentCommand called with a Commander program",
      should: "register an 'agent' subcommand",
      actual: program.commands.map((c) => c.name()).includes("agent"),
      expected: true,
    });
  });
});
