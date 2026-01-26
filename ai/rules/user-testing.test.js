import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { parseFrontmatter } from "../../lib/index-generator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("user-testing", () => {
  describe("user-testing.mdc", () => {
    test("file exists with valid frontmatter", async () => {
      const filePath = path.join(__dirname, "user-testing.mdc");
      const exists = await fs.pathExists(filePath);

      assert({
        actual: exists,
        expected: true,
        given: "user-testing.mdc file",
        should: "exist in ai/rules directory",
      });

      const content = await fs.readFile(filePath, "utf-8");
      const frontmatter = parseFrontmatter(content);

      assert({
        actual: typeof frontmatter?.description,
        expected: "string",
        given: "user-testing.mdc frontmatter",
        should: "have description field",
      });

      assert({
        actual: frontmatter?.alwaysApply,
        expected: false,
        given: "user-testing.mdc frontmatter",
        should: "have alwaysApply set to false",
      });
    });

    test("includes HumanScript and AgentScript templates", async () => {
      const filePath = path.join(__dirname, "user-testing.mdc");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        actual: content.includes("HumanScript:template"),
        expected: true,
        given: "user-testing.mdc content",
        should: "include HumanScript template",
      });

      assert({
        actual: content.includes("AgentScript:template"),
        expected: true,
        given: "user-testing.mdc content",
        should: "include AgentScript template",
      });
    });
  });

  describe("user-test.md command", () => {
    test("command file exists", async () => {
      const filePath = path.join(__dirname, "../commands/user-test.md");
      const exists = await fs.pathExists(filePath);

      assert({
        actual: exists,
        expected: true,
        given: "user-test.md command file",
        should: "exist in ai/commands directory",
      });
    });

    test("references user-testing.mdc", async () => {
      const filePath = path.join(__dirname, "../commands/user-test.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        actual:
          content.includes("@user-testing.mdc") ||
          content.includes("user-testing.mdc"),
        expected: true,
        given: "user-test.md content",
        should: "reference user-testing.mdc",
      });
    });
  });

  describe("run-test.md command", () => {
    test("command file exists", async () => {
      const filePath = path.join(__dirname, "../commands/run-test.md");
      const exists = await fs.pathExists(filePath);

      assert({
        actual: exists,
        expected: true,
        given: "run-test.md command file",
        should: "exist in ai/commands directory",
      });
    });

    test("references user-testing.mdc", async () => {
      const filePath = path.join(__dirname, "../commands/run-test.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        actual:
          content.includes("@user-testing.mdc") ||
          content.includes("user-testing.mdc"),
        expected: true,
        given: "run-test.md content",
        should: "reference user-testing.mdc",
      });
    });
  });

  describe("documentation", () => {
    test("user testing guide exists", async () => {
      const filePath = path.join(__dirname, "../../docs/user-testing.md");
      const exists = await fs.pathExists(filePath);

      assert({
        actual: exists,
        expected: true,
        given: "user-testing.md documentation",
        should: "exist in docs directory",
      });
    });
  });

  describe("README integration", () => {
    test("README includes user-test command", async () => {
      const filePath = path.join(__dirname, "../../README.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        actual: content.includes("/user-test"),
        expected: true,
        given: "README.md content",
        should: "include /user-test in command list",
      });

      assert({
        actual: content.includes("docs/user-testing.md"),
        expected: true,
        given: "README.md content",
        should: "link to user testing documentation",
      });
    });
  });
});
