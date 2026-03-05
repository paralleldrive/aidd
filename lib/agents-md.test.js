// @ts-check
import os from "os";
import path from "path";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test } from "vitest";

import {
  agentsFileExists,
  agentsMdContent,
  appendDirectives,
  directiveAppendSections,
  ensureAgentsMd,
  ensureClaudeMd,
  getMissingDirectives,
  hasAllDirectives,
  requiredDirectives,
  syncRootAgentFiles,
} from "./agents-md.js";

/** @typedef {import('./agents-md.js').SyncFileResult} SyncFileResult */

describe("agents-md", () => {
  let tempDir = "";

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
        actual: hasAllDirectives(agentsMdContent),
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
        AIDD-CUSTOM folder customization
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
        actual: getMissingDirectives(agentsMdContent),
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
      const originalContent = agentsMdContent;
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

    test("only appends missing sections when upgrading from an older install", async () => {
      // Simulate an AGENTS.md from a previous install: all original directives
      // are present (via the previously-appended block) but the new aidd-custom
      // directive is absent — exactly the upgrade scenario the bug describes.
      const previouslyUpgradedContent = `# My Custom AGENTS.md

Some custom content.

---

## AIDD Agent Directives (Auto-appended)

The following directives were added by the AIDD CLI to ensure proper agent behavior.

### Directory Structure

Agents should examine the \`ai/*\` directory listings to understand the available commands, rules, and workflows.

### Index Files

Each folder in the \`ai/\` directory contains an \`index.md\` file that describes the purpose and contents of that folder. Agents can read these index files to learn the function of files in each folder without needing to read every file.

**Important:** The \`ai/**/index.md\` files are auto-generated from frontmatter. Do not create or edit these files manually—they will be overwritten by the pre-commit hook.

### Progressive Discovery

Agents should only consume the root index until they need subfolder contents.

### Vision Document Requirement

**Before creating or running any task, agents must first read the vision document (\`vision.md\`) in the project root.**

### Conflict Resolution

If any conflicts are detected between a requested task and the vision document, agents must ask the user to clarify how to resolve the conflict before proceeding.
`;
      await fs.writeFile(
        path.join(tempDir, "AGENTS.md"),
        previouslyUpgradedContent,
      );

      await ensureAgentsMd(tempDir);

      const content = await fs.readFile(
        path.join(tempDir, "AGENTS.md"),
        "utf-8",
      );

      assert({
        given: "upgrading from previous install missing only aidd-custom",
        should: "not duplicate the Directory Structure section",
        actual: (content.match(/### Directory Structure/g) ?? []).length,
        expected: 1,
      });

      assert({
        given: "upgrading from previous install missing only aidd-custom",
        should: "not add a second wrapper heading",
        actual: (
          content.match(/## AIDD Agent Directives \(Auto-appended\)/g) ?? []
        ).length,
        expected: 1,
      });

      assert({
        given: "upgrading from previous install missing only aidd-custom",
        should: "not add a second --- separator",
        actual: (content.match(/^---$/gm) ?? []).length,
        expected: 1,
      });

      assert({
        given: "upgrading from previous install missing only aidd-custom",
        should: "contain all required directives after upgrade",
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
Check aidd-custom/ for project-specific skills and configuration.
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

  describe("appendDirectives", () => {
    test("does not add a second wrapper heading when called twice", async () => {
      const initialContent = "# My Custom AGENTS.md\n\nSome custom content.";
      await fs.writeFile(path.join(tempDir, "AGENTS.md"), initialContent);

      await appendDirectives(tempDir, initialContent, [...requiredDirectives]);
      const afterFirst = await fs.readFile(
        path.join(tempDir, "AGENTS.md"),
        "utf-8",
      );

      await appendDirectives(tempDir, afterFirst, ["aidd-custom"]);
      const afterSecond = await fs.readFile(
        path.join(tempDir, "AGENTS.md"),
        "utf-8",
      );

      assert({
        given: "appendDirectives called twice on the same file",
        should: "produce only one wrapper heading",
        actual: (
          afterSecond.match(/## AIDD Agent Directives \(Auto-appended\)/g) ?? []
        ).length,
        expected: 1,
      });

      assert({
        given: "appendDirectives called twice on the same file",
        should: "produce only one --- separator",
        actual: (afterSecond.match(/^---$/gm) ?? []).length,
        expected: 1,
      });
    });
  });

  describe("requiredDirectives", () => {
    test("contains the expected directive keywords", () => {
      assert({
        given: "requiredDirectives constant",
        should: "include ai directory directive",
        actual: requiredDirectives.includes("ai/"),
        expected: true,
      });

      assert({
        given: "requiredDirectives constant",
        should: "include vision directive",
        actual: requiredDirectives.includes("vision"),
        expected: true,
      });

      assert({
        given: "requiredDirectives constant",
        should: "include aidd-custom directive",
        actual: requiredDirectives.includes("aidd-custom"),
        expected: true,
      });

      assert({
        given: "requiredDirectives constant",
        should:
          "include test:e2e directive so agents know to run E2E tests before committing",
        actual: requiredDirectives.includes("test:e2e"),
        expected: true,
      });
    });
  });

  describe("directiveAppendSections", () => {
    test("exports an array of section objects with content and keywords", () => {
      assert({
        given: "directiveAppendSections constant",
        should: "be an array",
        actual: Array.isArray(directiveAppendSections),
        expected: true,
      });

      assert({
        given: "directiveAppendSections constant",
        should: "have entries with content and keywords fields",
        actual: directiveAppendSections.every(
          (s) =>
            typeof s.content === "string" &&
            Array.isArray(s.keywords) &&
            s.keywords.length > 0,
        ),
        expected: true,
      });
    });
  });

  describe("appendDirectives", () => {
    test("appends only sections matching missingDirectives", async () => {
      const existingContent = "# My AGENTS.md\n\nCustom content.";
      await fs.writeFile(path.join(tempDir, "AGENTS.md"), existingContent);

      await appendDirectives(tempDir, existingContent, ["vision"]);

      const content = await fs.readFile(
        path.join(tempDir, "AGENTS.md"),
        "utf-8",
      );

      assert({
        given: 'appendDirectives called with missingDirectives ["vision"]',
        should: "append the Vision Document Requirement section",
        actual: content.includes("### Vision Document Requirement"),
        expected: true,
      });

      assert({
        given: 'appendDirectives called with missingDirectives ["vision"]',
        should: "not append the Conflict Resolution section",
        actual: content.includes("### Conflict Resolution"),
        expected: false,
      });
    });

    test("appends no section content when missingDirectives is empty", async () => {
      const existingContent = "# My AGENTS.md\n\nAll directives present.";
      await fs.writeFile(path.join(tempDir, "AGENTS.md"), existingContent);

      await appendDirectives(tempDir, existingContent, []);

      const content = await fs.readFile(
        path.join(tempDir, "AGENTS.md"),
        "utf-8",
      );

      assert({
        given: "appendDirectives called with an empty missingDirectives array",
        should: "still prepend the AIDD header block",
        actual: content.includes("## AIDD Agent Directives (Auto-appended)"),
        expected: true,
      });

      assert({
        given: "appendDirectives called with an empty missingDirectives array",
        should: "not append any named section",
        actual:
          !content.includes("### Directory Structure") &&
          !content.includes("### Vision Document Requirement"),
        expected: true,
      });
    });

    test("includes the e2e test directive keyword", () => {
      const testingSection = directiveAppendSections.find(({ keywords }) =>
        keywords.includes("test:e2e"),
      );

      assert({
        given: "directiveAppendSections",
        should: "include a section with test:e2e keyword",
        actual: testingSection !== undefined,
        expected: true,
      });
    });
  });

  describe("agentsMdContent e2e instruction", () => {
    test("instructs agents to run npm run test:e2e before committing", () => {
      assert({
        given: "agentsMdContent",
        should: "include the npm run test:e2e command",
        actual: agentsMdContent.includes("npm run test:e2e"),
        expected: true,
      });
    });

    test("explains that E2E tests are excluded from the pre-commit hook", () => {
      assert({
        given: "agentsMdContent",
        should: "explain why E2E tests do not run in the pre-commit hook",
        actual: agentsMdContent.includes("pre-commit hook"),
        expected: true,
      });
    });
  });
});

describe("syncRootAgentFiles", () => {
  let tempDir = "";

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-sync-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("creates both files when neither exists", async () => {
    const results = await syncRootAgentFiles(tempDir);

    assert({
      given: "neither AGENTS.md nor CLAUDE.md exists",
      should: "create both files",
      actual: results.map(({ action }) => action).every((a) => a === "created"),
      expected: true,
    });

    assert({
      given: "files just created",
      should: "write agentsMdContent to both",
      actual: await fs.readFile(path.join(tempDir, "AGENTS.md"), "utf-8"),
      expected: agentsMdContent,
    });
  });

  test("returns unchanged when both files already match the template", async () => {
    await fs.writeFile(
      path.join(tempDir, "AGENTS.md"),
      agentsMdContent,
      "utf-8",
    );
    await fs.writeFile(
      path.join(tempDir, "CLAUDE.md"),
      agentsMdContent,
      "utf-8",
    );

    const results = await syncRootAgentFiles(tempDir);

    assert({
      given: "both files already match the current template",
      should: "report unchanged for both",
      actual: results.every(({ action }) => action === "unchanged"),
      expected: true,
    });
  });

  test("overwrites a stale file whose content differs from the current template", async () => {
    await fs.writeFile(
      path.join(tempDir, "AGENTS.md"),
      "# Old content",
      "utf-8",
    );
    await fs.writeFile(
      path.join(tempDir, "CLAUDE.md"),
      agentsMdContent,
      "utf-8",
    );

    const results = await syncRootAgentFiles(tempDir);
    const agentsResult = results.find(({ file }) => file === "AGENTS.md");

    assert({
      given: "AGENTS.md has stale content",
      should: "report updated action",
      actual: agentsResult?.action,
      expected: "updated",
    });

    assert({
      given: "AGENTS.md updated",
      should: "now contain the current template",
      actual: await fs.readFile(path.join(tempDir, "AGENTS.md"), "utf-8"),
      expected: agentsMdContent,
    });
  });
});

describe("ensureClaudeMd", () => {
  let tempDir = "";

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-claude-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("creates CLAUDE.md with agentsMdContent when no CLAUDE.md exists", async () => {
    const result = await ensureClaudeMd(tempDir);

    assert({
      given: "no CLAUDE.md exists",
      should: "report created action",
      actual: result.action,
      expected: "created",
    });

    assert({
      given: "CLAUDE.md just created",
      should: "contain the agentsMdContent template",
      actual: await fs.readFile(path.join(tempDir, "CLAUDE.md"), "utf-8"),
      expected: agentsMdContent,
    });
  });

  test("appends AGENTS.md reference when CLAUDE.md exists without it", async () => {
    await fs.writeFile(
      path.join(tempDir, "CLAUDE.md"),
      "# My CLAUDE.md\n\nCustom content.",
      "utf-8",
    );

    const result = await ensureClaudeMd(tempDir);

    assert({
      given: "CLAUDE.md without AGENTS.md reference or directives",
      should: "report appended action",
      actual: result.action,
      expected: "appended",
    });

    const content = await fs.readFile(path.join(tempDir, "CLAUDE.md"), "utf-8");
    assert({
      given: "CLAUDE.md after appending",
      should: "contain a reference to AGENTS.md",
      actual: content.includes("AGENTS.md"),
      expected: true,
    });
  });
});
