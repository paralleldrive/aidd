import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { parseFrontmatter } from "../../lib/index-generator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("user-testing", () => {
  describe("aidd-user-testing skill", () => {
    test("file exists with valid frontmatter", async () => {
      const filePath = path.join(
        __dirname,
        "../skills/aidd-user-testing/SKILL.md",
      );
      const exists = await fs.pathExists(filePath);

      assert({
        given: "aidd-user-testing SKILL.md file",
        should: "exist in ai/skills directory",
        actual: exists,
        expected: true,
      });

      const content = await fs.readFile(filePath, "utf-8");
      const frontmatter = parseFrontmatter(content);

      assert({
        given: "aidd-user-testing frontmatter",
        should: "have description field",
        actual: typeof frontmatter?.description,
        expected: "string",
      });

      assert({
        given: "aidd-user-testing frontmatter",
        should: "have name field matching directory",
        actual: frontmatter?.name,
        expected: "aidd-user-testing",
      });
    });

    test("includes HumanScript and AgentScript templates", async () => {
      const filePath = path.join(
        __dirname,
        "../skills/aidd-user-testing/SKILL.md",
      );
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "aidd-user-testing content",
        should: "include HumanScript template",
        actual: content.includes("HumanScript:template"),
        expected: true,
      });

      assert({
        given: "aidd-user-testing content",
        should: "include AgentScript template",
        actual: content.includes("AgentScript:template"),
        expected: true,
      });
    });
  });

  describe("user-test.md command", () => {
    test("command file exists", async () => {
      const filePath = path.join(__dirname, "../commands/user-test.md");
      const exists = await fs.pathExists(filePath);

      assert({
        given: "user-test.md command file",
        should: "exist in ai/commands directory",
        actual: exists,
        expected: true,
      });
    });

    test("references user-testing skill", async () => {
      const filePath = path.join(__dirname, "../commands/user-test.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "user-test.md content",
        should: "reference user-testing skill",
        actual: content.includes("aidd-user-testing"),
        expected: true,
      });
    });
  });

  describe("run-test.md command", () => {
    test("command file exists", async () => {
      const filePath = path.join(__dirname, "../commands/run-test.md");
      const exists = await fs.pathExists(filePath);

      assert({
        given: "run-test.md command file",
        should: "exist in ai/commands directory",
        actual: exists,
        expected: true,
      });
    });

    test("references user-testing skill", async () => {
      const filePath = path.join(__dirname, "../commands/run-test.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "run-test.md content",
        should: "reference user-testing skill",
        actual: content.includes("aidd-user-testing"),
        expected: true,
      });
    });
  });

  describe("documentation", () => {
    test("user testing guide exists", async () => {
      const filePath = path.join(__dirname, "../../docs/user-testing.md");
      const exists = await fs.pathExists(filePath);

      assert({
        given: "user-testing.md documentation",
        should: "exist in docs directory",
        actual: exists,
        expected: true,
      });
    });
  });

  describe("README integration", () => {
    test("README includes user-test command", async () => {
      const filePath = path.join(__dirname, "../../README.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "README.md content",
        should: "include /user-test in command list",
        actual: content.includes("/user-test"),
        expected: true,
      });

      assert({
        given: "README.md content",
        should: "link to user testing documentation",
        actual: content.includes("docs/user-testing.md"),
        expected: true,
      });
    });
  });
});
