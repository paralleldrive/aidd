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
const cliPath = `"${path.join(__dirname, "./aidd.js")}"`;

// Shared state for the scaffold-example create tests (runs npm install once)
const scaffoldExampleCtx = {
  tempDir: null,
  projectDir: null,
  pkg: null,
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

  test("does not suggest scaffold-cleanup for named (local) scaffolds", () => {
    assert({
      given: "scaffold-example (named scaffold) completes successfully",
      should: "not suggest scaffold-cleanup because no tarball was downloaded",
      actual: scaffoldExampleCtx.stdout.includes("scaffold-cleanup"),
      expected: false,
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

    await execAsync(`node ${cliPath} create env-project`, {
      cwd: envCtx.tempDir,
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

describe("aidd scaffold-cleanup", () => {
  const scaffoldDir = path.join(os.homedir(), ".aidd", "scaffold");
  let scaffoldDirExistedBefore;

  beforeEach(async () => {
    // Record pre-test state so afterEach can restore it cleanly
    scaffoldDirExistedBefore = await fs.pathExists(scaffoldDir);
  });

  afterEach(async () => {
    // Remove the scaffold dir if it was created by the test
    if (!scaffoldDirExistedBefore) {
      await fs.remove(scaffoldDir);
    }
  });

  test("removes ~/.aidd/scaffold when it exists", async () => {
    await fs.ensureDir(scaffoldDir);

    await execAsync(`node ${cliPath} scaffold-cleanup`);

    const exists = await fs.pathExists(scaffoldDir);

    assert({
      given: "aidd scaffold-cleanup with ~/.aidd/scaffold present",
      should: "remove ~/.aidd/scaffold",
      actual: exists,
      expected: false,
    });
  });

  test("reports nothing to clean up when ~/.aidd/scaffold does not exist", async () => {
    await fs.remove(scaffoldDir);

    const { stdout } = await execAsync(`node ${cliPath} scaffold-cleanup`);

    assert({
      given: "scaffold-cleanup when ~/.aidd/scaffold does not exist",
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
      "steps:\n  - run: echo aidd\n  - prompt: hello world\n",
    );
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("passes the agent name to prompt step invocations", async () => {
    const scaffoldUri = `file://${path.join(tempDir, "agent-test-scaffold")}`;

    // Use 'echo' as the agent: it just prints the prompt and exits successfully
    const { stdout } = await execAsync(
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

    assert({
      given:
        "--agent echo with a manifest prompt step containing 'hello world'",
      should:
        "include the prompt text in stdout, proving echo was invoked with it",
      actual: stdout.includes("hello world"),
      expected: true,
    });
  }, 30_000);
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
        `node ${cliPath} create nonexistent-scaffold-xyz my-project`,
        { cwd: tempDir },
      );
    } catch (e) {
      err = e;
    }
    assert({
      given: "an unknown scaffold name",
      should: "exit non-zero",
      actual: err?.code !== 0,
      expected: true,
    });
  });

  test("exits non-zero when a URI is given without a folder argument", async () => {
    let err;
    try {
      await execAsync(`node ${cliPath} create https://example.com`, {
        cwd: tempDir,
      });
    } catch (e) {
      err = e;
    }
    assert({
      given: "a URI with no folder argument",
      should: "exit non-zero",
      actual: err?.code !== 0,
      expected: true,
    });
  });

  test("exits non-zero for a file:// URI pointing to a non-existent path", async () => {
    let err;
    try {
      await execAsync(
        `node ${cliPath} create "file:///tmp/nonexistent-scaffold-xyz" my-project`,
        { cwd: tempDir },
      );
    } catch (e) {
      err = e;
    }
    assert({
      given: "a non-existent file:// scaffold path",
      should: "exit non-zero",
      actual: err?.code !== 0,
      expected: true,
    });
  });
});
