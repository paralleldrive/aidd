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

vi.mock("child_process", async () => {
  const actual = await vi.importActual("child_process");
  return { ...actual, spawnSync: vi.fn() };
});

vi.mock("./file-metrics-collector.js", async () => {
  const actual = await vi.importActual("./file-metrics-collector.js");
  return { ...actual, collectFileMetrics: vi.fn(() => new Map()) };
});

import { spawnSync } from "child_process";

import { churnErrors, collectChurn } from "./churn-collector.js";
import { addChurnCommand } from "./churn-command.js";
import { collectFileMetrics } from "./file-metrics-collector.js";

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

describe("addChurnCommand subdirectory path resolution", () => {
  afterEach(() => {
    vi.mocked(collectChurn).mockReset();
    vi.mocked(collectFileMetrics).mockReset();
    vi.mocked(spawnSync).mockReset();
  });

  test("uses git root when run from a subdirectory", async () => {
    const gitRoot = "/repo/root";
    vi.mocked(spawnSync).mockReturnValueOnce(
      /** @type {any} */ ({ stdout: `${gitRoot}\n`, status: 0 }),
    );
    vi.mocked(collectChurn).mockReturnValueOnce(new Map([["src/foo.js", 5]]));

    const program = addChurnCommand(new Command());
    await program.parseAsync(["node", "aidd", "churn"]);
    await new Promise((r) => setTimeout(r, 0));

    assert({
      given: "running churn from a subdirectory of the git repository",
      should: "resolve file paths relative to the git repository root",
      actual: vi.mocked(collectFileMetrics).mock.calls[0]?.[0]?.cwd,
      expected: gitRoot,
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
