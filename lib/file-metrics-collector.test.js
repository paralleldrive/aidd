// @ts-check
import os from "os";
import path from "path";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { collectFileMetrics } from "./file-metrics-collector.js";

/** @param {(dir: string) => Promise<void>} fn */
const withTempDir = async (fn) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aidd-test-"));
  try {
    return await fn(dir);
  } finally {
    await fs.remove(dir);
  }
};

describe("collectFileMetrics", () => {
  test("source file metrics", async () => {
    await withTempDir(async (dir) => {
      await fs.writeFile(
        path.join(dir, "foo.ts"),
        "function foo(x) {\n  if (x) return x;\n  return 0;\n}\n",
      );

      const result = collectFileMetrics({ files: ["foo.ts"], cwd: dir });
      const metrics = result.get("foo.ts");

      assert({
        given: "a TypeScript source file",
        should: "return loc, gzipRatio, and complexity",
        actual: {
          hasLoc: (metrics?.loc ?? 0) > 0,
          hasGzip: (metrics?.gzipRatio ?? 0) > 0,
          hasComplexity: (metrics?.complexity ?? 0) >= 1,
        },
        expected: { hasLoc: true, hasGzip: true, hasComplexity: true },
      });
    });
  });

  test("non-TypeScript file complexity", async () => {
    await withTempDir(async (dir) => {
      await fs.writeFile(path.join(dir, "data.json"), '{"key":"value"}\n');

      const result = collectFileMetrics({ files: ["data.json"], cwd: dir });

      assert({
        given: "a non-TypeScript file",
        should: "return complexity of 1",
        actual: result.get("data.json")?.complexity,
        expected: 1,
      });
    });
  });

  test("unreadable file skipped", () => {
    const result = collectFileMetrics({
      files: ["does-not-exist.ts"],
      cwd: "/nonexistent",
    });

    assert({
      given: "a file that cannot be read",
      should: "skip it and return an empty map",
      actual: result.size,
      expected: 0,
    });
  });

  test("loc count", async () => {
    await withTempDir(async (dir) => {
      await fs.writeFile(path.join(dir, "three.ts"), "a\nb\nc\n");

      const result = collectFileMetrics({ files: ["three.ts"], cwd: dir });

      assert({
        given: "a file with 3 lines",
        should: "return loc of 4 (split on newline gives 4 elements)",
        actual: result.get("three.ts")?.loc,
        expected: 4,
      });
    });
  });
});
