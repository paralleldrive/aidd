// @ts-check
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { filterSourceFiles, jsTsExtensions } from "./churn-filters.js";

describe("jsTsExtensions", () => {
  test("canonical extension set", () => {
    assert({
      given: "jsTsExtensions exported from churn-filters",
      should: "include all standard JS/TS extensions",
      actual: [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"].every((ext) =>
        jsTsExtensions.has(ext),
      ),
      expected: true,
    });
  });

  test("non-source extensions excluded", () => {
    assert({
      given: "jsTsExtensions exported from churn-filters",
      should: "not include non-source extensions such as .json or .md",
      actual: [".json", ".md"].some((ext) => jsTsExtensions.has(ext)),
      expected: false,
    });
  });
});

describe("filterSourceFiles", () => {
  test("includes JavaScript and TypeScript files", () => {
    const files = [
      "src/app.js",
      "src/component.jsx",
      "lib/utils.ts",
      "lib/types.tsx",
      "build.mjs",
      "config.cjs",
    ];

    assert({
      given: "a mix of JS and TS files",
      should: "include all of them",
      actual: filterSourceFiles(files),
      expected: files,
    });
  });

  test("excludes non-source files", () => {
    const files = [
      "package.json",
      "package-lock.json",
      "README.md",
      "tsconfig.json",
      ".gitignore",
      "styles.css",
      "data.xml",
    ];

    assert({
      given: "non-source files",
      should: "exclude all of them",
      actual: filterSourceFiles(files),
      expected: [],
    });
  });

  test("filters mixed list", () => {
    const files = [
      "src/index.ts",
      "package.json",
      "lib/helper.js",
      "README.md",
      "test/spec.test.ts",
    ];

    assert({
      given: "a mix of source and non-source files",
      should: "return only JS/TS files",
      actual: filterSourceFiles(files),
      expected: ["src/index.ts", "lib/helper.js", "test/spec.test.ts"],
    });
  });

  test("handles empty list", () => {
    assert({
      given: "an empty list",
      should: "return an empty list",
      actual: filterSourceFiles([]),
      expected: [],
    });
  });

  test("handles files with no extension", () => {
    const files = ["Makefile", "Dockerfile", "LICENSE"];

    assert({
      given: "files with no extension",
      should: "exclude them",
      actual: filterSourceFiles(files),
      expected: [],
    });
  });
});
