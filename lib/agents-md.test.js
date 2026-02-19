import os from "os";
import path from "path";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test } from "vitest";

import {
  AGENTS_MD_CONTENT,
  agentsFileExists,
  ensureAgentsMd,
  ensureClaudeMd,
  getMissingDirectives,
  hasAllDirectives,
  REQUIRED_DIRECTIVES,
} from "./agents-md.js";

describe("agents-md", () => {
  let tempDir;

  beforeEach(async () => {
    // Create a unique temp directory for each test
    tempDir = path.join(os.tmpdir(), `aidd-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.remove(tempDir);
  });

  describe("hasAllDirectives", () => {
    test("returns true when all directives are present", () => {
      assert({
        given: "content with all required directives",
        should: "return true",
        actual: hasAllDirectives(AGENTS_MD_CONTENT),
        expected: true,
      });
    });

    test("returns false when directives are missing", () => {
      const incompleteContent = "# AGENTS\n\nSome random content.";

      assert({
        given: "content missing required directives",
        should: "return false",
        actual: hasAllDirectives(incompleteContent),
        expected: false,
      });
    });

    test("is case insensitive", () => {
      const mixedCaseContent = `
        Check AI/ directory listings
        INDEX.MD files are auto-GENERATED
        Root Index from base
        VISION document requirement
        CONFLICT resolution
        Run NPM RUN TEST:E2E before committing
      `;

      assert({
        given: "content with mixed case directives",
        should: "return true",
        actual: hasAllDirectives(mixedCaseContent),
        expected: true,
      });
    });
  });

  describe("getMissingDirectives", () => {
    test("returns empty array when all directives present", () => {
      assert({
        given: "content with all directives",
        should: "return empty array",
        actual: getMissingDirectives(AGENTS_MD_CONTENT),
        expected: [],
      });
    });

    test("returns missing directives", () => {
      const partialContent = "ai/ directory and index.md";

      const missing = getMissingDirectives(partialContent);

      assert({
        given: "content with only some directives",
        should: "return the missing ones",
        actual: missing.includes("root index"),
        expected: true,
      });
    });
  });

  describe("agentsFileExists", () => {
    test("returns false when file does not exist", async () => {
      const exists = await agentsFileExists(tempDir);

      assert({
        given: "directory without AGENTS.md",
        should: "return false",
        actual: exists,
        expected: false,
      });
    });

    test("returns true when file exists", async () => {
      await fs.writeFile(path.join(tempDir, "AGENTS.md"), "# Test");

      const exists = await agentsFileExists(tempDir);

      assert({
        given: "directory with AGENTS.md",
        should: "return true",
        actual: exists,
        expected: true,
      });
    });
  });

  describe("ensureAgentsMd", () => {
    test("creates AGENTS.md when it does not exist", async () => {
      const result = await ensureAgentsMd(tempDir);

      assert({
        given: "directory without AGENTS.md",
        should: "return created action",
        actual: result.action,
        expected: "created",
      });

      const content = await fs.readFile(
        path.join(tempDir, "AGENTS.md"),
        "utf-8",
      );

      assert({
        given: "newly created AGENTS.md",
        should: "contain the standard content",
        actual: content.includes("# AI Agent Guidelines"),
        expected: true,
      });
    });

    test("does not modify AGENTS.md when all directives present", async () => {
      const originalContent = AGENTS_MD_CONTENT;
      await fs.writeFile(path.join(tempDir, "AGENTS.md"), originalContent);

      const result = await ensureAgentsMd(tempDir);

      assert({
        given: "AGENTS.md with all required directives",
        should: "return unchanged action",
        actual: result.action,
        expected: "unchanged",
      });

      const content = await fs.readFile(
        path.join(tempDir, "AGENTS.md"),
        "utf-8",
      );

      assert({
        given: "AGENTS.md with all directives",
        should: "preserve original content exactly",
        actual: content,
        expected: originalContent,
      });
    });

    test("appends directives when some are missing", async () => {
      const originalContent = "# My Custom AGENTS.md\n\nSome custom content.";
      await fs.writeFile(path.join(tempDir, "AGENTS.md"), originalContent);

      const result = await ensureAgentsMd(tempDir);

      assert({
        given: "AGENTS.md missing required directives",
        should: "return appended action",
        actual: result.action,
        expected: "appended",
      });

      const content = await fs.readFile(
        path.join(tempDir, "AGENTS.md"),
        "utf-8",
      );

      assert({
        given: "AGENTS.md after appending",
        should: "preserve original content",
        actual: content.startsWith(originalContent),
        expected: true,
      });

      assert({
        given: "AGENTS.md after appending",
        should: "now have all directives",
        actual: hasAllDirectives(content),
        expected: true,
      });
    });

    test("does not duplicate directives if already present", async () => {
      // Create content with all directives but in custom format
      const customContent = `# Custom AGENTS.md

Look at ai/ directory listings.
Read index.md files (auto-generated).
Only use root index until you need more.
Always read the vision document first.
Report conflict resolution to the user.
Run npm run test:e2e before committing.
`;
      await fs.writeFile(path.join(tempDir, "AGENTS.md"), customContent);

      const result = await ensureAgentsMd(tempDir);

      assert({
        given: "AGENTS.md with all directives in custom format",
        should: "return unchanged action",
        actual: result.action,
        expected: "unchanged",
      });
    });
  });

  describe("REQUIRED_DIRECTIVES", () => {
    test("contains the expected directive keywords", () => {
      assert({
        given: "REQUIRED_DIRECTIVES constant",
        should: "include ai directory directive",
        actual: REQUIRED_DIRECTIVES.includes("ai/"),
        expected: true,
      });

      assert({
        given: "REQUIRED_DIRECTIVES constant",
        should: "include vision directive",
        actual: REQUIRED_DIRECTIVES.includes("vision"),
        expected: true,
      });
    });

    test("includes the e2e test directive keyword", () => {
      assert({
        given: "REQUIRED_DIRECTIVES constant",
        should:
          "include test:e2e directive so agents know to run E2E tests before committing",
        actual: REQUIRED_DIRECTIVES.includes("test:e2e"),
        expected: true,
      });
    });
  });

  describe("AGENTS_MD_CONTENT e2e instruction", () => {
    test("instructs agents to run npm run test:e2e before committing", () => {
      assert({
        given: "the standard AGENTS.md template",
        should: "include the npm run test:e2e command",
        actual: AGENTS_MD_CONTENT.includes("npm run test:e2e"),
        expected: true,
      });
    });

    test("explains that E2E tests are excluded from the pre-commit hook", () => {
      assert({
        given: "the standard AGENTS.md template",
        should: "mention that E2E tests are not run by the pre-commit hook",
        actual:
          AGENTS_MD_CONTENT.includes("pre-commit") ||
          AGENTS_MD_CONTENT.includes("commit hook"),
        expected: true,
      });
    });
  });
});

describe("ensureClaudeMd", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-claude-md-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("creates CLAUDE.md with AGENTS.md content when no CLAUDE.md exists", async () => {
    const result = await ensureClaudeMd(tempDir);

    assert({
      given: "a directory with no CLAUDE.md",
      should: "return created action",
      actual: result.action,
      expected: "created",
    });

    const content = await fs.readFile(path.join(tempDir, "CLAUDE.md"), "utf-8");

    assert({
      given: "newly created CLAUDE.md",
      should: "contain the same content as the AGENTS.md template",
      actual: content,
      expected: AGENTS_MD_CONTENT,
    });
  });

  test("appends AGENTS.md reference when CLAUDE.md exists without it", async () => {
    const existingContent = "# My existing CLAUDE.md\n\nCustom instructions.";
    await fs.writeFile(path.join(tempDir, "CLAUDE.md"), existingContent);

    const result = await ensureClaudeMd(tempDir);

    assert({
      given: "an existing CLAUDE.md that has no AGENTS.md reference",
      should: "return appended action",
      actual: result.action,
      expected: "appended",
    });

    const content = await fs.readFile(path.join(tempDir, "CLAUDE.md"), "utf-8");

    assert({
      given: "an existing CLAUDE.md after appending",
      should: "start with the original content",
      actual: content.startsWith(existingContent),
      expected: true,
    });

    assert({
      given: "an existing CLAUDE.md after appending",
      should: "include a reference to AGENTS.md",
      actual: content.includes("AGENTS.md"),
      expected: true,
    });
  });

  test("leaves CLAUDE.md unchanged when it already references AGENTS.md", async () => {
    const existingContent =
      "# CLAUDE.md\n\nSee [AGENTS.md](./AGENTS.md) for guidelines.";
    await fs.writeFile(path.join(tempDir, "CLAUDE.md"), existingContent);

    const result = await ensureClaudeMd(tempDir);

    assert({
      given: "a CLAUDE.md that already references AGENTS.md",
      should: "return unchanged action",
      actual: result.action,
      expected: "unchanged",
    });

    const content = await fs.readFile(path.join(tempDir, "CLAUDE.md"), "utf-8");

    assert({
      given: "a CLAUDE.md that already references AGENTS.md",
      should: "preserve the original content exactly",
      actual: content,
      expected: existingContent,
    });
  });
});
