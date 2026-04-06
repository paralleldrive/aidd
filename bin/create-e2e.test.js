import { exec } from "child_process";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  test,
} from "vitest";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Shared state for the scaffold-example create tests (runs npm install once)
const scaffoldExampleCtx = {
  tempDir: null,
  projectDir: null,
  pkg: null,
  stdout: null,
};

describe("aidd create scaffold-example", () => {
  beforeAll(async () => {
    // Run `npx aidd create scaffold-example` once and capture all outputs.
    // Each test below asserts a single requirement against the shared result —
    // this avoids repeating the expensive npm install for every assertion.
    scaffoldExampleCtx.tempDir = path.join(
      os.tmpdir(),
      `aidd-e2e-create-${Date.now()}`,
    );
    await fs.ensureDir(scaffoldExampleCtx.tempDir);
    scaffoldExampleCtx.projectDir = path.join(
      scaffoldExampleCtx.tempDir,
      "test-project",
    );

    const { stdout } = await execAsync(
      `npx aidd create scaffold-example "${scaffoldExampleCtx.projectDir}"`,
      { timeout: 180_000 },
    );
    scaffoldExampleCtx.stdout = stdout;
    scaffoldExampleCtx.pkg = await fs.readJson(
      path.join(scaffoldExampleCtx.projectDir, "package.json"),
    );
  }, 180_000);

  afterAll(async () => {
    await fs.remove(scaffoldExampleCtx.tempDir);
  });

  test("creates the target directory", async () => {
    const exists = await fs.pathExists(scaffoldExampleCtx.projectDir);

    assert({
      given: "aidd create scaffold-example test-project",
      should: "create the test-project directory",
      actual: exists,
      expected: true,
    });
  });

  test("initializes a package.json in the project", async () => {
    const pkgPath = path.join(scaffoldExampleCtx.projectDir, "package.json");
    const exists = await fs.pathExists(pkgPath);

    assert({
      given: "scaffold-example scaffold runs",
      should: "create a package.json in the project directory",
      actual: exists,
      expected: true,
    });
  });

  test("copies SCAFFOLD-MANIFEST.yml into the project directory", async () => {
    const manifestPath = path.join(
      scaffoldExampleCtx.projectDir,
      "SCAFFOLD-MANIFEST.yml",
    );
    const exists = await fs.pathExists(manifestPath);
    assert({
      given: "scaffold-example create",
      should: "copy SCAFFOLD-MANIFEST.yml into the project directory",
      actual: exists,
      expected: true,
    });
  });

  test("installs all expected dev dependencies", async () => {
    const { devDependencies } = scaffoldExampleCtx.pkg;
    const expected = [
      "riteway",
      "vitest",
      "@playwright/test",
      "error-causes",
      "@paralleldrive/cuid2",
      "release-it",
    ];

    assert({
      given: "scaffold-example create",
      should: "install all expected dev dependencies",
      actual: expected.filter((dep) => !(dep in devDependencies)),
      expected: [],
    });
  });

  test("configures expected package.json scripts", async () => {
    const { scripts } = scaffoldExampleCtx.pkg;

    assert({
      given: "scaffold-example create",
      should: "configure test and release scripts",
      actual: { test: scripts.test, release: scripts.release },
      expected: { test: "vitest run", release: "release-it" },
    });
  });

  test("prints scaffold complete message on success", () => {
    assert({
      given: "scaffold-example (named scaffold) completes successfully",
      should: "print the scaffold complete message",
      actual: scaffoldExampleCtx.stdout.includes("Scaffold complete"),
      expected: true,
    });
  });
});

describe("aidd create with AIDD_CUSTOM_CREATE_URI env var", () => {
  const envCtx = { tempDir: null, projectDir: null };

  beforeAll(async () => {
    envCtx.tempDir = path.join(os.tmpdir(), `aidd-e2e-env-${Date.now()}`);
    await fs.ensureDir(envCtx.tempDir);
    envCtx.projectDir = path.join(envCtx.tempDir, "env-project");

    const scaffoldExamplePath = path.resolve(
      __dirname,
      "../ai/scaffolds/scaffold-example",
    );
    const uri = `file://${scaffoldExamplePath}`;

    await execAsync(`npx aidd create "${envCtx.projectDir}"`, {
      env: { ...process.env, AIDD_CUSTOM_CREATE_URI: uri },
      timeout: 180_000,
    });
  }, 180_000);

  afterAll(async () => {
    await fs.remove(envCtx.tempDir);
  });

  test("uses file:// URI from AIDD_CUSTOM_CREATE_URI over default", async () => {
    const pkgPath = path.join(envCtx.projectDir, "package.json");
    const exists = await fs.pathExists(pkgPath);

    assert({
      given: "AIDD_CUSTOM_CREATE_URI set to a file:// URI",
      should: "use that URI as the extension source and scaffold the project",
      actual: exists,
      expected: true,
    });
  });
});

describe("aidd create --agent-config flag", () => {
  let tempDir;
  let echoAgentConfigPath;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-e2e-agent-${Date.now()}`);
    await fs.ensureDir(tempDir);

    // Create a YAML agent config that uses 'echo' as the command —
    // resolveAgentConfig loads it as { command: 'echo' } so the prompt
    // step spawns `echo <prompt>` instead of a real AI CLI.
    echoAgentConfigPath = path.join(tempDir, "echo-agent.yml");
    await fs.writeFile(echoAgentConfigPath, "command: echo\n");

    // Create a minimal scaffold fixture with a prompt step
    const scaffoldDir = path.join(tempDir, "agent-test-scaffold");
    await fs.ensureDir(scaffoldDir);
    await fs.writeFile(
      path.join(scaffoldDir, "README.md"),
      "# Agent Test Scaffold",
    );
    await fs.writeFile(
      path.join(scaffoldDir, "SCAFFOLD-MANIFEST.yml"),
      "steps:\n  - run: npx aidd --version\n  - prompt: hello world\n",
    );
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("passes the agent config to prompt step invocations", async () => {
    const scaffoldUri = `file://${path.join(tempDir, "agent-test-scaffold")}`;

    // Use the echo-agent YAML config: resolveAgentConfig loads { command: 'echo' }
    // so the prompt step runs `echo hello world` and exits successfully.
    const agentProjectDir = path.join(tempDir, "agent-project");
    const { stdout } = await execAsync(
      `npx aidd create --agent-config "${echoAgentConfigPath}" "${scaffoldUri}" "${agentProjectDir}"`,
      { timeout: 30_000 },
    );

    // The project directory should be created
    const dirExists = await fs.pathExists(agentProjectDir);

    assert({
      given:
        "--agent-config <yaml-config> flag with a scaffold containing a prompt step",
      should: "run the prompt step using the specified agent config",
      actual: dirExists,
      expected: true,
    });

    assert({
      given:
        "--agent-config echo-agent.yml with a manifest prompt step containing 'hello world'",
      should:
        "include the prompt text in stdout, proving the agent was invoked with it",
      actual: stdout.includes("hello world"),
      expected: true,
    });
  }, 30_000);
});

describe("aidd agent command", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-e2e-agent-cmd-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("exits 0 and echoes the prompt when using an echo agent config", async () => {
    const configPath = path.join(tempDir, "echo-agent.yml");
    await fs.writeFile(configPath, "command: echo\n");

    const { stdout } = await execAsync(
      `npx aidd agent --prompt "hello" --agent-config "${configPath}"`,
      { timeout: 10_000 },
    );

    assert({
      given: "aidd agent --prompt hello with an echo agent config",
      should: "exit 0 and include the prompt text in stdout",
      actual: stdout.includes("hello"),
      expected: true,
    });
  }, 10_000);

  test("exits 1 when --prompt is not provided", async () => {
    let exitCode = 0;
    try {
      await execAsync("npx aidd agent", { timeout: 10_000 });
    } catch (err) {
      exitCode = err.code;
    }

    assert({
      given: "aidd agent invoked without --prompt",
      should: "exit with code 1",
      actual: exitCode,
      expected: 1,
    });
  }, 10_000);

  test("exits 1 when the agent config file does not exist", async () => {
    let exitCode = 0;
    try {
      await execAsync(
        `npx aidd agent --prompt "hello" --agent-config "${tempDir}/nonexistent.yml"`,
        { timeout: 10_000 },
      );
    } catch (err) {
      exitCode = err.code;
    }

    assert({
      given: "aidd agent with a non-existent agent config YAML path",
      should: "exit with code 1",
      actual: exitCode,
      expected: 1,
    });
  }, 10_000);
});

describe("aidd create — error paths", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-e2e-errors-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("exits non-zero for an unknown named scaffold", async () => {
    let err;
    try {
      await execAsync(
        `npx aidd create nonexistent-scaffold-xyz "${path.join(tempDir, "my-project")}"`,
      );
    } catch (e) {
      err = e;
    }
    assert({
      given: "an unknown scaffold name",
      should: "exit with code 1",
      actual: err?.code,
      expected: 1,
    });
  });

  test("exits non-zero when a URI is given without a folder argument", async () => {
    let err;
    try {
      await execAsync(`npx aidd create https://example.com`);
    } catch (e) {
      err = e;
    }
    assert({
      given: "a URI with no folder argument",
      should: "exit with code 1",
      actual: err?.code,
      expected: 1,
    });
  });

  test("exits non-zero for a file:// URI pointing to a non-existent path", async () => {
    let err;
    try {
      await execAsync(
        `npx aidd create "file:///tmp/nonexistent-scaffold-xyz" "${path.join(tempDir, "my-project")}"`,
      );
    } catch (e) {
      err = e;
    }
    assert({
      given: "a non-existent file:// scaffold path",
      should: "exit with code 1",
      actual: err?.code,
      expected: 1,
    });
  });

  test("exits non-zero when the destination folder already exists", async () => {
    const existingFolder = path.join(tempDir, "already-exists");
    await fs.ensureDir(existingFolder);

    let err;
    try {
      await execAsync(`npx aidd create scaffold-example "${existingFolder}"`);
    } catch (e) {
      err = e;
    }
    assert({
      given: "a destination folder that already exists",
      should: "exit with code 1",
      actual: err?.code,
      expected: 1,
    });
  });
});
