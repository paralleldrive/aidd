import { fileURLToPath } from "url";
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import {
  calculateMetrics,
  checkThresholds,
  parseSkillMd,
  resolveIsMainEntry,
  validateFrontmatterKeys,
  validateName,
  validateSkillContent,
} from "./validate-skill.js";

describe("resolveIsMainEntry", () => {
  const moduleUrl =
    "file:///workspace/ai/skills/aidd-upskill/scripts/validate-skill.js";
  const modulePath = fileURLToPath(moduleUrl);

  test("uses import.meta.main when defined (Bun)", () => {
    assert({
      given: "import.meta.main is true and argv1 does not match module path",
      should: "return true so compiled Bun binaries still run the CLI",
      actual: resolveIsMainEntry({
        main: true,
        argv1: "/tmp/stale-build-path",
        moduleUrl,
      }),
      expected: true,
    });

    assert({
      given: "import.meta.main is false",
      should: "return false",
      actual: resolveIsMainEntry({
        main: false,
        argv1: modulePath,
        moduleUrl,
      }),
      expected: false,
    });
  });

  test("falls back to argv comparison when main is undefined (Node)", () => {
    assert({
      given: "main is undefined and argv1 matches this module URL path",
      should: "return true",
      actual: resolveIsMainEntry({
        main: undefined,
        argv1: modulePath,
        moduleUrl,
      }),
      expected: true,
    });

    assert({
      given: "main is undefined and argv1 does not match",
      should: "return false",
      actual: resolveIsMainEntry({
        main: undefined,
        argv1: "/other/script.js",
        moduleUrl,
      }),
      expected: false,
    });
  });
});

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
      actual: result.frontmatter,
      expected: "name: my-skill\ndescription: A test skill.",
    });

    assert({
      given: "SKILL.md content with valid frontmatter",
      should: "return body without frontmatter",
      actual: result.body,
      expected: "# My Skill\n\nBody content here.",
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

  test("CRLF line endings", () => {
    const content =
      "---\r\nname: aidd-my-skill\r\ndescription: A test skill.\r\n---\r\n# My Skill\r\n\r\nBody content here.";
    const result = parseSkillMd(content);

    assert({
      given: "SKILL.md content with CRLF line endings",
      should: "return parsed frontmatter string",
      actual: result.frontmatter,
      expected: "name: aidd-my-skill\r\ndescription: A test skill.",
    });

    assert({
      given: "SKILL.md content with CRLF line endings",
      should: "return body without frontmatter block",
      actual: result.body,
      expected: "# My Skill\r\n\r\nBody content here.",
    });
  });
});

describe("validateName", () => {
  test("valid names", () => {
    assert({
      given: "a valid aidd-prefixed lowercase hyphenated name",
      should: "return no errors",
      actual: validateName("aidd-format-code", "aidd-format-code"),
      expected: [],
    });
  });

  test("missing aidd- prefix", () => {
    const errors = validateName("format-code", "format-code");

    assert({
      given: "a name without the aidd- prefix",
      should: "return an error requiring the aidd- prefix",
      actual: errors[0],
      expected: "Name must start with 'aidd-' prefix",
    });
  });

  test("uppercase letters", () => {
    const errors = validateName("Format-Code", "Format-Code");

    assert({
      given: "a name with uppercase letters",
      should: "return an error requiring lowercase alphanumeric + hyphens",
      actual: errors[0],
      expected: "Name must be lowercase alphanumeric + hyphens only",
    });

    assert({
      given: "a name with uppercase letters",
      should: "also return an error requiring the aidd- prefix",
      actual: errors[1],
      expected: "Name must start with 'aidd-' prefix",
    });
  });

  test("leading hyphen", () => {
    const errors = validateName("-my-skill", "-my-skill");

    assert({
      given: "a name starting with a hyphen",
      should: "return an error requiring the aidd- prefix",
      actual: errors[0],
      expected: "Name must start with 'aidd-' prefix",
    });

    assert({
      given: "a name starting with a hyphen",
      should: "return an error about leading/trailing hyphen",
      actual: errors[1],
      expected: "Name must not start or end with hyphen",
    });
  });

  test("trailing hyphen", () => {
    const errors = validateName("my-skill-", "my-skill-");

    assert({
      given: "a name ending with a hyphen",
      should: "return an error requiring the aidd- prefix",
      actual: errors[0],
      expected: "Name must start with 'aidd-' prefix",
    });

    assert({
      given: "a name ending with a hyphen",
      should: "return an error about leading/trailing hyphen",
      actual: errors[1],
      expected: "Name must not start or end with hyphen",
    });
  });

  test("consecutive hyphens", () => {
    const errors = validateName("my--skill", "my--skill");

    assert({
      given: "a name with consecutive hyphens",
      should: "return an error requiring the aidd- prefix",
      actual: errors[0],
      expected: "Name must start with 'aidd-' prefix",
    });

    assert({
      given: "a name with consecutive hyphens",
      should: "return an error about consecutive hyphens",
      actual: errors[1],
      expected: "Name must not contain consecutive hyphens",
    });
  });

  test("too long", () => {
    const longName = "a".repeat(65);
    const errors = validateName(longName, longName);

    assert({
      given: "a name longer than 64 characters",
      should: "return an error about name length",
      actual: errors[0],
      expected: "Name must be 1-64 characters",
    });

    assert({
      given: "a name longer than 64 characters",
      should: "return an error requiring the aidd- prefix",
      actual: errors[1],
      expected: "Name must start with 'aidd-' prefix",
    });
  });

  test("empty name", () => {
    const errors = validateName("", "some-dir");

    assert({
      given: "an empty name",
      should: "return an error about name length",
      actual: errors[0],
      expected: "Name must be 1-64 characters",
    });

    assert({
      given: "an empty name",
      should: "return an error requiring the aidd- prefix",
      actual: errors[1],
      expected: "Name must start with 'aidd-' prefix",
    });

    assert({
      given: "an empty name",
      should: "return an error about mismatched directory name",
      actual: errors[2],
      expected: "Name must match directory name",
    });
  });

  test("directory mismatch", () => {
    const errors = validateName("my-skill", "other-dir");

    assert({
      given: "a name that does not match the directory name",
      should: "return an error requiring the aidd- prefix",
      actual: errors[0],
      expected: "Name must start with 'aidd-' prefix",
    });

    assert({
      given: "a name that does not match the directory name",
      should: "return an error about mismatched directory name",
      actual: errors[1],
      expected: "Name must match directory name",
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
      should: "estimate frontmatter tokens as ceil(31 chars / 4) = 8",
      actual: result.frontmatterTokens,
      expected: 8,
    });

    assert({
      given: "a body with 4 lines",
      should: "count 4 body lines",
      actual: result.bodyLines,
      expected: 4,
    });

    assert({
      given: "body text",
      should: "estimate body tokens as ceil(22 chars / 4) = 6",
      actual: result.bodyTokens,
      expected: 6,
    });
  });
});

describe("checkThresholds", () => {
  test("all within limits", () => {
    const metrics = { frontmatterTokens: 50, bodyLines: 100, bodyTokens: 3000 };
    const result = checkThresholds(metrics);

    assert({
      given: "metrics within all thresholds",
      should: "return no errors",
      actual: result.errors,
      expected: [],
    });

    assert({
      given: "metrics within all thresholds",
      should: "return no warnings",
      actual: result.warnings,
      expected: [],
    });
  });

  test("frontmatter too large", () => {
    const metrics = { frontmatterTokens: 100, bodyLines: 50, bodyTokens: 1000 };
    const result = checkThresholds(metrics);

    assert({
      given: "frontmatter at 100 tokens",
      should: "return a frontmatter warning",
      actual: result.warnings.some((w) => w.includes("Frontmatter")),
      expected: true,
    });

    assert({
      given: "frontmatter at 100 tokens",
      should: "not produce a hard error",
      actual: result.errors,
      expected: [],
    });
  });

  test("body exceeds 160 lines", () => {
    const metrics = { frontmatterTokens: 10, bodyLines: 160, bodyTokens: 1000 };
    const result = checkThresholds(metrics);

    assert({
      given: "body at 160 lines",
      should: "return a 160-line warning",
      actual: result.warnings.some((w) => w.includes("160")),
      expected: true,
    });

    assert({
      given: "body at 160 lines",
      should: "not produce a hard error",
      actual: result.errors,
      expected: [],
    });
  });

  test("body exceeds 500 lines", () => {
    const metrics = { frontmatterTokens: 10, bodyLines: 500, bodyTokens: 1000 };
    const result = checkThresholds(metrics);

    assert({
      given: "body at 500 lines",
      should: "return a 500-line hard error",
      actual: result.errors.some((e) => e.includes("500")),
      expected: true,
    });

    assert({
      given: "body at 500 lines",
      should: "not duplicate 500-line message in warnings",
      actual: result.warnings.some((w) => w.includes("500")),
      expected: false,
    });
  });

  test("body exceeds 5000 tokens", () => {
    const metrics = { frontmatterTokens: 10, bodyLines: 50, bodyTokens: 5000 };
    const result = checkThresholds(metrics);

    assert({
      given: "body at 5000 tokens",
      should: "return a token warning",
      actual: result.warnings.some((w) => w.includes("5000")),
      expected: true,
    });

    assert({
      given: "body at 5000 tokens",
      should: "not produce a hard error",
      actual: result.errors,
      expected: [],
    });
  });

  test("body at 159 lines (just below soft threshold)", () => {
    const metrics = { frontmatterTokens: 10, bodyLines: 159, bodyTokens: 1000 };
    const result = checkThresholds(metrics);

    assert({
      given: "body at 159 lines",
      should: "return no body-line warning",
      actual: result.warnings.filter((w) => w.includes("160")),
      expected: [],
    });

    assert({
      given: "body at 159 lines",
      should: "return no errors",
      actual: result.errors,
      expected: [],
    });
  });

  test("body at 499 lines (just below hard limit)", () => {
    const metrics = { frontmatterTokens: 10, bodyLines: 499, bodyTokens: 1000 };
    const result = checkThresholds(metrics);

    assert({
      given: "body at 499 lines",
      should: "return a 160-line soft warning",
      actual: result.warnings.some((w) => w.includes("160")),
      expected: true,
    });

    assert({
      given: "body at 499 lines",
      should: "not produce a hard error",
      actual: result.errors,
      expected: [],
    });
  });

  test("frontmatter at 99 tokens (just below warning threshold)", () => {
    const metrics = { frontmatterTokens: 99, bodyLines: 50, bodyTokens: 1000 };
    const result = checkThresholds(metrics);

    assert({
      given: "frontmatter at 99 tokens",
      should: "return no frontmatter warning",
      actual: result.warnings.filter((w) => w.includes("Frontmatter")),
      expected: [],
    });

    assert({
      given: "frontmatter at 99 tokens",
      should: "return no errors",
      actual: result.errors,
      expected: [],
    });
  });

  test("body at 4999 tokens (just below warning threshold)", () => {
    const metrics = { frontmatterTokens: 10, bodyLines: 50, bodyTokens: 4999 };
    const result = checkThresholds(metrics);

    assert({
      given: "body at 4999 tokens",
      should: "return no token warning",
      actual: result.warnings.filter((w) => w.includes("5000")),
      expected: [],
    });

    assert({
      given: "body at 4999 tokens",
      should: "return no errors",
      actual: result.errors,
      expected: [],
    });
  });
});

describe("validateSkillContent", () => {
  test("valid skill with matching dir name", () => {
    const content = `---
name: aidd-my-skill
description: A test skill.
---
# My Skill

Body content here.`;

    const result = validateSkillContent(content, "aidd-my-skill");

    assert({
      given: "valid SKILL.md content and matching directory name",
      should: "return no errors and computed metrics",
      actual: result.errors,
      expected: [],
    });

    assert({
      given: "valid SKILL.md content",
      should: "return bodyLines metric",
      actual: typeof result.metrics.bodyLines,
      expected: "number",
    });
  });

  test("mismatched directory name", () => {
    const content = `---
name: aidd-my-skill
description: A test skill.
---
# My Skill`;

    const result = validateSkillContent(content, "other-dir");

    assert({
      given: "SKILL.md name does not match directory name",
      should: "return an error",
      actual: result.errors.length > 0,
      expected: true,
    });
  });

  test("missing frontmatter name", () => {
    const content = `---
description: No name here.
---
# My Skill`;

    const result = validateSkillContent(content, "");

    assert({
      given: "frontmatter without a name field",
      should: "return an error",
      actual: result.errors.length > 0,
      expected: true,
    });
  });

  test("valid description passes without description-related errors", () => {
    const content = `---
name: aidd-my-skill
description: A valid skill description.
---
# My Skill

Body content here.`;

    const result = validateSkillContent(content, "aidd-my-skill");

    assert({
      given: "a skill with a valid description",
      should: "return no errors",
      actual: result.errors,
      expected: [],
    });
  });

  test("missing description field fails with error", () => {
    const content = `---
name: aidd-my-skill
---
# My Skill

Body content here.`;

    const result = validateSkillContent(content, "aidd-my-skill");

    assert({
      given: "a skill with no description field",
      should: "return a description required error",
      actual: result.errors.some((e) => e.includes("Description is required")),
      expected: true,
    });
  });

  test("empty string description field fails with error", () => {
    const content = `---
name: aidd-my-skill
description: ""
---
# My Skill

Body content here.`;

    const result = validateSkillContent(content, "aidd-my-skill");

    assert({
      given: "a skill with an empty string description",
      should: "return a description required error",
      actual: result.errors.some((e) => e.includes("Description is required")),
      expected: true,
    });
  });

  test("quoted name field is stripped of quotes before validation", () => {
    const content = `---
name: "aidd-my-skill"
description: A test skill.
---
# My Skill

Body content here.`;

    const result = validateSkillContent(content, "aidd-my-skill");

    assert({
      given:
        'a skill with name: "aidd-my-skill" (YAML double-quoted) and matching directory',
      should: "return no name-related errors",
      actual: result.errors,
      expected: [],
    });
  });

  test("single-quoted name field is stripped of quotes before validation", () => {
    const content = `---
name: 'aidd-my-skill'
description: A test skill.
---
# My Skill

Body content here.`;

    const result = validateSkillContent(content, "aidd-my-skill");

    assert({
      given:
        "a skill with name: 'aidd-my-skill' (YAML single-quoted) and matching directory",
      should: "return no name-related errors",
      actual: result.errors,
      expected: [],
    });
  });

  test("malformed YAML frontmatter returns an Invalid YAML error instead of throwing", () => {
    const content = `---
name: aidd-my-skill
description: [broken
---
# My Skill

Body content here.`;

    let result;
    let threw = false;
    try {
      result = validateSkillContent(content, "aidd-my-skill");
    } catch {
      threw = true;
    }

    assert({
      given: "a skill with malformed YAML in frontmatter",
      should: "not throw an exception",
      actual: threw,
      expected: false,
    });

    assert({
      given: "a skill with malformed YAML in frontmatter",
      should: 'return an error containing "Invalid YAML"',
      actual: result.errors.some((e) => e.includes("Invalid YAML")),
      expected: true,
    });
  });

  test("unknown frontmatter key produces an error via validateSkillContent", () => {
    const content = `---
name: aidd-my-skill
description: A valid skill description.
unknown-key: some value
---
# My Skill

Body content here.`;

    const result = validateSkillContent(content, "aidd-my-skill");

    assert({
      given: "a skill with an unknown frontmatter key",
      should: "return an error naming the unknown key",
      actual: result.errors.some((e) =>
        e.includes("Unknown frontmatter key: unknown-key"),
      ),
      expected: true,
    });
  });

  test("inline YAML comment on name field does not corrupt name validation", () => {
    const content = `---
name: aidd-my-skill # inline comment
description: A test skill.
---
# My Skill

Body content here.`;

    const result = validateSkillContent(content, "aidd-my-skill");

    assert({
      given:
        "a SKILL.md with an inline YAML comment on the name field (name: aidd-my-skill # comment)",
      should: "validate name correctly and return no errors",
      actual: result.errors,
      expected: [],
    });
  });

  test("degenerate frontmatter that is a bare scalar returns a YAML mapping error without throwing", () => {
    const content = `---
just a string
---
# My Skill

Body content here.`;

    let result;
    let threw = false;
    try {
      result = validateSkillContent(content, "aidd-my-skill");
    } catch {
      threw = true;
    }

    assert({
      given:
        "a SKILL.md whose frontmatter is a bare YAML scalar (not a mapping)",
      should: "not throw an exception",
      actual: threw,
      expected: false,
    });

    assert({
      given:
        "a SKILL.md whose frontmatter is a bare YAML scalar (not a mapping)",
      should: 'return an error containing "must be a YAML mapping"',
      actual: result.errors.some((e) => e.includes("must be a YAML mapping")),
      expected: true,
    });
  });
});

describe("validateFrontmatterKeys", () => {
  test("all allowed keys present returns no errors", () => {
    const frontmatterObj = {
      name: "aidd-my-skill",
      description: "A test skill.",
      license: "MIT",
      compatibility: "node >= 18",
      metadata: { alwaysApply: "true" },
      "allowed-tools": "read write",
    };

    assert({
      given: "a frontmatter object with only allowed keys",
      should: "return no errors",
      actual: validateFrontmatterKeys(frontmatterObj),
      expected: [],
    });
  });

  test("one unknown key returns one error naming the key", () => {
    const frontmatterObj = {
      name: "aidd-my-skill",
      description: "A test skill.",
      "unknown-key": "some value",
    };

    assert({
      given: "a frontmatter object with one unknown key",
      should: "return one error naming the key",
      actual: validateFrontmatterKeys(frontmatterObj),
      expected: ["Unknown frontmatter key: unknown-key"],
    });
  });

  test("multiple unknown keys return multiple errors", () => {
    const frontmatterObj = {
      name: "aidd-my-skill",
      description: "A test skill.",
      "bad-key": "x",
      "another-bad-key": "y",
    };

    const errors = validateFrontmatterKeys(frontmatterObj);

    assert({
      given: "a frontmatter object with two unknown keys",
      should: "return two errors",
      actual: errors.length,
      expected: 2,
    });

    assert({
      given: "a frontmatter object with two unknown keys",
      should: "name first unknown key in an error",
      actual: errors.some((e) => e.includes("bad-key")),
      expected: true,
    });

    assert({
      given: "a frontmatter object with two unknown keys",
      should: "name second unknown key in an error",
      actual: errors.some((e) => e.includes("another-bad-key")),
      expected: true,
    });
  });
});
