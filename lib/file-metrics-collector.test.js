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
        given: "a TypeScript source file with an if statement and two returns",
        should: "return correct loc, positive gzip ratio, and complexity of 4",
        actual: {
          loc: metrics?.loc,
          gzipPositive: (metrics?.gzipRatio ?? 0) > 0,
          complexity: metrics?.complexity,
        },
        // loc=5: 4 lines + empty element after trailing newline
        // complexity=4: function(1) + if(1) + return(1) + return(1) per tsmetrics-core
        // gzip ratio > 1 is expected for tiny files (header overhead exceeds savings)
        expected: { loc: 5, gzipPositive: true, complexity: 4 },
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
        given: "a file with 3 lines and a trailing newline",
        should:
          "return line count including the empty element after the trailing newline",
        actual: result.get("three.ts")?.loc,
        expected: 4,
      });
    });
  });
});
