// @ts-check

import os from "os";
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { collectChurn, parseChurnOutput } from "./churn-collector.js";

// --- pure unit tests ---

describe("parseChurnOutput", () => {
  test("touch counts", () => {
    const output = "src/foo.js\nsrc/foo.js\nsrc/bar.js\n";

    assert({
      given: "git log output with repeated file entries",
      should: "return correct touch count per file",
      actual: {
        foo: parseChurnOutput(output).get("src/foo.js"),
        bar: parseChurnOutput(output).get("src/bar.js"),
      },
      expected: { foo: 2, bar: 1 },
    });
  });

  test("blank lines ignored", () => {
    const output = "\nsrc/foo.js\n\n\nsrc/bar.js\n\n";

    assert({
      given: "output with blank lines between file entries",
      should: "ignore blank lines and count only real paths",
      actual: parseChurnOutput(output).size,
      expected: 2,
    });
  });

  test("empty output", () => {
    assert({
      given: "empty git log output",
      should: "return an empty map",
      actual: parseChurnOutput("").size,
      expected: 0,
    });
  });
});

// --- e2e tests against real git/filesystem ---

describe("collectChurn", () => {
  test("returns touched files from real git repo", () => {
    const result = collectChurn({ cwd: process.cwd(), days: 90 });

    assert({
      given: "the current git repository",
      should: "include package.json with at least one touch",
      actual: (result.get("package.json") ?? 0) > 0,
      expected: true,
    });
  });

  test("not a git repo throws NotAGitRepo error", () => {
    const dir = os.tmpdir();
    let error;

    try {
      collectChurn({ cwd: dir, days: 90 });
    } catch (e) {
      error = e;
    }

    assert({
      given: "a directory that is not a git repository",
      should: "throw a NotAGitRepo caused error",
      actual: /** @type {any} */ (error)?.cause?.name,
      expected: "NotAGitRepo",
    });
  });

  test("file not touched in window is absent", () => {
    const result = collectChurn({ cwd: process.cwd(), days: 0 });

    assert({
      given: "a zero-day window",
      should: "return an empty map since no files were touched",
      actual: result.size,
      expected: 0,
    });
  });
});
