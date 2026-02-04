import { assert } from "riteway/vitest";
import { describe, test, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs-extra";
import os from "os";

import {
  generateAllIndexes,
  generateIndexContent,
  hasIndexableContent,
  parseFrontmatter,
  extractTitle,
  getIndexableFiles,
  getSubdirectories,
} from "./index-generator.js";

describe("index-generator", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-index-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe("parseFrontmatter", () => {
    test("parses valid frontmatter", () => {
      const content = `---
description: Test description
globs: "**/*.js"
alwaysApply: true
---
# Content`;

      const result = parseFrontmatter(content);

      assert({
        given: "content with valid frontmatter",
        should: "return parsed frontmatter object",
        actual: result.description,
        expected: "Test description",
      });

      assert({
        given: "content with globs field",
        should: "parse globs correctly",
        actual: result.globs,
        expected: "**/*.js",
      });

      assert({
        given: "content with boolean field",
        should: "parse boolean as boolean type",
        actual: result.alwaysApply,
        expected: true,
      });
    });

    test("returns null for content without frontmatter", () => {
      const content = "# Just a heading\n\nSome content.";

      assert({
        given: "content without frontmatter",
        should: "return null",
        actual: parseFrontmatter(content),
        expected: null,
      });
    });

    test("handles false boolean value", () => {
      const content = `---
alwaysApply: false
---
# Content`;

      const result = parseFrontmatter(content);

      assert({
        given: "content with false boolean",
        should: "parse as false boolean",
        actual: result.alwaysApply,
        expected: false,
      });
    });
  });

  describe("extractTitle", () => {
    test("extracts title from markdown heading", () => {
      const content = "---\ndescription: test\n---\n# My Title\n\nContent";

      assert({
        given: "content with markdown heading",
        should: "extract the heading as title",
        actual: extractTitle(content, "file.md"),
        expected: "My Title",
      });
    });

    test("uses filename when no heading found", () => {
      const content = "Just some content without headings.";

      assert({
        given: "content without heading",
        should: "use filename as title",
        actual: extractTitle(content, "my-file.mdc"),
        expected: "my-file",
      });
    });
  });

  describe("getIndexableFiles", () => {
    test("returns only .md and .mdc files", async () => {
      await fs.writeFile(path.join(tempDir, "file1.md"), "# Test");
      await fs.writeFile(path.join(tempDir, "file2.mdc"), "# Test");
      await fs.writeFile(path.join(tempDir, "file3.js"), "// js");
      await fs.writeFile(path.join(tempDir, "file4.txt"), "text");

      const files = await getIndexableFiles(tempDir);

      assert({
        given: "directory with mixed file types",
        should: "return only .md and .mdc files",
        actual: files,
        expected: ["file1.md", "file2.mdc"],
      });
    });

    test("excludes index.md from results", async () => {
      await fs.writeFile(path.join(tempDir, "index.md"), "# Index");
      await fs.writeFile(path.join(tempDir, "other.md"), "# Other");

      const files = await getIndexableFiles(tempDir);

      assert({
        given: "directory with index.md",
        should: "exclude index.md from results",
        actual: files,
        expected: ["other.md"],
      });
    });
  });

  describe("getSubdirectories", () => {
    test("returns only directories", async () => {
      await fs.ensureDir(path.join(tempDir, "subdir1"));
      await fs.ensureDir(path.join(tempDir, "subdir2"));
      await fs.writeFile(path.join(tempDir, "file.md"), "# Test");

      const dirs = await getSubdirectories(tempDir);

      assert({
        given: "directory with mixed items",
        should: "return only subdirectories",
        actual: dirs,
        expected: ["subdir1", "subdir2"],
      });
    });
  });

  describe("hasIndexableContent", () => {
    test("returns true for directory with markdown files", async () => {
      await fs.writeFile(path.join(tempDir, "doc.md"), "# Doc");

      assert({
        given: "directory with markdown file",
        should: "return true",
        actual: await hasIndexableContent(tempDir),
        expected: true,
      });
    });

    test("returns false for empty directory", async () => {
      assert({
        given: "empty directory",
        should: "return false",
        actual: await hasIndexableContent(tempDir),
        expected: false,
      });
    });

    test("returns false for directory with only non-markdown files", async () => {
      await fs.writeFile(path.join(tempDir, "script.js"), "// js");
      await fs.writeFile(path.join(tempDir, "data.json"), "{}");

      assert({
        given: "directory with only non-markdown files",
        should: "return false",
        actual: await hasIndexableContent(tempDir),
        expected: false,
      });
    });

    test("returns false for nested empty subdirectories", async () => {
      await fs.ensureDir(path.join(tempDir, "a", "b", "c"));
      await fs.ensureDir(path.join(tempDir, "x", "y"));

      assert({
        given: "directory with only nested empty subdirectories",
        should: "return false",
        actual: await hasIndexableContent(tempDir),
        expected: false,
      });
    });

    test("returns true when deeply nested subdirectory has markdown", async () => {
      await fs.ensureDir(path.join(tempDir, "a", "b", "c"));
      await fs.writeFile(path.join(tempDir, "a", "b", "c", "doc.md"), "# Deep");

      assert({
        given: "directory with markdown in deeply nested subdirectory",
        should: "return true",
        actual: await hasIndexableContent(tempDir),
        expected: true,
      });
    });
  });

  describe("generateIndexContent", () => {
    test("generates index with file entries", async () => {
      const fileContent = `---
description: Test file description
---
# Test File

Content here.`;
      await fs.writeFile(path.join(tempDir, "test.md"), fileContent);

      const content = await generateIndexContent(tempDir);

      assert({
        given: "directory with a file with frontmatter",
        should: "include file description in index",
        actual: content.includes("Test file description"),
        expected: true,
      });
    });

    test("includes subdirectory references when subdirectory has content", async () => {
      await fs.ensureDir(path.join(tempDir, "subcommands"));
      await fs.writeFile(
        path.join(tempDir, "subcommands", "help.md"),
        "# Help",
      );

      const content = await generateIndexContent(tempDir);

      assert({
        given: "directory with subdirectory containing markdown",
        should: "include subdirectory reference",
        actual: content.includes("subcommands/index.md"),
        expected: true,
      });
    });

    test("excludes subdirectory references when subdirectory has no content", async () => {
      await fs.ensureDir(path.join(tempDir, "empty-subdir"));

      const content = await generateIndexContent(tempDir);

      assert({
        given: "directory with empty subdirectory",
        should: "not include subdirectory reference",
        actual: content.includes("empty-subdir/index.md"),
        expected: false,
      });
    });

    test("excludes subdirectory with only nested empty subdirectories", async () => {
      // Create a subdirectory that contains only more empty subdirectories
      // but no actual markdown files anywhere in the tree
      await fs.ensureDir(path.join(tempDir, "parent", "child1", "grandchild"));
      await fs.ensureDir(path.join(tempDir, "parent", "child2"));
      // Add a non-markdown file to prove it's not just checking for "any files"
      await fs.writeFile(
        path.join(tempDir, "parent", "child1", "readme.txt"),
        "not markdown",
      );

      const content = await generateIndexContent(tempDir);

      assert({
        given:
          "subdirectory with only nested empty directories and non-markdown files",
        should: "not include subdirectory reference",
        actual: content.includes("parent/index.md"),
        expected: false,
      });
    });

    test("includes subdirectory when nested child has markdown content", async () => {
      // Create nested structure where only the deepest level has markdown
      await fs.ensureDir(path.join(tempDir, "parent", "child", "grandchild"));
      await fs.writeFile(
        path.join(tempDir, "parent", "child", "grandchild", "doc.md"),
        "# Deep Document",
      );

      const content = await generateIndexContent(tempDir);

      assert({
        given: "subdirectory with markdown only in deeply nested child",
        should: "include subdirectory reference",
        actual: content.includes("parent/index.md"),
        expected: true,
      });
    });

    test("handles files without frontmatter", async () => {
      await fs.writeFile(
        path.join(tempDir, "plain.md"),
        "# Plain File\n\nNo frontmatter here.",
      );

      const content = await generateIndexContent(tempDir);

      assert({
        given: "file without frontmatter",
        should: "note no description available",
        actual: content.includes("No description available"),
        expected: true,
      });
    });
  });

  describe("generateAllIndexes", () => {
    test("returns error when ai/ directory does not exist", async () => {
      const result = await generateAllIndexes(tempDir);

      assert({
        given: "directory without ai/ folder",
        should: "return error result",
        actual: result.success,
        expected: false,
      });
    });

    test("generates index files recursively", async () => {
      // Create ai/ structure
      const aiPath = path.join(tempDir, "ai");
      await fs.ensureDir(path.join(aiPath, "commands"));
      await fs.ensureDir(path.join(aiPath, "rules"));

      await fs.writeFile(
        path.join(aiPath, "commands", "help.md"),
        "---\ndescription: Help command\n---\n# Help",
      );
      await fs.writeFile(
        path.join(aiPath, "rules", "tdd.mdc"),
        "---\ndescription: TDD rules\n---\n# TDD",
      );

      const result = await generateAllIndexes(tempDir);

      assert({
        given: "ai/ directory with subdirectories",
        should: "succeed",
        actual: result.success,
        expected: true,
      });

      assert({
        given: "ai/ directory with subdirectories",
        should: "generate multiple index files",
        actual: result.indexes.length,
        expected: 3, // ai/, ai/commands/, ai/rules/
      });

      // Verify index files exist
      const aiIndexExists = await fs.pathExists(path.join(aiPath, "index.md"));
      const commandsIndexExists = await fs.pathExists(
        path.join(aiPath, "commands", "index.md"),
      );

      assert({
        given: "successful generation",
        should: "create ai/index.md",
        actual: aiIndexExists,
        expected: true,
      });

      assert({
        given: "successful generation",
        should: "create ai/commands/index.md",
        actual: commandsIndexExists,
        expected: true,
      });
    });

    test("index content includes file descriptions", async () => {
      const aiPath = path.join(tempDir, "ai");
      await fs.ensureDir(path.join(aiPath, "rules"));

      await fs.writeFile(
        path.join(aiPath, "rules", "tdd.mdc"),
        `---
description: When implementing code changes, use TDD
globs: "**/*.js,**/*.ts"
alwaysApply: false
---
# TDD Engineer`,
      );

      await generateAllIndexes(tempDir);

      const indexContent = await fs.readFile(
        path.join(aiPath, "rules", "index.md"),
        "utf-8",
      );

      assert({
        given: "generated index",
        should: "include file description",
        actual: indexContent.includes(
          "When implementing code changes, use TDD",
        ),
        expected: true,
      });

      assert({
        given: "generated index",
        should: "include globs info",
        actual: indexContent.includes("**/*.js,**/*.ts"),
        expected: true,
      });
    });
  });
});
