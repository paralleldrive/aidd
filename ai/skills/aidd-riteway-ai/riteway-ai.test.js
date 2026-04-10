import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { parseFrontmatter } from "../../../lib/index-generator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("aidd-riteway-ai", () => {
  describe("SKILL.md", () => {
    test("file exists with valid frontmatter", async () => {
      const filePath = path.join(__dirname, "./SKILL.md");
      const exists = await fs.pathExists(filePath);

      assert({
        given: "aidd-riteway-ai SKILL.md file",
        should: "exist in ai/skills directory",
        actual: exists,
        expected: true,
      });

      const content = await fs.readFile(filePath, "utf-8");
      const frontmatter = parseFrontmatter(content);

      assert({
        given: "aidd-riteway-ai frontmatter",
        should: "have name field matching directory",
        actual: frontmatter?.name,
        expected: "aidd-riteway-ai",
      });

      assert({
        given: "aidd-riteway-ai frontmatter",
        should: "have description field",
        actual: typeof frontmatter?.description,
        expected: "string",
      });

      assert({
        given: "aidd-riteway-ai frontmatter description",
        should: "include a Use when clause",
        actual: frontmatter?.description?.includes("Use when"),
        expected: true,
      });
    });

    test("references /aidd-tdd and /aidd-functional-requirements", async () => {
      const filePath = path.join(__dirname, "./SKILL.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "aidd-riteway-ai SKILL.md content",
        should: "reference /aidd-tdd",
        actual: content.includes("/aidd-tdd"),
        expected: true,
      });

      assert({
        given: "aidd-riteway-ai SKILL.md content",
        should: "reference /aidd-functional-requirements",
        actual: content.includes("/aidd-functional-requirements"),
        expected: true,
      });
    });

    test("encodes one eval file per step rule", async () => {
      const filePath = path.join(__dirname, "./SKILL.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "aidd-riteway-ai SKILL.md content",
        should: "instruct one .sudo eval file per step",
        actual: content.includes(".sudo") && content.includes("per step"),
        expected: true,
      });
    });

    test("encodes mock tools rule for unit evals", async () => {
      const filePath = path.join(__dirname, "./SKILL.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "aidd-riteway-ai SKILL.md content",
        should: "instruct agent to use mock tools in unit evals",
        actual: content.includes("mock"),
        expected: true,
      });
    });

    test("encodes assert tool calls rule for step 1", async () => {
      const filePath = path.join(__dirname, "./SKILL.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "aidd-riteway-ai SKILL.md content for step 1",
        should:
          "instruct to assert correct tool calls rather than pre-supply answers",
        actual: content.includes("step 1") || content.includes("Step 1"),
        expected: true,
      });
    });

    test("encodes previous step output rule for step N", async () => {
      const filePath = path.join(__dirname, "./SKILL.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "aidd-riteway-ai SKILL.md content for step N > 1",
        should: "instruct to supply previous step output as context",
        actual:
          content.includes("previous step") || content.includes("prior step"),
        expected: true,
      });
    });

    test("encodes e2e eval naming convention", async () => {
      const filePath = path.join(__dirname, "./SKILL.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "aidd-riteway-ai SKILL.md content for e2e evals",
        should: "specify the -e2e.test.sudo naming convention",
        actual: content.includes("-e2e.test.sudo"),
        expected: true,
      });
    });

    test("encodes fixture file guidance", async () => {
      const filePath = path.join(__dirname, "./SKILL.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "aidd-riteway-ai SKILL.md content about fixtures",
        should: "instruct fixtures to be small with one clear bug or condition",
        actual: content.includes("fixture") || content.includes("Fixture"),
        expected: true,
      });
    });
  });

  describe("aidd-riteway-ai command", () => {
    test("command file exists", async () => {
      const filePath = path.join(
        __dirname,
        "../../commands/aidd-riteway-ai.md",
      );
      const exists = await fs.pathExists(filePath);

      assert({
        given: "aidd-riteway-ai.md command file",
        should: "exist in ai/commands directory",
        actual: exists,
        expected: true,
      });
    });

    test("command file references the skill", async () => {
      const filePath = path.join(
        __dirname,
        "../../commands/aidd-riteway-ai.md",
      );
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "aidd-riteway-ai.md command content",
        should: "load and execute aidd-riteway-ai SKILL.md",
        actual: content.includes("aidd-riteway-ai/SKILL.md"),
        expected: true,
      });
    });

    test("command respects aidd-please constraints", async () => {
      const filePath = path.join(
        __dirname,
        "../../commands/aidd-riteway-ai.md",
      );
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "aidd-riteway-ai.md command content",
        should: "reference /aidd-please constraints",
        actual: content.includes("/aidd-please"),
        expected: true,
      });
    });
  });

  describe("aidd-please integration", () => {
    test("aidd-please Commands block lists /aidd-riteway-ai", async () => {
      const filePath = path.join(__dirname, "../aidd-please/SKILL.md");
      const content = await fs.readFile(filePath, "utf-8");

      assert({
        given: "aidd-please SKILL.md Commands block",
        should: "list /aidd-riteway-ai for agent discovery",
        actual: content.includes("/aidd-riteway-ai"),
        expected: true,
      });
    });
  });
});
