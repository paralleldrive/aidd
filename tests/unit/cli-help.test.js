import { assert } from "riteway/vitest";
import { describe, test } from "vitest";
import { exec } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import path from "path";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliPath = path.join(__dirname, "../../bin/aidd.js");

describe("CLI help command", () => {
  test("help output includes README intro", async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);

    assert({
      given: "CLI help command is run",
      should: "include AIDD with SudoLang.ai intro from README",
      actual:
        stdout.includes("AIDD with SudoLang.ai") &&
        stdout.includes("The standard library for AI Driven Development"),
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
