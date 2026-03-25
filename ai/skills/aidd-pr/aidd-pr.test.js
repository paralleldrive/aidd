// @ts-check
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { parseFrontmatter } from "../../../lib/index-generator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("aidd-pr skill", () => {
  describe("SKILL.md", () => {
    test("file exists", async () => {
      const filePath = path.join(__dirname, "./SKILL.md");
      const exists = await fs.pathExists(filePath);

      assert({
        given: "aidd-pr SKILL.md file",
        should: "exist in ai/skills/aidd-pr directory",
        actual: exists,
        expected: true,
      });
    });

    test("has valid frontmatter with required fields", async () => {
      const filePath = path.join(__dirname, "./SKILL.md");
      const content = await fs.readFile(filePath, "utf-8");
      const frontmatter = parseFrontmatter(content);

      assert({
        given: "aidd-pr frontmatter",
        should: "have a name field",
        actual: frontmatter?.name,
        expected: "aidd-pr",
      });

      assert({
        given: "aidd-pr frontmatter",
        should: "have a description field",
        actual: typeof frontmatter?.description,
        expected: "string",
      });

      assert({
        given: "aidd-pr frontmatter",
        should: "have a compatibility field",
        actual: typeof frontmatter?.compatibility,
        expected: "string",
      });
    });

    test("description follows Use-when format", async () => {
      const filePath = path.join(__dirname, "./SKILL.md");
      const content = await fs.readFile(filePath, "utf-8");
      const frontmatter = parseFrontmatter(content);

      assert({
        given: "aidd-pr description",
        should: "include 'Use when' trigger clause",
        actual: frontmatter?.description.includes("Use when"),
        expected: true,
      });
    });

    test("includes role preamble", async () => {
      const filePath = path.join(__dirname, "./SKILL.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "aidd-pr SKILL.md",
        should: "include Act as preamble",
        actual: content.includes("Act as"),
        expected: true,
      });
    });

    test("includes Competencies block", async () => {
      const filePath = path.join(__dirname, "./SKILL.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "aidd-pr SKILL.md",
        should: "include Competencies block",
        actual: content.includes("Competencies {"),
        expected: true,
      });
    });

    test("includes Constraints block with delegation rule", async () => {
      const filePath = path.join(__dirname, "./SKILL.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "aidd-pr SKILL.md",
        should: "include Constraints block",
        actual: content.includes("Constraints {"),
        expected: true,
      });

      assert({
        given: "aidd-pr Constraints",
        should: "include delegation constraint",
        actual: content.includes("attention dilution"),
        expected: true,
      });
    });

    test("includes verbatim prompt body", async () => {
      const filePath = path.join(__dirname, "./SKILL.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "aidd-pr SKILL.md",
        should: "include verbatim prompt opening",
        actual: content.includes("Given the following PR:"),
        expected: true,
      });

      assert({
        given: "aidd-pr SKILL.md",
        should: "instruct use of gh to identify addressed comments",
        actual: content.includes(
          "Use `gh` to identify comments that have already been addressed",
        ),
        expected: true,
      });

      assert({
        given: "aidd-pr SKILL.md",
        should: "instruct delegation prompts to start with /aidd-fix",
        actual: content.includes(
          "start the delegation prompt with `/aidd-fix`",
        ),
        expected: true,
      });
    });

    test("includes both commands", async () => {
      const filePath = path.join(__dirname, "./SKILL.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "aidd-pr SKILL.md",
        should: "include /aidd-pr [PR URL] command",
        actual: content.includes("/aidd-pr [PR URL]"),
        expected: true,
      });

      assert({
        given: "aidd-pr SKILL.md",
        should: "include /aidd-pr delegate command",
        actual: content.includes("/aidd-pr delegate"),
        expected: true,
      });
    });
  });

  describe("aidd-pr.md command", () => {
    test("file exists", async () => {
      const filePath = path.join(__dirname, "../../commands/aidd-pr.md");
      const exists = await fs.pathExists(filePath);

      assert({
        given: "aidd-pr.md command file",
        should: "exist in ai/commands directory",
        actual: exists,
        expected: true,
      });
    });

    test("references the skill", async () => {
      const filePath = path.join(__dirname, "../../commands/aidd-pr.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "aidd-pr.md command",
        should: "reference aidd-pr skill",
        actual: content.includes("aidd-pr/SKILL.md"),
        expected: true,
      });
    });
  });

  describe("aidd-please discovery", () => {
    test("/aidd-pr is listed in aidd-please Commands", async () => {
      const filePath = path.join(__dirname, "../aidd-please/SKILL.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "aidd-please Commands block",
        should: "list /aidd-pr for discoverability",
        actual: content.includes("/aidd-pr"),
        expected: true,
      });
    });
  });
});
