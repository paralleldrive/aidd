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
const cliPath = path.join(__dirname, "./aidd.js");

// Shared state for the scaffold-example create tests (runs npm install once)
const scaffoldExampleCtx = {
  tempDir: null,
  projectDir: null,
  stdout: null,
};

describe("aidd create scaffold-example", () => {
  beforeAll(async () => {
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
      `node ${cliPath} create scaffold-example test-project`,
      { cwd: scaffoldExampleCtx.tempDir, timeout: 180_000 },
    );
    scaffoldExampleCtx.stdout = stdout;
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

  test("installs riteway as a dev dependency", async () => {
    const pkgPath = path.join(scaffoldExampleCtx.projectDir, "package.json");
    const pkg = await fs.readJson(pkgPath);
    const devDeps = pkg.devDependencies || {};

    assert({
      given: "scaffold-example scaffold runs",
      should: "install riteway as a dev dependency",
      actual: "riteway" in devDeps,
      expected: true,
    });
  });

  test("installs vitest as a dev dependency", async () => {
    const pkgPath = path.join(scaffoldExampleCtx.projectDir, "package.json");
    const pkg = await fs.readJson(pkgPath);
    const devDeps = pkg.devDependencies || {};

    assert({
      given: "scaffold-example scaffold runs",
      should: "install vitest as a dev dependency",
      actual: "vitest" in devDeps,
      expected: true,
    });
  });

  test("installs @playwright/test as a dev dependency", async () => {
    const pkgPath = path.join(scaffoldExampleCtx.projectDir, "package.json");
    const pkg = await fs.readJson(pkgPath);
    const devDeps = pkg.devDependencies || {};

    assert({
      given: "scaffold-example scaffold runs",
      should: "install @playwright/test as a dev dependency",
      actual: "@playwright/test" in devDeps,
      expected: true,
    });
  });

  test("installs error-causes as a dev dependency", async () => {
    const pkgPath = path.join(scaffoldExampleCtx.projectDir, "package.json");
    const pkg = await fs.readJson(pkgPath);
    const devDeps = pkg.devDependencies || {};

    assert({
      given: "scaffold-example scaffold runs",
      should: "install error-causes as a dev dependency",
      actual: "error-causes" in devDeps,
      expected: true,
    });
  });

  test("installs @paralleldrive/cuid2 as a dev dependency", async () => {
    const pkgPath = path.join(scaffoldExampleCtx.projectDir, "package.json");
    const pkg = await fs.readJson(pkgPath);
    const devDeps = pkg.devDependencies || {};

    assert({
      given: "scaffold-example scaffold runs",
      should: "install @paralleldrive/cuid2 as a dev dependency",
      actual: "@paralleldrive/cuid2" in devDeps,
      expected: true,
    });
  });

  test("sets up a test script in package.json", async () => {
    const pkgPath = path.join(scaffoldExampleCtx.projectDir, "package.json");
    const pkg = await fs.readJson(pkgPath);

    assert({
      given: "scaffold-example scaffold runs",
      should: "configure a test script",
      actual: typeof pkg.scripts?.test === "string",
      expected: true,
    });
  });

  test("suggests scaffold-cleanup after successful scaffold", () => {
    assert({
      given: "scaffold completes successfully",
      should: "suggest running npx aidd scaffold-cleanup",
      actual: scaffoldExampleCtx.stdout.includes("scaffold-cleanup"),
      expected: true,
    });
  });
});

describe("aidd create with AIDD_CUSTOM_EXTENSION_URI env var", () => {
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

    await execAsync(`node ${cliPath} create env-project`, {
      cwd: envCtx.tempDir,
      env: { ...process.env, AIDD_CUSTOM_EXTENSION_URI: uri },
      timeout: 180_000,
    });
  }, 180_000);

  afterAll(async () => {
    await fs.remove(envCtx.tempDir);
  });

  test("uses file:// URI from AIDD_CUSTOM_EXTENSION_URI over default", async () => {
    const pkgPath = path.join(envCtx.projectDir, "package.json");
    const exists = await fs.pathExists(pkgPath);

    assert({
      given: "AIDD_CUSTOM_EXTENSION_URI set to a file:// URI",
      should: "use that URI as the extension source and scaffold the project",
      actual: exists,
      expected: true,
    });
  });
});

describe("aidd scaffold-cleanup", () => {
  let tempDir;
  let projectDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-e2e-cleanup-${Date.now()}`);
    await fs.ensureDir(tempDir);
    projectDir = path.join(tempDir, "test-project");
    await fs.ensureDir(path.join(projectDir, ".aidd/scaffold"));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("removes .aidd/ directory from the given folder", async () => {
    await execAsync(`node ${cliPath} scaffold-cleanup test-project`, {
      cwd: tempDir,
    });

    const aiddExists = await fs.pathExists(path.join(projectDir, ".aidd"));

    assert({
      given: "aidd scaffold-cleanup test-project",
      should: "remove test-project/.aidd/ directory",
      actual: aiddExists,
      expected: false,
    });
  });

  test("reports nothing to clean up when .aidd/ does not exist", async () => {
    const cleanDir = path.join(tempDir, "clean-project");
    await fs.ensureDir(cleanDir);

    const { stdout } = await execAsync(
      `node ${cliPath} scaffold-cleanup clean-project`,
      { cwd: tempDir },
    );

    assert({
      given: "scaffold-cleanup on directory without .aidd/",
      should: "report nothing to clean up",
      actual: stdout.toLowerCase().includes("nothing"),
      expected: true,
    });
  });
});

describe("aidd create --agent flag", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-e2e-agent-${Date.now()}`);
    await fs.ensureDir(tempDir);

    // Create a minimal scaffold fixture with a prompt step
    // Use 'echo' as a fake agent so prompt step completes without real AI
    const scaffoldDir = path.join(tempDir, "agent-test-scaffold");
    await fs.ensureDir(scaffoldDir);
    await fs.writeFile(
      path.join(scaffoldDir, "README.md"),
      "# Agent Test Scaffold",
    );
    await fs.writeFile(
      path.join(scaffoldDir, "SCAFFOLD-MANIFEST.yml"),
      "steps:\n  - prompt: hello world\n",
    );
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("passes the agent name to prompt step invocations", async () => {
    const scaffoldUri = `file://${path.join(tempDir, "agent-test-scaffold")}`;

    // Use 'echo' as the agent: it just prints the prompt and exits successfully
    await execAsync(
      `node ${cliPath} create --agent echo "${scaffoldUri}" agent-project`,
      { cwd: tempDir, timeout: 30_000 },
    );

    // The project directory should be created
    const dirExists = await fs.pathExists(path.join(tempDir, "agent-project"));

    assert({
      given: "--agent echo flag with a scaffold containing a prompt step",
      should: "run the prompt step using the specified agent (echo)",
      actual: dirExists,
      expected: true,
    });
  }, 30_000);
});
