import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import {
  calculateMetrics,
  checkThresholds,
  parseSkillMd,
  validateName,
} from "./validate-skill.js";

describe("parseSkillMd", () => {
  test("valid frontmatter", () => {
    const content = `---
name: my-skill
description: A test skill.
---
# My Skill

Body content here.`;

    const result = parseSkillMd(content);

    assert({
      given: "SKILL.md content with valid frontmatter",
      should: "return parsed frontmatter string",
      actual: result.frontmatter.includes("name: my-skill"),
      expected: true,
    });

    assert({
      given: "SKILL.md content with valid frontmatter",
      should: "return body without frontmatter",
      actual: result.body.startsWith("# My Skill"),
      expected: true,
    });
  });

  test("no frontmatter", () => {
    const content = "# Just a body\n\nNo frontmatter here.";
    const result = parseSkillMd(content);

    assert({
      given: "content without frontmatter",
      should: "return empty frontmatter",
      actual: result.frontmatter,
      expected: "",
    });

    assert({
      given: "content without frontmatter",
      should: "return full content as body",
      actual: result.body,
      expected: content,
    });
  });
});

describe("validateName", () => {
  test("valid names", () => {
    assert({
      given: "a valid lowercase hyphenated name",
      should: "return no errors",
      actual: validateName("format-code", "format-code"),
      expected: [],
    });

    assert({
      given: "a single-word name",
      should: "return no errors",
      actual: validateName("lint", "lint"),
      expected: [],
    });
  });

  test("uppercase letters", () => {
    const errors = validateName("Format-Code", "Format-Code");

    assert({
      given: "a name with uppercase letters",
      should: "return a validation error",
      actual: errors.length > 0,
      expected: true,
    });
  });

  test("leading hyphen", () => {
    const errors = validateName("-my-skill", "-my-skill");

    assert({
      given: "a name starting with a hyphen",
      should: "return a validation error",
      actual: errors.length > 0,
      expected: true,
    });
  });

  test("trailing hyphen", () => {
    const errors = validateName("my-skill-", "my-skill-");

    assert({
      given: "a name ending with a hyphen",
      should: "return a validation error",
      actual: errors.length > 0,
      expected: true,
    });
  });

  test("consecutive hyphens", () => {
    const errors = validateName("my--skill", "my--skill");

    assert({
      given: "a name with consecutive hyphens",
      should: "return a validation error",
      actual: errors.length > 0,
      expected: true,
    });
  });

  test("too long", () => {
    const longName = "a".repeat(65);
    const errors = validateName(longName, longName);

    assert({
      given: "a name longer than 64 characters",
      should: "return a validation error",
      actual: errors.length > 0,
      expected: true,
    });
  });

  test("empty name", () => {
    const errors = validateName("", "some-dir");

    assert({
      given: "an empty name",
      should: "return a validation error",
      actual: errors.length > 0,
      expected: true,
    });
  });

  test("directory mismatch", () => {
    const errors = validateName("my-skill", "other-dir");

    assert({
      given: "a name that does not match the directory name",
      should: "return a validation error",
      actual: errors.length > 0,
      expected: true,
    });
  });
});

describe("calculateMetrics", () => {
  test("calculates correct metrics", () => {
    const frontmatter = "name: test\ndescription: A test.";
    const body = "# Title\n\nLine 2\nLine 3";
    const result = calculateMetrics(frontmatter, body);

    assert({
      given: "frontmatter and body text",
      should: "estimate frontmatter tokens as ceil(length / 4)",
      actual: result.frontmatterTokens,
      expected: Math.ceil(frontmatter.length / 4),
    });

    assert({
      given: "a body with 4 lines",
      should: "count 4 body lines",
      actual: result.bodyLines,
      expected: 4,
    });

    assert({
      given: "body text",
      should: "estimate body tokens as ceil(length / 4)",
      actual: result.bodyTokens,
      expected: Math.ceil(body.length / 4),
    });
  });
});

describe("checkThresholds", () => {
  test("all within limits", () => {
    const metrics = { frontmatterTokens: 50, bodyLines: 100, bodyTokens: 3000 };

    assert({
      given: "metrics within all thresholds",
      should: "return no warnings",
      actual: checkThresholds(metrics),
      expected: [],
    });
  });

  test("frontmatter too large", () => {
    const metrics = { frontmatterTokens: 100, bodyLines: 50, bodyTokens: 1000 };
    const warnings = checkThresholds(metrics);

    assert({
      given: "frontmatter at 100 tokens",
      should: "return a frontmatter warning",
      actual: warnings.some((w) => w.includes("Frontmatter")),
      expected: true,
    });
  });

  test("body exceeds 160 lines", () => {
    const metrics = { frontmatterTokens: 10, bodyLines: 160, bodyTokens: 1000 };
    const warnings = checkThresholds(metrics);

    assert({
      given: "body at 160 lines",
      should: "return a 160-line warning",
      actual: warnings.some((w) => w.includes("160")),
      expected: true,
    });
  });

  test("body exceeds 500 lines", () => {
    const metrics = { frontmatterTokens: 10, bodyLines: 500, bodyTokens: 1000 };
    const warnings = checkThresholds(metrics);

    assert({
      given: "body at 500 lines",
      should: "return a 500-line spec limit warning",
      actual: warnings.some((w) => w.includes("500")),
      expected: true,
    });
  });

  test("body exceeds 5000 tokens", () => {
    const metrics = { frontmatterTokens: 10, bodyLines: 50, bodyTokens: 5000 };
    const warnings = checkThresholds(metrics);

    assert({
      given: "body at 5000 tokens",
      should: "return a token warning",
      actual: warnings.some((w) => w.includes("5000")),
      expected: true,
    });
  });
});
