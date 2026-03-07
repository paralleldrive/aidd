// @ts-check
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { scoreFiles } from "./churn-scorer.js";

/** @param {[string, number][]} entries @returns {Map<string, number>} */
const churnMap = (entries) => new Map(entries);

/** @param {[string, import('./churn-scorer.js').FileMetrics][]} entries */
const metricsMap = (entries) => new Map(entries);

describe("scoreFiles", () => {
  test("composite score", () => {
    const churn = churnMap([["foo.ts", 3]]);
    const metrics = metricsMap([
      ["foo.ts", { loc: 100, complexity: 5, gzipRatio: 0.4 }],
    ]);
    const [result] = scoreFiles(churn, metrics);

    assert({
      given: "a file with known loc, churn, and complexity metrics",
      should: "return score equal to their product",
      actual: result.score,
      expected: 1500,
    });
  });

  test("sorting", () => {
    const churn = churnMap([
      ["a.ts", 2],
      ["b.ts", 5],
    ]);
    const metrics = metricsMap([
      ["a.ts", { loc: 200, complexity: 10, gzipRatio: 0.3 }],
      ["b.ts", { loc: 100, complexity: 4, gzipRatio: 0.3 }],
    ]);
    const results = scoreFiles(churn, metrics);

    assert({
      given: "two files with different scores",
      should: "return results sorted by score descending",
      actual: results.map((r) => r.file),
      expected: ["a.ts", "b.ts"],
    });
  });

  test("top filter", () => {
    const churn = churnMap([
      ["a.ts", 1],
      ["b.ts", 1],
      ["c.ts", 1],
    ]);
    const metrics = metricsMap([
      ["a.ts", { loc: 300, complexity: 3, gzipRatio: 0.3 }],
      ["b.ts", { loc: 200, complexity: 3, gzipRatio: 0.3 }],
      ["c.ts", { loc: 100, complexity: 3, gzipRatio: 0.3 }],
    ]);

    assert({
      given: "top=2",
      should: "return at most 2 results",
      actual: scoreFiles(churn, metrics, { top: 2 }).length,
      expected: 2,
    });
  });

  test("minLoc filter", () => {
    const churn = churnMap([
      ["small.ts", 5],
      ["big.ts", 5],
    ]);
    const metrics = metricsMap([
      ["small.ts", { loc: 30, complexity: 10, gzipRatio: 0.3 }],
      ["big.ts", { loc: 200, complexity: 10, gzipRatio: 0.3 }],
    ]);

    assert({
      given: "minLoc=50 and a file with 30 lines",
      should: "exclude the file below the threshold",
      actual: scoreFiles(churn, metrics, { minLoc: 50 }).map((r) => r.file),
      expected: ["big.ts"],
    });
  });

  test("unchurned files excluded", () => {
    const churn = churnMap([]);
    const metrics = metricsMap([
      ["untouched.ts", { loc: 500, complexity: 20, gzipRatio: 0.3 }],
    ]);

    assert({
      given: "a file with no churn",
      should: "exclude it from results",
      actual: scoreFiles(churn, metrics).length,
      expected: 0,
    });
  });
});
