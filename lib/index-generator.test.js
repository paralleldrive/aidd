// @ts-check
import os from "os";
import path from "path";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test } from "vitest";

import {
  extractTitle,
  generateAllIndexes,
  generateIndexContent,
  generateSkillEntry,
  generateSkillsIndexContent,
  getIndexableFiles,
  getSubdirectories,
  isSkillsDirectory,
  parseFrontmatter,
} from "./index-generator.js";

describe("index-generator", () => {
  let tempDir = "";

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
        actual: result?.description,
        expected: "Test description",
      });

      assert({
        given: "content with globs field",
        should: "parse globs correctly",
        actual: result?.globs,
        expected: "**/*.js",
      });

      assert({
        given: "content with boolean field",
        should: "parse boolean as boolean type",
        actual: result?.alwaysApply,
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
        actual: result?.alwaysApply,
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

  describe("isSkillsDirectory", () => {
    test("returns true when subdirs contain SKILL.md", async () => {
      const skillDir = path.join(tempDir, "my-skill");
      await fs.ensureDir(skillDir);
      await fs.writeFile(
        path.join(skillDir, "SKILL.md"),
        "---\nname: my-skill\ndescription: A skill\n---\n# My Skill",
      );

      assert({
        given: "directory with a subdirectory containing SKILL.md",
        should: "return true",
        actual: await isSkillsDirectory(tempDir),
        expected: true,
      });
    });

    test("returns false when no subdirs contain SKILL.md", async () => {
      await fs.ensureDir(path.join(tempDir, "subdir"));
      await fs.writeFile(path.join(tempDir, "subdir", "README.md"), "# Hi");

      assert({
        given: "directory with subdirectory but no SKILL.md",
        should: "return false",
        actual: await isSkillsDirectory(tempDir),
        expected: false,
      });
    });

    test("returns false for empty directory", async () => {
      assert({
        given: "empty directory",
        should: "return false",
        actual: await isSkillsDirectory(tempDir),
        expected: false,
      });
    });
  });

  describe("generateSkillEntry", () => {
    test("generates bullet from SKILL.md frontmatter", async () => {
      const skillDir = path.join(tempDir, "aidd-test");
      await fs.ensureDir(skillDir);
      await fs.writeFile(
        path.join(skillDir, "SKILL.md"),
        "---\nname: aidd-test\ndescription: A test skill for testing.\n---\n# Test",
      );

      const entry = await generateSkillEntry(tempDir, "aidd-test");

      assert({
        given: "skill with name and description in frontmatter",
        should: "return bullet with name and description",
        actual: entry,
        expected: "- aidd-test - A test skill for testing.\n",
      });
    });

    test("returns null when no SKILL.md exists", async () => {
      await fs.ensureDir(path.join(tempDir, "not-a-skill"));

      assert({
        given: "subdirectory without SKILL.md",
        should: "return null",
        actual: await generateSkillEntry(tempDir, "not-a-skill"),
        expected: null,
      });
    });

    test("falls back to dir name when no name in frontmatter", async () => {
      const skillDir = path.join(tempDir, "aidd-fallback");
      await fs.ensureDir(skillDir);
      await fs.writeFile(
        path.join(skillDir, "SKILL.md"),
        "---\ndescription: Fallback skill\n---\n# Fallback",
      );

      const entry = await generateSkillEntry(tempDir, "aidd-fallback");

      assert({
        given: "skill without name in frontmatter",
        should: "use directory name",
        actual: entry,
        expected: "- aidd-fallback - Fallback skill\n",
      });
    });

    test("marks missing description", async () => {
      const skillDir = path.join(tempDir, "aidd-nodesc");
      await fs.ensureDir(skillDir);
      await fs.writeFile(
        path.join(skillDir, "SKILL.md"),
        "---\nname: aidd-nodesc\n---\n# No Desc",
      );

      const entry = await generateSkillEntry(tempDir, "aidd-nodesc");

      assert({
        given: "skill without description",
        should: "include no description marker",
        actual: entry,
        expected: "- aidd-nodesc - *No description available*\n",
      });
    });
  });

  describe("generateSkillsIndexContent", () => {
    test("generates bullet list for skills directory", async () => {
      const skill1 = path.join(tempDir, "aidd-alpha");
      const skill2 = path.join(tempDir, "aidd-beta");
      await fs.ensureDir(skill1);
      await fs.ensureDir(skill2);
      await fs.writeFile(
        path.join(skill1, "SKILL.md"),
        "---\nname: aidd-alpha\ndescription: Alpha skill\n---\n# Alpha",
      );
      await fs.writeFile(
        path.join(skill2, "SKILL.md"),
        "---\nname: aidd-beta\ndescription: Beta skill\n---\n# Beta",
      );

      const content = await generateSkillsIndexContent(tempDir);

      assert({
        given: "skills directory with two skills",
        should: "include Skills Index heading",
        actual: content.includes("## Skills Index"),
        expected: true,
      });

      assert({
        given: "skills directory with two skills",
        should: "include alpha bullet",
        actual: content.includes("- aidd-alpha - Alpha skill"),
        expected: true,
      });

      assert({
        given: "skills directory with two skills",
        should: "include beta bullet",
        actual: content.includes("- aidd-beta - Beta skill"),
        expected: true,
      });
    });

    test("handles empty skills directory", async () => {
      const content = await generateSkillsIndexContent(tempDir);

      assert({
        given: "empty skills directory",
        should: "show no skills available",
        actual: content.includes("*No skills available.*"),
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

    test("includes subdirectory references", async () => {
      await fs.ensureDir(path.join(tempDir, "subcommands"));

      const content = await generateIndexContent(tempDir);

      assert({
        given: "directory with subdirectory",
        should: "include subdirectory reference",
        actual: content.includes("subcommands/index.md"),
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

    test("uses skills format for directories containing skills", async () => {
      const skillDir = path.join(tempDir, "my-skill");
      await fs.ensureDir(skillDir);
      await fs.writeFile(
        path.join(skillDir, "SKILL.md"),
        "---\nname: my-skill\ndescription: Does things\n---\n# My Skill",
      );

      const content = await generateIndexContent(tempDir);

      assert({
        given: "directory containing skill subdirectories",
        should: "use bullet format",
        actual: content.includes("- my-skill - Does things"),
        expected: true,
      });

      assert({
        given: "directory containing skill subdirectories",
        should: "not use verbose subdirectory format",
        actual: content.includes("📁"),
        expected: false,
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

      assert({
        given: "directory without ai/ folder",
        should: "return error as object with message property",
        actual: typeof result.error,
        expected: "object",
      });

      assert({
        given: "directory without ai/ folder",
        should: "include the missing directory path in error message",
        actual: typeof result.error?.message,
        expected: "string",
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

    test("does not recurse into skill subdirectories", async () => {
      const aiPath = path.join(tempDir, "ai");
      const skillsPath = path.join(aiPath, "skills");
      const skillDir = path.join(skillsPath, "aidd-test");
      await fs.ensureDir(skillDir);
      await fs.writeFile(
        path.join(skillDir, "SKILL.md"),
        "---\nname: aidd-test\ndescription: Test skill\n---\n# Test",
      );
      await fs.writeFile(path.join(skillDir, "README.md"), "# Test README");

      const result = await generateAllIndexes(tempDir);

      assert({
        given: "ai/skills/ with skill subdirectories",
        should: "generate indexes for ai/ and ai/skills/ only",
        actual: result.indexes.length,
        expected: 2, // ai/ and ai/skills/
      });

      const skillIndexExists = await fs.pathExists(
        path.join(skillDir, "index.md"),
      );

      assert({
        given: "skill subdirectory",
        should: "not generate index.md inside it",
        actual: skillIndexExists,
        expected: false,
      });
    });

    test("also indexes aidd-custom/ when it exists", async () => {
      const aiPath = path.join(tempDir, "ai");
      await fs.ensureDir(aiPath);
      await fs.writeFile(
        path.join(aiPath, "readme.md"),
        "---\ndescription: AI readme\n---\n# AI",
      );

      const customPath = path.join(tempDir, "aidd-custom");
      await fs.ensureDir(customPath);
      await fs.writeFile(
        path.join(customPath, "config.yml"),
        "e2eBeforeCommit: false\n",
      );
      await fs.writeFile(
        path.join(customPath, "my-skill.md"),
        "---\ndescription: A custom skill\n---\n# My Skill",
      );

      const result = await generateAllIndexes(tempDir);

      assert({
        given: "ai/ and aidd-custom/ both exist",
        should: "succeed",
        actual: result.success,
        expected: true,
      });

      const customIndexExists = await fs.pathExists(
        path.join(customPath, "index.md"),
      );

      assert({
        given: "aidd-custom/ with files",
        should: "create aidd-custom/index.md",
        actual: customIndexExists,
        expected: true,
      });

      const customIndexContent = await fs.readFile(
        path.join(customPath, "index.md"),
        "utf-8",
      );

      assert({
        given: "aidd-custom/index.md",
        should: "include custom skill description",
        actual: customIndexContent.includes("A custom skill"),
        expected: true,
      });
    });

    test("scaffolds aidd-custom/skills/ directory", async () => {
      const aiPath = path.join(tempDir, "ai");
      await fs.ensureDir(aiPath);

      const customPath = path.join(tempDir, "aidd-custom");
      await fs.ensureDir(customPath);

      await generateAllIndexes(tempDir);

      const customSkillsExists = await fs.pathExists(
        path.join(customPath, "skills"),
      );

      assert({
        given: "aidd-custom/ exists without skills/",
        should: "scaffold aidd-custom/skills/ directory",
        actual: customSkillsExists,
        expected: true,
      });

      const skillsIndexContent = await fs.readFile(
        path.join(customPath, "skills", "index.md"),
        "utf-8",
      );

      assert({
        given: "scaffolded aidd-custom/skills/",
        should: "generate empty skills index",
        actual: skillsIndexContent.includes("*No skills available.*"),
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
