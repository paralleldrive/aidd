import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("aidd-timing-safe-compare", () => {
  test("SKILL documents hash-before-compare via helpers and createHash sha3-256", async () => {
    const filePath = path.join(__dirname, "./SKILL.md");
    const content = await fs.readFile(filePath, "utf-8");

    assert({
      given: "aidd-timing-safe-compare SKILL.md",
      should:
        "name Node createHash with sha3-256 so digest equality is unambiguous in review",
      actual:
        /createHash\s*\(\s*["']sha3-256["']\s*\)/i.test(content) ||
        /createHash\s*\(\s*`sha3-256`\s*\)/i.test(content),
      expected: true,
    });

    assert({
      given: "aidd-timing-safe-compare SKILL.md",
      should:
        "state that comparing digests from a named hash helper with === is approved and not a major/Critical timing-unsafe finding",
      actual:
        content.includes("named helper") &&
        content.includes("do not flag") &&
        content.toLowerCase().includes("major"),
      expected: true,
    });
  });

  test("review skill tells reviewers not to misclassify SHA3 digest equality", async () => {
    const filePath = path.join(__dirname, "../aidd-review/SKILL.md");
    const content = await fs.readFile(filePath, "utf-8");

    assert({
      given: "aidd-review SKILL.md",
      should:
        "direct reviewers to treat SHA3-256 digest comparison (including via helpers) as correct per timing-safe skill",
      actual:
        content.includes("SHA3-256") &&
        content.includes("digest") &&
        content.includes("aidd-timing-safe-compare") &&
        content.toLowerCase().includes("do not flag"),
      expected: true,
    });
  });

  test("ai-eval utils fixture uses hash-before-compare for secret equality", async () => {
    const filePath = path.join(
      __dirname,
      "../../../ai-evals/aidd-review/fixtures/utils.js",
    );
    const content = await fs.readFile(filePath, "utf-8");

    assert({
      given: "ai-eval utils.js fixture",
      should: "hash with sha3-256 before comparing secrets",
      actual:
        /createHash\s*\(\s*["']sha3-256["']\s*\)/i.test(content) &&
        /===/.test(content) &&
        /hashSecret/i.test(content),
      expected: true,
    });
  });
});
