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

describe("CLI vibe options in help", () => {
  test("help output includes --vibe option", async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);

    assert({
      given: "CLI help command is run",
      should: "include --vibe option",
      actual: stdout.includes("--vibe"),
      expected: true,
    });
  });

  test("help output includes --title option", async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);

    assert({
      given: "CLI help command is run",
      should: "include --title option with description",
      actual:
        stdout.includes("--title") &&
        stdout.includes("vibe title (required with --vibe)"),
      expected: true,
    });
  });

  test("help output includes --prompt option", async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);

    assert({
      given: "CLI help command is run",
      should: "include --prompt option with description",
      actual:
        stdout.includes("--prompt") &&
        stdout.includes("AI generation prompt (required with --vibe)"),
      expected: true,
    });
  });

  test("help output includes vibe generation example", async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);

    assert({
      given: "CLI help command is run",
      should: "include Vibe Generation section with usage example",
      actual:
        stdout.includes("Vibe Generation") &&
        stdout.includes('npx aidd --vibe --title "My App"'),
      expected: true,
    });
  });

  test("help output includes optional vibe options", async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);

    assert({
      given: "CLI help command is run",
      should: "include --entry, --runner, and --visibility options",
      actual:
        stdout.includes("--entry") &&
        stdout.includes("--runner") &&
        stdout.includes("--visibility"),
      expected: true,
    });
  });
});

describe("CLI vibe validation errors", () => {
  test("--vibe without --title shows error", async () => {
    try {
      await execAsync(`node ${cliPath} --vibe`);
      // Should not reach here
      assert({
        given: "--vibe without --title",
        should: "exit with error",
        actual: false,
        expected: true,
      });
    } catch (error) {
      assert({
        given: "--vibe without --title",
        should: "show error message about missing --title",
        actual: error.stderr.includes("--title is required when using --vibe"),
        expected: true,
      });
    }
  });

  test("--vibe without --title shows usage hint", async () => {
    try {
      await execAsync(`node ${cliPath} --vibe`);
    } catch (error) {
      assert({
        given: "--vibe without --title",
        should: "show usage hint with example",
        actual: error.stderr.includes(
          'npx aidd --vibe --title "My App" --prompt "Create a todo app"',
        ),
        expected: true,
      });
    }
  });

  test("--vibe with --title but without --prompt shows error", async () => {
    try {
      await execAsync(`node ${cliPath} --vibe --title "Test App"`);
      // Should not reach here
      assert({
        given: "--vibe --title without --prompt",
        should: "exit with error",
        actual: false,
        expected: true,
      });
    } catch (error) {
      assert({
        given: "--vibe --title without --prompt",
        should: "show error message about missing --prompt",
        actual: error.stderr.includes("--prompt is required when using --vibe"),
        expected: true,
      });
    }
  });

  test("--vibe with --title but without --prompt shows usage hint", async () => {
    try {
      await execAsync(`node ${cliPath} --vibe --title "Test App"`);
    } catch (error) {
      assert({
        given: "--vibe --title without --prompt",
        should: "show usage hint with example",
        actual: error.stderr.includes(
          'npx aidd --vibe --title "My App" --prompt "Create a todo app"',
        ),
        expected: true,
      });
    }
  });

  test("--vibe exits with code 1 when missing --title", async () => {
    try {
      await execAsync(`node ${cliPath} --vibe`);
      assert({
        given: "--vibe without --title",
        should: "exit with non-zero code",
        actual: false,
        expected: true,
      });
    } catch (error) {
      // exec throws when exit code is non-zero
      assert({
        given: "--vibe without --title",
        should: "exit with non-zero code (error thrown)",
        actual: error.code !== 0,
        expected: true,
      });
    }
  });

  test("--vibe exits with code 1 when missing --prompt", async () => {
    try {
      await execAsync(`node ${cliPath} --vibe --title "Test"`);
      assert({
        given: "--vibe --title without --prompt",
        should: "exit with non-zero code",
        actual: false,
        expected: true,
      });
    } catch (error) {
      // exec throws when exit code is non-zero
      assert({
        given: "--vibe --title without --prompt",
        should: "exit with non-zero code (error thrown)",
        actual: error.code !== 0,
        expected: true,
      });
    }
  });
});

describe("CLI vibe successful execution", () => {
  test("--vibe with --title and --prompt succeeds", async () => {
    const { stdout } = await execAsync(
      `node ${cliPath} --vibe --dry-run --title "Test App" --prompt "Create a test"`,
    );

    assert({
      given: "--vibe with --title and --prompt",
      should: "execute vibe generation",
      actual: stdout.includes("Executing vibe generation"),
      expected: true,
    });
  });

  test("--vibe displays title in output", async () => {
    const { stdout } = await execAsync(
      `node ${cliPath} --vibe --dry-run --title "My Test App" --prompt "Create something"`,
    );

    assert({
      given: "--vibe with --title",
      should: "display the title in output",
      actual: stdout.includes("Title: My Test App"),
      expected: true,
    });
  });

  test("--vibe displays prompt in output", async () => {
    const { stdout } = await execAsync(
      `node ${cliPath} --vibe --dry-run --title "Test" --prompt "Build a calculator"`,
    );

    assert({
      given: "--vibe with --prompt",
      should: "display the prompt in output",
      actual: stdout.includes("Prompt: Build a calculator"),
      expected: true,
    });
  });

  test("--vibe uses default visibility of public", async () => {
    const { stdout } = await execAsync(
      `node ${cliPath} --vibe --dry-run --title "Test" --prompt "Create app"`,
    );

    assert({
      given: "--vibe without --visibility",
      should: "default to public visibility",
      actual: stdout.includes("Visibility: public"),
      expected: true,
    });
  });

  test("--vibe accepts custom visibility", async () => {
    const { stdout } = await execAsync(
      `node ${cliPath} --vibe --dry-run --title "Test" --prompt "Create app" --visibility unlisted`,
    );

    assert({
      given: "--vibe with --visibility unlisted",
      should: "use specified visibility",
      actual: stdout.includes("Visibility: unlisted"),
      expected: true,
    });
  });

  test("--vibe accepts optional --entry parameter", async () => {
    const { stdout } = await execAsync(
      `node ${cliPath} --vibe --dry-run --title "Test" --prompt "Create app" --entry index.html`,
    );

    assert({
      given: "--vibe with --entry",
      should: "display entry in output",
      actual: stdout.includes("Entry: index.html"),
      expected: true,
    });
  });

  test("--vibe accepts optional --runner parameter", async () => {
    const { stdout } = await execAsync(
      `node ${cliPath} --vibe --dry-run --title "Test" --prompt "Create app" --runner webcontainer`,
    );

    assert({
      given: "--vibe with --runner",
      should: "display runner in output",
      actual: stdout.includes("Runner: webcontainer"),
      expected: true,
    });
  });
});
