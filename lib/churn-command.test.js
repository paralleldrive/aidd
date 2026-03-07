// @ts-check

import { Command } from "commander";
import { createError } from "error-causes";
import { assert } from "riteway/vitest";
import { afterEach, describe, test, vi } from "vitest";

vi.mock("./churn-collector.js", async () => {
  const actual = await vi.importActual("./churn-collector.js");
  return {
    ...actual,
    collectChurn: vi.fn(() => new Map()),
  };
});

import { churnErrors, collectChurn } from "./churn-collector.js";
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

describe("addChurnCommand error exit codes", () => {
  afterEach(() => {
    vi.mocked(collectChurn).mockReset();
  });

  test("exits with code 1 on GitError", async () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(/** @type {() => never} */ (() => {}));

    vi.mocked(collectChurn).mockImplementationOnce(() => {
      throw createError({
        ...churnErrors.GitError,
        cause: new Error("git command failed"),
      });
    });

    const program = addChurnCommand(new Command());
    await program.parseAsync(["node", "aidd", "churn"]);
    await new Promise((r) => setTimeout(r, 0));

    assert({
      given: "a GitError from collectChurn",
      should: "exit with code 1",
      actual: exitSpy.mock.calls[0]?.[0],
      expected: 1,
    });

    exitSpy.mockRestore();
  });

  test("exits with code 1 when not a git repo", async () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(/** @type {() => never} */ (() => {}));

    vi.mocked(collectChurn).mockImplementationOnce(() => {
      throw createError({
        ...churnErrors.NotAGitRepo,
        cause: new Error("fatal: not a git repository"),
      });
    });

    const program = addChurnCommand(new Command());
    await program.parseAsync(["node", "aidd", "churn"]);
    await new Promise((r) => setTimeout(r, 0));

    assert({
      given: "not a git repository",
      should: "exit with code 1",
      actual: exitSpy.mock.calls[0]?.[0],
      expected: 1,
    });

    exitSpy.mockRestore();
  });
});
