import { assert } from "riteway/vitest";
import { describe, test } from "vitest";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { parseFrontmatter } from "../../../../lib/index-generator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("user-testing", () => {
  describe("user-testing.md reference", () => {
    test("file exists", async () => {
      const filePath = path.join(__dirname, "user-testing.md");
      const exists = await fs.pathExists(filePath);

      assert({
        given: "user-testing.md file",
        should: "exist in references directory",
        actual: exists,
        expected: true,
      });
    });

    test("includes HumanScript and AgentScript templates", async () => {
      const filePath = path.join(__dirname, "user-testing.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "user-testing.md content",
        should: "include HumanScript template",
        actual: content.includes("HumanScript:template"),
        expected: true,
      });

      assert({
        given: "user-testing.md content",
        should: "include AgentScript template",
        actual: content.includes("AgentScript:template"),
        expected: true,
      });
    });
  });

  describe("user-test.md skill", () => {
    test("skill file exists", async () => {
      const filePath = path.join(
        __dirname,
        "../../../../ai/skills/aidd/user-test.md",
      );
      const exists = await fs.pathExists(filePath);

      assert({
        given: "user-test.md skill file",
        should: "exist in ai/skills/aidd directory",
        actual: exists,
        expected: true,
      });
    });

    test("references user-testing.md", async () => {
      const filePath = path.join(
        __dirname,
        "../../../../ai/skills/aidd/user-test.md",
      );
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "user-test.md content",
        should: "reference user-testing.md",
        actual: content.includes("user-testing.md"),
        expected: true,
      });
    });
  });

  describe("run-test.md skill", () => {
    test("skill file exists", async () => {
      const filePath = path.join(
        __dirname,
        "../../../../ai/skills/aidd/run-test.md",
      );
      const exists = await fs.pathExists(filePath);

      assert({
        given: "run-test.md skill file",
        should: "exist in ai/skills/aidd directory",
        actual: exists,
        expected: true,
      });
    });

    test("references user-testing.md", async () => {
      const filePath = path.join(
        __dirname,
        "../../../../ai/skills/aidd/run-test.md",
      );
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "run-test.md content",
        should: "reference user-testing.md",
        actual: content.includes("user-testing.md"),
        expected: true,
      });
    });
  });

  describe("documentation", () => {
    test("user testing guide exists", async () => {
      const filePath = path.join(__dirname, "../../../../docs/user-testing.md");
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
      const filePath = path.join(__dirname, "../../../../README.md");
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
