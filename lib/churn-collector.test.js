// @ts-check

import { assert } from "riteway/vitest";
import { beforeEach, describe, test, vi } from "vitest";

vi.mock("child_process");

import { collectChurn } from "./churn-collector.js";

const mockExecSync = async () => {
  const { execSync } = await import("child_process");
  return /** @type {import('vitest').MockedFunction<typeof execSync>} */ (
    execSync
  );
};

describe("collectChurn", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("touched files", async () => {
    const execSync = await mockExecSync();
    execSync.mockReturnValue("src/foo.js\nsrc/foo.js\nsrc/bar.js\n");

    const result = collectChurn({ cwd: "/repo", days: 90 });

    assert({
      given: "git log output with two touches on foo.js and one on bar.js",
      should: "return correct touch counts for each file",
      actual: { foo: result.get("src/foo.js"), bar: result.get("src/bar.js") },
      expected: { foo: 2, bar: 1 },
    });
  });

  test("untouched file excluded", async () => {
    const execSync = await mockExecSync();
    execSync.mockReturnValue("src/foo.js\n");

    const result = collectChurn({ cwd: "/repo", days: 90 });

    assert({
      given: "git log output that does not mention bar.js",
      should: "not include bar.js in the result",
      actual: result.has("src/bar.js"),
      expected: false,
    });
  });

  test("not a git repo error", async () => {
    const execSync = await mockExecSync();
    execSync.mockImplementation(() => {
      throw new Error("fatal: not a git repository");
    });

    let error;
    try {
      collectChurn({ cwd: "/not-a-repo", days: 90 });
    } catch (e) {
      error = e;
    }

    assert({
      given: "a path outside a git repository",
      should: "throw a NotAGitRepo caused error",
      actual: /** @type {any} */ (error)?.cause?.name,
      expected: "NotAGitRepo",
    });
  });

  test("git error", async () => {
    const execSync = await mockExecSync();
    execSync.mockImplementation(() => {
      throw new Error("git: something else went wrong");
    });

    let error;
    try {
      collectChurn({ cwd: "/repo", days: 90 });
    } catch (e) {
      error = e;
    }

    assert({
      given: "a generic git failure",
      should: "throw a GitError caused error",
      actual: /** @type {any} */ (error)?.cause?.name,
      expected: "GitError",
    });
  });
});
