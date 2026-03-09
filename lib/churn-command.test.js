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
import { addChurnCommand, validateChurnOptions } from "./churn-command.js";
import { collectFileMetrics } from "./file-metrics-collector.js";

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

  test("description mentions JS/TS focus", () => {
    const cmd = getChurnCommand();

    assert({
      given: "the churn command",
      should: "indicate it analyzes source files",
      actual: cmd?.description().includes("hotspot"),
      expected: true,
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

  test("prints real git stderr on GitError, not static message", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(/** @type {() => never} */ (() => {}));

    vi.mocked(collectChurn).mockImplementationOnce(() => {
      throw createError({
        ...churnErrors.GitError,
        cause: new Error("fatal: not a git repository: /some/path"),
      });
    });

    const program = addChurnCommand(new Command());
    await program.parseAsync(["node", "aidd", "churn"]);
    await new Promise((r) => setTimeout(r, 0));

    assert({
      given: "a GitError with a specific cause message",
      should: "print the real git stderr rather than the static error message",
      actual: String(errorSpy.mock.calls[0]?.[0]).includes(
        "fatal: not a git repository: /some/path",
      ),
      expected: true,
    });

    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test("prints error message to stderr for unexpected errors", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(/** @type {() => never} */ (() => {}));

    vi.mocked(collectChurn).mockImplementationOnce(() => {
      throw new Error("something completely unexpected");
    });

    const program = addChurnCommand(new Command());
    await program.parseAsync(["node", "aidd", "churn"]);
    await new Promise((r) => setTimeout(r, 0));

    assert({
      given: "an unexpected error during churn collection",
      should: "call console.error to print a message to stderr before exiting",
      actual: errorSpy.mock.calls.length >= 1,
      expected: true,
    });

    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
