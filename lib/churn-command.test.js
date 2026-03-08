// @ts-check

import { Command } from "commander";
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { addChurnCommand, validateChurnOptions } from "./churn-command.js";

const getChurnCommand = () => {
  const program = addChurnCommand(new Command());
  return program.commands.find((c) => c.name() === "churn");
};

describe("validateChurnOptions", () => {
  test("valid options", () => {
    assert({
      given: "valid numeric options",
      should: "return null (no error)",
      actual: validateChurnOptions({ days: "30", top: "10", minLoc: "50" }),
      expected: null,
    });
  });

  test("non-numeric --days", () => {
    assert({
      given: "a non-numeric --days value",
      should: "return a message naming the flag and the bad value",
      actual: validateChurnOptions({ days: "abc", top: "10", minLoc: "50" }),
      expected: '--days must be a positive integer (got "abc")',
    });
  });

  test("zero --days", () => {
    assert({
      given: "a zero --days value",
      should: "return a message naming the flag and the bad value",
      actual: validateChurnOptions({ days: "0", top: "10", minLoc: "50" }),
      expected: '--days must be a positive integer (got "0")',
    });
  });

  test("non-numeric --top", () => {
    assert({
      given: "a non-numeric --top value",
      should: "return a message naming the flag and the bad value",
      actual: validateChurnOptions({ days: "90", top: "abc", minLoc: "50" }),
      expected: '--top must be a positive integer (got "abc")',
    });
  });

  test("non-numeric --min-loc", () => {
    assert({
      given: "a non-numeric --min-loc value",
      should: "return a message naming the flag and the bad value",
      actual: validateChurnOptions({ days: "90", top: "20", minLoc: "abc" }),
      expected: '--min-loc must be a non-negative integer (got "abc")',
    });
  });

  test("negative --min-loc", () => {
    assert({
      given: "a negative --min-loc value",
      should: "return a message naming the flag and the bad value",
      actual: validateChurnOptions({ days: "90", top: "20", minLoc: "-1" }),
      expected: '--min-loc must be a non-negative integer (got "-1")',
    });
  });
});

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
