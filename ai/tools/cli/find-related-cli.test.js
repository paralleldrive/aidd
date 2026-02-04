import { describe, test } from "vitest";
import { assert } from "riteway/vitest";

import { formatRelated } from "./find-related-cli.js";

describe("cli/find-related-cli", () => {
  describe("formatRelated", () => {
    test("returns JSON when json option is true", () => {
      const results = [{ file: "test.js", direction: "forward", depth: 1 }];

      const output = formatRelated(results, { json: true, direction: "both" });
      const parsed = JSON.parse(output);

      assert({
        given: "results with json option",
        should: "return valid JSON string",
        actual: parsed.length,
        expected: 1,
      });
    });

    test("returns formatted JSON with indentation", () => {
      const results = [{ file: "test.js", direction: "forward", depth: 1 }];

      const output = formatRelated(results, { json: true, direction: "both" });

      assert({
        given: "json option",
        should: "return pretty-printed JSON",
        actual: output.includes("\n"),
        expected: true,
      });
    });

    test("returns no results message for empty array", () => {
      const output = formatRelated([], { direction: "both" });

      assert({
        given: "empty results",
        should: "return no results message",
        actual: output.includes("No related files found"),
        expected: true,
      });
    });

    test("includes result count in output", () => {
      const results = [
        { file: "a.js", direction: "forward", depth: 1 },
        { file: "b.js", direction: "reverse", depth: 1 },
      ];

      const output = formatRelated(results, { direction: "both" });

      assert({
        given: "multiple results",
        should: "include result count",
        actual: output.includes("2 related file(s)"),
        expected: true,
      });
    });

    test("shows forward dependencies with imports label", () => {
      const results = [
        { file: "lib/utils.js", direction: "forward", depth: 1 },
      ];

      const output = formatRelated(results, { direction: "forward" });

      assert({
        given: "forward dependencies",
        should: "show Dependencies (imports) header",
        actual: output.includes("Dependencies (imports)"),
        expected: true,
      });
    });

    test("shows reverse dependencies with imported by label", () => {
      const results = [{ file: "src/app.js", direction: "reverse", depth: 1 }];

      const output = formatRelated(results, { direction: "reverse" });

      assert({
        given: "reverse dependencies",
        should: "show Dependents (imported by) header",
        actual: output.includes("Dependents (imported by)"),
        expected: true,
      });
    });

    test("includes file path in forward results", () => {
      const results = [
        { file: "lib/helpers.js", direction: "forward", depth: 1 },
      ];

      const output = formatRelated(results, { direction: "forward" });

      assert({
        given: "forward dependency",
        should: "include the file path",
        actual: output.includes("lib/helpers.js"),
        expected: true,
      });
    });

    test("includes file path in reverse results", () => {
      const results = [{ file: "src/main.js", direction: "reverse", depth: 1 }];

      const output = formatRelated(results, { direction: "reverse" });

      assert({
        given: "reverse dependency",
        should: "include the file path",
        actual: output.includes("src/main.js"),
        expected: true,
      });
    });

    test("includes depth information in output", () => {
      const results = [{ file: "deep.js", direction: "forward", depth: 3 }];

      const output = formatRelated(results, { direction: "forward" });

      assert({
        given: "result with depth",
        should: "include depth in output",
        actual: output.includes("depth: 3"),
        expected: true,
      });
    });

    test("uses arrow indicator for forward deps", () => {
      const results = [{ file: "dep.js", direction: "forward", depth: 1 }];

      const output = formatRelated(results, { direction: "forward" });

      assert({
        given: "forward dependency",
        should: "use right arrow indicator",
        actual: output.includes("→"),
        expected: true,
      });
    });

    test("uses arrow indicator for reverse deps", () => {
      const results = [{ file: "consumer.js", direction: "reverse", depth: 1 }];

      const output = formatRelated(results, { direction: "reverse" });

      assert({
        given: "reverse dependency",
        should: "use left arrow indicator",
        actual: output.includes("←"),
        expected: true,
      });
    });

    test("shows both sections when direction is both", () => {
      const results = [
        { file: "forward.js", direction: "forward", depth: 1 },
        { file: "reverse.js", direction: "reverse", depth: 1 },
      ];

      const output = formatRelated(results, { direction: "both" });

      assert({
        given: "both forward and reverse results",
        should: "show both sections",
        actual:
          output.includes("Dependencies (imports)") &&
          output.includes("Dependents (imported by)"),
        expected: true,
      });
    });

    test("only shows forward section when direction is forward", () => {
      const results = [
        { file: "forward.js", direction: "forward", depth: 1 },
        { file: "reverse.js", direction: "reverse", depth: 1 },
      ];

      const output = formatRelated(results, { direction: "forward" });

      assert({
        given: "direction forward with mixed results",
        should: "only show forward section",
        actual:
          output.includes("Dependencies (imports)") &&
          !output.includes("Dependents (imported by)"),
        expected: true,
      });
    });

    test("only shows reverse section when direction is reverse", () => {
      const results = [
        { file: "forward.js", direction: "forward", depth: 1 },
        { file: "reverse.js", direction: "reverse", depth: 1 },
      ];

      const output = formatRelated(results, { direction: "reverse" });

      assert({
        given: "direction reverse with mixed results",
        should: "only show reverse section",
        actual:
          !output.includes("Dependencies (imports)") &&
          output.includes("Dependents (imported by)"),
        expected: true,
      });
    });

    test("indents based on depth level", () => {
      const results = [
        { file: "depth1.js", direction: "forward", depth: 1 },
        { file: "depth2.js", direction: "forward", depth: 2 },
      ];

      const output = formatRelated(results, { direction: "forward" });
      const lines = output.split("\n");
      const depth1Line = lines.find((l) => l.includes("depth1.js"));
      const depth2Line = lines.find((l) => l.includes("depth2.js"));

      assert({
        given: "results with different depths",
        should: "have more indentation for deeper results",
        actual: depth2Line.indexOf("→") > depth1Line.indexOf("→"),
        expected: true,
      });
    });

    test("handles empty forward results with both direction", () => {
      const results = [{ file: "reverse.js", direction: "reverse", depth: 1 }];

      const output = formatRelated(results, { direction: "both" });

      assert({
        given: "only reverse results with both direction",
        should: "not show forward section",
        actual: output.includes("Dependencies (imports)"),
        expected: false,
      });
    });

    test("handles empty reverse results with both direction", () => {
      const results = [{ file: "forward.js", direction: "forward", depth: 1 }];

      const output = formatRelated(results, { direction: "both" });

      assert({
        given: "only forward results with both direction",
        should: "not show reverse section",
        actual: output.includes("Dependents (imported by)"),
        expected: false,
      });
    });

    test("returns JSON for empty results with json option", () => {
      const output = formatRelated([], { json: true, direction: "both" });
      const parsed = JSON.parse(output);

      assert({
        given: "empty results with json option",
        should: "return empty JSON array",
        actual: parsed,
        expected: [],
      });
    });

    test("handles multiple forward dependencies at same depth", () => {
      const results = [
        { file: "a.js", direction: "forward", depth: 1 },
        { file: "b.js", direction: "forward", depth: 1 },
        { file: "c.js", direction: "forward", depth: 1 },
      ];

      const output = formatRelated(results, { direction: "forward" });

      assert({
        given: "multiple forward deps at same depth",
        should: "include all files",
        actual:
          output.includes("a.js") &&
          output.includes("b.js") &&
          output.includes("c.js"),
        expected: true,
      });
    });

    test("handles deep nesting with correct indentation", () => {
      const results = [{ file: "level5.js", direction: "forward", depth: 5 }];

      const output = formatRelated(results, { direction: "forward" });

      assert({
        given: "deeply nested dependency",
        should: "show depth 5 in output",
        actual: output.includes("depth: 5"),
        expected: true,
      });
    });
  });
});
