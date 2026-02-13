import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliPath = path.join(__dirname, "./aidd.js");

describe("CLI create-next-shadcn command", () => {
  test("help output includes create-next-shadcn command", async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);

    assert({
      given: "CLI help command is run",
      should: "include create-next-shadcn in Quick Start section",
      actual: stdout.includes("create-next-shadcn"),
      expected: true,
    });
  });

  test("create-next-shadcn command has help", async () => {
    const { stdout } = await execAsync(
      `node ${cliPath} create-next-shadcn --help`,
    );

    assert({
      given: "create-next-shadcn help is requested",
      should: "show command description",
      actual:
        stdout.includes("create-next-shadcn") && stdout.includes("Next.js"),
      expected: true,
    });
  });

  test("create-next-shadcn accepts project name argument", async () => {
    const { stdout } = await execAsync(
      `node ${cliPath} create-next-shadcn --help`,
    );

    assert({
      given: "create-next-shadcn help is requested",
      should: "show project-name argument",
      actual: stdout.includes("[project-name]"),
      expected: true,
    });
  });
});
