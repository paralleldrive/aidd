// @ts-check

import { Command } from "commander";
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { addChurnCommand } from "./churn-command.js";

const getChurnCommand = () => {
  const program = addChurnCommand(new Command());
  return program.commands.find((c) => c.name() === "churn");
};

describe("addChurnCommand", () => {
  test("registers churn subcommand", () => {
    assert({
      given: "a Commander program",
      should: "register a command named churn",
      actual: getChurnCommand()?.name(),
      expected: "churn",
    });
  });

  test("option defaults", () => {
    const cmd = getChurnCommand();
    const defaults = Object.fromEntries(
      (cmd?.options ?? []).map((o) => [o.long, o.defaultValue]),
    );

    assert({
      given: "the churn command",
      should: "have correct default values for all options",
      actual: defaults,
      expected: {
        "--days": "90",
        "--top": "20",
        "--min-loc": "50",
        "--json": undefined,
      },
    });
  });
});
