import { assert } from "riteway/vitest";
import { describe, test, beforeEach, afterEach } from "vitest";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

import { executeClone } from "./cli-core.js";
import { hasAllDirectives } from "./agents-md.js";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliPath = path.join(__dirname, "../bin/aidd.js");

describe("AGENTS.md integration", () => {
  const tempTestDir = path.join(__dirname, "temp-agents-test");
  const agentsPath = path.join(tempTestDir, "AGENTS.md");

  beforeEach(async () => {
    if (await fs.pathExists(tempTestDir)) {
      await fs.remove(tempTestDir);
    }
    await fs.ensureDir(tempTestDir);
  });

  afterEach(async () => {
    if (await fs.pathExists(tempTestDir)) {
      await fs.remove(tempTestDir);
    }
  });

  test("installer creates AGENTS.md when it does not exist", async () => {
    await executeClone({
      targetDirectory: tempTestDir,
    });

    const agentsExists = await fs.pathExists(agentsPath);

    assert({
      given: "fresh installation",
      should: "create AGENTS.md file",
      actual: agentsExists,
      expected: true,
    });

    const content = await fs.readFile(agentsPath, "utf-8");

    assert({
      given: "created AGENTS.md",
      should: "contain all required directives",
      actual: hasAllDirectives(content),
      expected: true,
    });
  });

  test("installer does not overwrite existing AGENTS.md with all directives", async () => {
    // Create custom AGENTS.md with all directives
    const customContent = `# Custom AGENTS.md

This is my custom content.

Look at ai/ directory listings.
Read index.md files.
Only use root index until needed.
Always read the vision document first.
Report conflict resolution to the user.
`;
    await fs.writeFile(agentsPath, customContent);

    await executeClone({
      targetDirectory: tempTestDir,
      force: true, // Force needed for ai/ folder
    });

    const content = await fs.readFile(agentsPath, "utf-8");

    assert({
      given: "existing AGENTS.md with all directives",
      should: "preserve original content",
      actual: content,
      expected: customContent,
    });
  });

  test("installer appends directives to existing AGENTS.md missing them", async () => {
    const originalContent = "# My Custom AGENTS.md\n\nSome custom content.";
    await fs.writeFile(agentsPath, originalContent);

    await executeClone({
      targetDirectory: tempTestDir,
      force: true,
    });

    const content = await fs.readFile(agentsPath, "utf-8");

    assert({
      given: "existing AGENTS.md missing directives",
      should: "preserve original content at start",
      actual: content.startsWith(originalContent),
      expected: true,
    });

    assert({
      given: "existing AGENTS.md after append",
      should: "now have all required directives",
      actual: hasAllDirectives(content),
      expected: true,
    });
  });

  test("AGENTS.md contains vision document directive", async () => {
    await executeClone({
      targetDirectory: tempTestDir,
    });

    const content = await fs.readFile(agentsPath, "utf-8");

    assert({
      given: "created AGENTS.md",
      should: "mention vision document",
      actual: content.toLowerCase().includes("vision"),
      expected: true,
    });
  });

  test("AGENTS.md contains conflict resolution directive", async () => {
    await executeClone({
      targetDirectory: tempTestDir,
    });

    const content = await fs.readFile(agentsPath, "utf-8");

    assert({
      given: "created AGENTS.md",
      should: "mention conflict resolution",
      actual: content.toLowerCase().includes("conflict"),
      expected: true,
    });
  });
});

describe("--index CLI command integration", () => {
  const tempTestDir = path.join(__dirname, "temp-index-test");
  const aiPath = path.join(tempTestDir, "ai");

  beforeEach(async () => {
    if (await fs.pathExists(tempTestDir)) {
      await fs.remove(tempTestDir);
    }
    await fs.ensureDir(tempTestDir);

    // Create ai/ structure with test files
    await fs.ensureDir(path.join(aiPath, "commands"));
    await fs.ensureDir(path.join(aiPath, "rules"));

    // Create test files with frontmatter
    await fs.writeFile(
      path.join(aiPath, "commands", "test.md"),
      `---
description: Test command for integration testing
---
# Test Command

This is a test command.
`,
    );

    await fs.writeFile(
      path.join(aiPath, "rules", "test-rule.mdc"),
      `---
description: Test rule for TDD
globs: "**/*.test.js"
alwaysApply: false
---
# Test Rule

This is a test rule.
`,
    );
  });

  afterEach(async () => {
    if (await fs.pathExists(tempTestDir)) {
      await fs.remove(tempTestDir);
    }
  });

  test("--index generates index.md files", async () => {
    const { stdout, stderr } = await execAsync(
      `node ${cliPath} --index "${tempTestDir}"`,
    );

    const aiIndexExists = await fs.pathExists(path.join(aiPath, "index.md"));
    const commandsIndexExists = await fs.pathExists(
      path.join(aiPath, "commands", "index.md"),
    );
    const rulesIndexExists = await fs.pathExists(
      path.join(aiPath, "rules", "index.md"),
    );

    assert({
      given: "--index command",
      should: "create ai/index.md",
      actual: aiIndexExists,
      expected: true,
    });

    assert({
      given: "--index command",
      should: "create ai/commands/index.md",
      actual: commandsIndexExists,
      expected: true,
    });

    assert({
      given: "--index command",
      should: "create ai/rules/index.md",
      actual: rulesIndexExists,
      expected: true,
    });
  });

  test("generated index includes file descriptions from frontmatter", async () => {
    await execAsync(`node ${cliPath} --index "${tempTestDir}"`);

    const commandsIndex = await fs.readFile(
      path.join(aiPath, "commands", "index.md"),
      "utf-8",
    );

    assert({
      given: "generated commands index",
      should: "include file description from frontmatter",
      actual: commandsIndex.includes("Test command for integration testing"),
      expected: true,
    });
  });

  test("generated index includes globs info when present", async () => {
    await execAsync(`node ${cliPath} --index "${tempTestDir}"`);

    const rulesIndex = await fs.readFile(
      path.join(aiPath, "rules", "index.md"),
      "utf-8",
    );

    assert({
      given: "generated rules index with globs",
      should: "include Applies to info",
      actual: rulesIndex.includes("**/*.test.js"),
      expected: true,
    });
  });

  test("generated index links to subdirectories", async () => {
    await execAsync(`node ${cliPath} --index "${tempTestDir}"`);

    const aiIndex = await fs.readFile(path.join(aiPath, "index.md"), "utf-8");

    assert({
      given: "generated ai/index.md",
      should: "link to commands subdirectory",
      actual: aiIndex.includes("commands/index.md"),
      expected: true,
    });

    assert({
      given: "generated ai/index.md",
      should: "link to rules subdirectory",
      actual: aiIndex.includes("rules/index.md"),
      expected: true,
    });
  });

  test("--index with --verbose shows generated file paths", async () => {
    const { stdout } = await execAsync(
      `node ${cliPath} --index --verbose "${tempTestDir}"`,
    );

    assert({
      given: "--index --verbose command",
      should: "show generated file paths",
      actual: stdout.includes("index.md"),
      expected: true,
    });
  });

  test("--index fails gracefully when ai/ does not exist", async () => {
    const emptyDir = path.join(__dirname, "temp-empty-test");
    await fs.ensureDir(emptyDir);

    try {
      await execAsync(`node ${cliPath} --index "${emptyDir}"`, {
        encoding: "utf-8",
      });
      // Should not reach here - command should fail
      throw new Error("Expected command to fail");
    } catch (error) {
      // Command exits with non-zero - this is expected
      assert({
        given: "--index on directory without ai/",
        should: "exit with error",
        actual: error.code !== 0,
        expected: true,
      });

      const output = (error.stderr || "") + (error.stdout || "");
      assert({
        given: "--index on directory without ai/",
        should: "show error message about not found",
        actual: output.includes("not found"),
        expected: true,
      });
    } finally {
      await fs.remove(emptyDir);
    }
  });
});

describe("full installer workflow integration", () => {
  const tempTestDir = path.join(__dirname, "temp-full-test");

  beforeEach(async () => {
    if (await fs.pathExists(tempTestDir)) {
      await fs.remove(tempTestDir);
    }
    await fs.ensureDir(tempTestDir);
  });

  afterEach(async () => {
    if (await fs.pathExists(tempTestDir)) {
      await fs.remove(tempTestDir);
    }
  });

  test("full installation creates AGENTS.md and ai/ with index files", async () => {
    // Run full installation
    await executeClone({
      targetDirectory: tempTestDir,
    });

    // Check AGENTS.md was created
    const agentsExists = await fs.pathExists(
      path.join(tempTestDir, "AGENTS.md"),
    );

    // Check ai/ folder was created
    const aiExists = await fs.pathExists(path.join(tempTestDir, "ai"));

    assert({
      given: "full installation",
      should: "create AGENTS.md",
      actual: agentsExists,
      expected: true,
    });

    assert({
      given: "full installation",
      should: "create ai/ folder",
      actual: aiExists,
      expected: true,
    });
  });
});
