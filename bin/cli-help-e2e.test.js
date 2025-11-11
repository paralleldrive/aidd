import { assert } from "riteway/vitest";
import { describe, test } from "vitest";
import { exec } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import path from "path";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliPath = path.join(__dirname, "./aidd.js");

describe("CLI help command", () => {
  test("help output includes README intro", async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);

    assert({
      given: "CLI help command is run",
      should: "include SudoLang AIDD intro from README",
      actual:
        stdout.includes("SudoLang AIDD") &&
        stdout.includes("The standard framework for AI Driven Development"),
      expected: true,
    });
  });

  test("help output includes SudoLang description", async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);

    assert({
      given: "CLI help command is run",
      should: "include SudoLang description from README",
      actual: stdout.includes(
        "SudoLang is a pseudocode language for prompting large language models",
      ),
      expected: true,
    });
  });

  test("help output includes About the Author section at end", async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);

    assert({
      given: "CLI help command is run",
      should: "include About the Author section",
      actual:
        stdout.includes("About the Author") &&
        stdout.includes("Eric Elliott") &&
        stdout.includes("The Art of Effortless Programming"),
      expected: true,
    });
  });

  test("About the Author appears after main help content", async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);
    const authorIndex = stdout.indexOf("About the Author");
    const optionsIndex = stdout.indexOf("Options:");

    assert({
      given: "CLI help command is run",
      should: "show About the Author after the main help content",
      actual: authorIndex > optionsIndex && authorIndex > 0,
      expected: true,
    });
  });

  test("help output includes Quick Start section", async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);

    assert({
      given: "CLI help command is run",
      should: "include Quick Start section with installation commands",
      actual:
        stdout.includes("Quick Start") &&
        stdout.includes("npx aidd --cursor") &&
        stdout.includes("npx aidd my-project"),
      expected: true,
    });
  });

  test("Quick Start appears before About the Author", async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);
    const quickStartIndex = stdout.indexOf("Quick Start");
    const authorIndex = stdout.indexOf("About the Author");

    assert({
      given: "CLI help command is run",
      should: "show Quick Start before About the Author section",
      actual: quickStartIndex > 0 && quickStartIndex < authorIndex,
      expected: true,
    });
  });

  test("workflow commands include AI assistant context", async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);

    assert({
      given: "CLI help command is run",
      should: "clarify that workflow commands are for AI assistants",
      actual: stdout.includes("use in your AI assistant chat"),
      expected: true,
    });
  });

  test("workflow commands include complete command list", async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);

    assert({
      given: "CLI help command is run",
      should: "include all six workflow commands",
      actual:
        stdout.includes("/discover") &&
        stdout.includes("/task") &&
        stdout.includes("/execute") &&
        stdout.includes("/review") &&
        stdout.includes("/log") &&
        stdout.includes("/commit"),
      expected: true,
    });
  });

  test("workflow commands include AI agent instruction", async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);

    assert({
      given: "CLI help command is run",
      should: "instruct users to ask their AI agent for help",
      actual: stdout.includes("ask your AI agent: /help"),
      expected: true,
    });
  });

  test("help includes instruction for command-specific help", async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);

    assert({
      given: "CLI help command is run",
      should: "show how to get help for specific commands in AI chat",
      actual:
        stdout.includes("/help [command]") &&
        stdout.includes("e.g. /help discover"),
      expected: true,
    });
  });

  test("Quick Start matches README structure", async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);

    assert({
      given: "CLI help command is run",
      should: "show Quick Start section with README format",
      actual:
        stdout.includes("Quick Start") &&
        stdout.includes("To install for Cursor:") &&
        stdout.includes("Install without Cursor integration:"),
      expected: true,
    });
  });

  test("help does not include redundant Examples section", async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);
    const hasExamplesSection = stdout.includes("Examples\n\nBasic usage:");

    assert({
      given: "CLI help command is run",
      should: "not include redundant Examples section after Quick Start",
      actual: hasExamplesSection,
      expected: false,
    });
  });
});

describe("CLI success message", () => {
  test("success message excludes About the Author text", async () => {
    // Test with dry-run and force to avoid file operation errors
    const { stdout } = await execAsync(`node ${cliPath} --dry-run --force`);

    assert({
      given: "CLI command completes successfully",
      should: "not include About the Author in success message",
      actual: stdout.includes("About the Author"),
      expected: false,
    });
  });
});
