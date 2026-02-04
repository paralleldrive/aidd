import { describe, test } from "vitest";
import { assert } from "riteway/vitest";

import { formatResults } from "./query-cli.js";

describe("cli/query-cli", () => {
  describe("formatResults", () => {
    test("returns JSON when json option is true", () => {
      const results = [{ path: "test.md", type: "rule", frontmatter: {} }];

      const output = formatResults(results, { json: true });
      const parsed = JSON.parse(output);

      assert({
        given: "results with json option",
        should: "return valid JSON string",
        actual: parsed.length,
        expected: 1,
      });
    });

    test("returns formatted JSON with indentation", () => {
      const results = [{ path: "test.md", type: "rule", frontmatter: {} }];

      const output = formatResults(results, { json: true });

      assert({
        given: "json option",
        should: "return pretty-printed JSON",
        actual: output.includes("\n"),
        expected: true,
      });
    });

    test("returns no results message for empty array", () => {
      const output = formatResults([], {});

      assert({
        given: "empty results",
        should: "return no results message",
        actual: output.includes("No results found"),
        expected: true,
      });
    });

    test("includes result count in output", () => {
      const results = [
        { path: "test1.md", type: "rule", frontmatter: {} },
        { path: "test2.md", type: "rule", frontmatter: {} },
      ];

      const output = formatResults(results, {});

      assert({
        given: "multiple results",
        should: "include result count",
        actual: output.includes("2 result(s)"),
        expected: true,
      });
    });

    test("includes file path in output", () => {
      const results = [
        { path: "ai/rules/auth.mdc", type: "rule", frontmatter: {} },
      ];

      const output = formatResults(results, {});

      assert({
        given: "result with path",
        should: "include the file path",
        actual: output.includes("ai/rules/auth.mdc"),
        expected: true,
      });
    });

    test("includes document type in output", () => {
      const results = [{ path: "test.md", type: "command", frontmatter: {} }];

      const output = formatResults(results, {});

      assert({
        given: "result with type",
        should: "include the document type",
        actual: output.includes("Type: command"),
        expected: true,
      });
    });

    test("includes relevance score when present", () => {
      const results = [
        {
          path: "test.md",
          type: "rule",
          frontmatter: {},
          relevanceScore: 0.8567,
        },
      ];

      const output = formatResults(results, {});

      assert({
        given: "result with relevance score",
        should: "include formatted score",
        actual: output.includes("Score: 0.857"),
        expected: true,
      });
    });

    test("includes description from frontmatter when present", () => {
      const results = [
        {
          path: "test.md",
          type: "rule",
          frontmatter: { description: "Authentication rules" },
        },
      ];

      const output = formatResults(results, {});

      assert({
        given: "result with frontmatter description",
        should: "include the description",
        actual: output.includes("Authentication rules"),
        expected: true,
      });
    });

    test("includes snippet when snippets option is true", () => {
      const results = [
        {
          path: "test.md",
          type: "rule",
          frontmatter: {},
          snippet: "This is the content snippet from the file",
        },
      ];

      const output = formatResults(results, { snippets: true });

      assert({
        given: "result with snippet and snippets option",
        should: "include the snippet",
        actual: output.includes("content snippet"),
        expected: true,
      });
    });

    test("excludes snippet when snippets option is false", () => {
      const results = [
        {
          path: "test.md",
          type: "rule",
          frontmatter: {},
          snippet: "This is the content snippet",
        },
      ];

      const output = formatResults(results, { snippets: false });

      assert({
        given: "result with snippet but snippets option false",
        should: "not include the snippet",
        actual: output.includes("content snippet"),
        expected: false,
      });
    });

    test("truncates long snippets to 100 characters", () => {
      const longSnippet = "a".repeat(200);
      const results = [
        {
          path: "test.md",
          type: "rule",
          frontmatter: {},
          snippet: longSnippet,
        },
      ];

      const output = formatResults(results, { snippets: true });

      assert({
        given: "result with long snippet",
        should: "truncate snippet content",
        actual:
          output.includes("a".repeat(100)) && !output.includes("a".repeat(101)),
        expected: true,
      });
    });

    test("handles results without relevance score", () => {
      const results = [{ path: "test.md", type: "rule", frontmatter: {} }];

      const output = formatResults(results, {});

      assert({
        given: "result without relevance score",
        should: "not include Score line",
        actual: output.includes("Score:"),
        expected: false,
      });
    });

    test("handles results without frontmatter description", () => {
      const results = [{ path: "test.md", type: "rule", frontmatter: {} }];

      const output = formatResults(results, {});

      assert({
        given: "result without description",
        should: "still format successfully",
        actual: output.includes("test.md"),
        expected: true,
      });
    });

    test("handles null frontmatter gracefully", () => {
      const results = [{ path: "test.md", type: "rule", frontmatter: null }];

      const output = formatResults(results, {});

      assert({
        given: "result with null frontmatter",
        should: "format without error",
        actual: output.includes("test.md"),
        expected: true,
      });
    });

    test("formats multiple results with correct spacing", () => {
      const results = [
        { path: "file1.md", type: "rule", frontmatter: {} },
        { path: "file2.md", type: "command", frontmatter: {} },
      ];

      const output = formatResults(results, {});

      assert({
        given: "multiple results",
        should: "include both files",
        actual: output.includes("file1.md") && output.includes("file2.md"),
        expected: true,
      });
    });

    test("returns JSON for empty results with json option", () => {
      const output = formatResults([], { json: true });
      const parsed = JSON.parse(output);

      assert({
        given: "empty results with json option",
        should: "return empty JSON array",
        actual: parsed,
        expected: [],
      });
    });
  });
});
