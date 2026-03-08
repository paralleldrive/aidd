// @ts-check
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { formatJson, formatTable } from "./churn-formatter.js";

const makeResult = (overrides = {}) => ({
  file: "src/foo.ts",
  score: 1500,
  loc: 100,
  churn: 3,
  complexity: 5,
  gzipRatio: 0.35,
  ...overrides,
});

describe("formatTable", () => {
  test("headers", () => {
    const output = formatTable([makeResult()]);
    const headers = ["Score", "LoC", "Churn", "Cx", "Density", "File"];

    assert({
      given: "scored results",
      should: "include all column headers",
      actual: headers.filter((h) => !output.includes(h)),
      expected: [],
    });
  });

  test("empty state", () => {
    assert({
      given: "no results",
      should: "return a friendly empty-state message",
      actual: formatTable([]).includes("No hotspots"),
      expected: true,
    });
  });

  test("file column is left-aligned", () => {
    const output = formatTable([
      makeResult({ file: "short.ts" }),
      makeResult({ file: "a/much/longer/path/to/file.ts" }),
    ]);
    const [, , rowShort, rowLong] = output.split("\n"); // skip header + divider

    assert({
      given: "results with file paths of different lengths",
      should:
        "start both file paths at the same column position (left-aligned)",
      actual: rowShort.indexOf("short.ts"),
      expected: rowLong.indexOf("a/much/longer/path/to/file.ts"),
    });
  });

  test("gzip density display", () => {
    const output = formatTable([makeResult({ gzipRatio: 0.35 })]);

    assert({
      given: "a gzip ratio of 0.35",
      should: "display it as a percentage",
      actual: output.includes("35%"),
      expected: true,
    });
  });
});

describe("formatJson", () => {
  test("valid JSON", () => {
    const results = [makeResult()];
    const parsed = JSON.parse(formatJson(results));

    assert({
      given: "scored results",
      should: "return valid parseable JSON with all fields",
      actual: parsed[0],
      expected: results[0],
    });
  });
});
