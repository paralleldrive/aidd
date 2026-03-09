// @ts-check
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { jsTsExtensions } from "./churn-filters.js";

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
