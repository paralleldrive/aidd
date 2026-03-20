import os from "os";
import path from "path";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test } from "vitest";

import { resolveCreateArgs, runCreate } from "./scaffold-create.js";

describe("resolveCreateArgs", () => {
  test("returns null when typeOrFolder is absent", () => {
    assert({
      given: "no arguments",
      should: "return null to signal missing folder",
      actual: resolveCreateArgs(undefined, undefined),
      expected: null,
    });
  });

  test("returns null when single arg is an https:// URI (folder omitted)", () => {
    assert({
      given: "only an https:// URL with no folder",
      should: "return null to signal missing folder",
      actual: resolveCreateArgs("https://github.com/org/repo", undefined),
      expected: null,
    });
  });

  test("returns null when single arg is a file:// URI (folder omitted)", () => {
    assert({
      given: "only a file:// URI with no folder",
      should: "return null to signal missing folder",
      actual: resolveCreateArgs("file:///path/to/scaffold", undefined),
      expected: null,
    });
  });

  test("returns null when single arg is an http:// URI (folder omitted)", () => {
    assert({
      given: "only an http:// URL with no folder",
      should: "return null to signal missing folder",
      actual: resolveCreateArgs("http://example.com/scaffold", undefined),
      expected: null,
    });
  });

  test("two-arg: https:// URL as type with explicit folder is accepted", () => {
    const result =
      /** @type {NonNullable<ReturnType<typeof resolveCreateArgs>>} */ (
        resolveCreateArgs("https://github.com/org/repo", "my-project")
      );
    assert({
      given: "an https:// URL as type and an explicit folder",
      should: "set type to the URL and resolvedFolder to the folder argument",
      actual: { type: result.type, resolvedFolder: result.resolvedFolder },
      expected: {
        type: "https://github.com/org/repo",
        resolvedFolder: "my-project",
      },
    });
  });

  test("one-arg: treats single value as folder, type is undefined", () => {
    const result =
      /** @type {NonNullable<ReturnType<typeof resolveCreateArgs>>} */ (
        resolveCreateArgs("my-project", undefined)
      );

    assert({
      given: "only a folder argument",
      should: "set type to undefined and resolvedFolder to the given value",
      actual: { type: result.type, resolvedFolder: result.resolvedFolder },
      expected: { type: undefined, resolvedFolder: "my-project" },
    });
  });

  test("one-arg: resolves absolute folderPath from cwd", () => {
    const result =
      /** @type {NonNullable<ReturnType<typeof resolveCreateArgs>>} */ (
        resolveCreateArgs("my-project", undefined)
      );

    assert({
      given: "only a folder argument",
      should:
        "resolve folderPath to an absolute path ending with the folder name",
      actual:
        path.isAbsolute(result.folderPath) &&
        result.folderPath.endsWith("my-project"),
      expected: true,
    });
  });

  test("two-arg: first arg is type, second is folder", () => {
    const result =
      /** @type {NonNullable<ReturnType<typeof resolveCreateArgs>>} */ (
        resolveCreateArgs("scaffold-example", "my-project")
      );

    assert({
      given: "type and folder arguments",
      should: "parse type and folder correctly",
      actual: { type: result.type, resolvedFolder: result.resolvedFolder },
      expected: { type: "scaffold-example", resolvedFolder: "my-project" },
    });
  });

  test("two-arg: folderPath is absolute path to the second argument", () => {
    const result =
      /** @type {NonNullable<ReturnType<typeof resolveCreateArgs>>} */ (
        resolveCreateArgs("scaffold-example", "my-project")
      );

    assert({
      given: "type and folder arguments",
      should: "resolve folderPath to absolute path ending with folder name",
      actual:
        path.isAbsolute(result.folderPath) &&
        result.folderPath.endsWith("my-project"),
      expected: true,
    });
  });
});

describe("runCreate", () => {
  /** @type {string} */
  let tempDir;
  /** @type {string} */
  let scaffoldDir;
  /** @type {string} */
  let failingScaffoldDir;
  /** @type {string} */
  let projectDir;
  /** @type {string} */
  let echoAgentPath;
  /** @type {boolean} */
  let scaffoldDirExistedBefore;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `scaffold-create-test-${Date.now()}`);
    await fs.ensureDir(tempDir);

    // Minimal scaffold fixture: a directory with steps: [] so no commands run
    scaffoldDir = path.join(tempDir, "minimal-scaffold");
    await fs.ensureDir(scaffoldDir);
    await fs.writeFile(
      path.join(scaffoldDir, "SCAFFOLD-MANIFEST.yml"),
      "steps: []\n",
    );

    // Echo agent fixture: command: echo exits 0 with verifiable output
    echoAgentPath = path.join(tempDir, "echo-agent.yml");
    await fs.writeFile(echoAgentPath, "command: echo\n");

    // Failing scaffold: a run step that exits 1 (real process, no prompt steps
    // so the aidd ordering guard does not apply)
    failingScaffoldDir = path.join(tempDir, "failing-scaffold");
    await fs.ensureDir(failingScaffoldDir);
    await fs.writeFile(
      path.join(failingScaffoldDir, "SCAFFOLD-MANIFEST.yml"),
      'steps:\n  - run: "node -e \\"process.exit(1)\\""\n',
    );

    // Project directory that does NOT yet exist
    projectDir = path.join(tempDir, "my-project");

    // Record whether ~/.aidd/scaffold existed before this test so afterEach
    // can restore the state (cleanup tests create it intentionally).
    const { SCAFFOLD_DOWNLOAD_DIR } = await import("./scaffold-resolver.js");
    scaffoldDirExistedBefore = await fs.pathExists(SCAFFOLD_DOWNLOAD_DIR);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    // Restore ~/.aidd/scaffold to its pre-test state
    const { SCAFFOLD_DOWNLOAD_DIR } = await import("./scaffold-resolver.js");
    if (!scaffoldDirExistedBefore) {
      await fs.remove(SCAFFOLD_DOWNLOAD_DIR);
    }
  });

  // Returns a resolveExtensionFn pointing to the minimal scaffold fixture.
  // The closure captures scaffoldDir by reference so it resolves to the
  // value set by the most recent beforeEach when the returned function is called.
  const fixtureResolve =
    ({ downloaded = false } = {}) =>
    async () => ({
      manifestPath: path.join(scaffoldDir, "SCAFFOLD-MANIFEST.yml"),
      downloaded,
    });

  test("creates the destination directory on disk", async () => {
    await runCreate({
      folder: projectDir,
      resolveExtensionFn: fixtureResolve(),
    });

    assert({
      given: "a folder path that does not exist",
      should: "create the destination directory",
      actual: await fs.pathExists(projectDir),
      expected: true,
    });
  });

  test("copies scaffold files into the destination folder", async () => {
    await runCreate({
      folder: projectDir,
      resolveExtensionFn: fixtureResolve(),
    });

    assert({
      given: "scaffold source files resolved",
      should: "copy scaffold root contents into the project folder",
      actual: await fs.pathExists(
        path.join(projectDir, "SCAFFOLD-MANIFEST.yml"),
      ),
      expected: true,
    });
  });

  test("returns success:true and the destination folderPath", async () => {
    const result = await runCreate({
      folder: projectDir,
      resolveExtensionFn: fixtureResolve(),
    });

    assert({
      given: "a valid scaffold and non-existing destination",
      should: "return success:true and the resolved folderPath",
      actual: { success: result.success, folderPath: result.folderPath },
      expected: { success: true, folderPath: projectDir },
    });
  });

  test("does not include cleanupTip for local (downloaded:false) scaffold", async () => {
    const result = await runCreate({
      folder: projectDir,
      resolveExtensionFn: fixtureResolve({ downloaded: false }),
    });

    assert({
      given: "a named or file:// scaffold (downloaded:false)",
      should: "return success:true and the resolved folderPath",
      actual: { success: result.success, folderPath: result.folderPath },
      expected: { success: true, folderPath: projectDir },
    });
  });

  test("removes ~/.aidd/scaffold after a successful downloaded scaffold run", async () => {
    const { SCAFFOLD_DOWNLOAD_DIR } = await import("./scaffold-resolver.js");
    await fs.ensureDir(SCAFFOLD_DOWNLOAD_DIR);

    await runCreate({
      folder: projectDir,
      resolveExtensionFn: fixtureResolve({ downloaded: true }),
    });

    assert({
      given: "a downloaded scaffold that completes successfully",
      should: "remove ~/.aidd/scaffold via auto-cleanup",
      actual: await fs.pathExists(SCAFFOLD_DOWNLOAD_DIR),
      expected: false,
    });
  });

  test("removes ~/.aidd/scaffold even when a manifest step fails", async () => {
    const { SCAFFOLD_DOWNLOAD_DIR } = await import("./scaffold-resolver.js");
    await fs.ensureDir(SCAFFOLD_DOWNLOAD_DIR);

    let error;
    try {
      await runCreate({
        folder: projectDir,
        resolveExtensionFn: async () => ({
          manifestPath: path.join(failingScaffoldDir, "SCAFFOLD-MANIFEST.yml"),
          downloaded: true,
        }),
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "a manifest step that fails with a downloaded scaffold",
      should: "still remove ~/.aidd/scaffold (cleanup runs in finally)",
      actual: await fs.pathExists(SCAFFOLD_DOWNLOAD_DIR),
      expected: false,
    });

    assert({
      given: "a manifest step that fails",
      should: "propagate the step error to the caller",
      actual: /** @type {any} */ (error)?.cause?.code,
      expected: "SCAFFOLD_STEP_ERROR",
    });
  });

  test("does not touch ~/.aidd/scaffold for a local (non-downloaded) scaffold", async () => {
    const { SCAFFOLD_DOWNLOAD_DIR } = await import("./scaffold-resolver.js");

    await runCreate({
      folder: projectDir,
      resolveExtensionFn: fixtureResolve({ downloaded: false }),
    });

    assert({
      given: "a named or file:// scaffold (downloaded: false)",
      should: "not create or remove ~/.aidd/scaffold",
      actual: await fs.pathExists(SCAFFOLD_DOWNLOAD_DIR),
      expected: false,
    });
  });

  test("throws ScaffoldDestinationError when destination folder already exists", async () => {
    await fs.ensureDir(projectDir);

    /** @type {any[]} */
    const resolveCalls = [];
    const trackingResolve = async (/** @type {any} */ args) => {
      resolveCalls.push(args);
      return { manifestPath: path.join(scaffoldDir, "SCAFFOLD-MANIFEST.yml") };
    };

    let error;
    try {
      await runCreate({
        folder: projectDir,
        resolveExtensionFn: trackingResolve,
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "a project folder that already exists on disk",
      should: "throw ScaffoldDestinationError",
      actual: /** @type {any} */ (error)?.cause?.code,
      expected: "SCAFFOLD_DESTINATION_ERROR",
    });

    assert({
      given: "a project folder that already exists on disk",
      should: "include the folder path in the error message",
      actual: /** @type {any} */ (error)?.message.includes(projectDir),
      expected: true,
    });

    assert({
      given: "a project folder that already exists on disk",
      should: "not proceed to resolve the extension",
      actual: resolveCalls.length,
      expected: 0,
    });
  });

  test("does not create the project directory when resolveExtension rejects", async () => {
    const rejectingResolve = async () => {
      throw new Error("User cancelled");
    };

    let error;
    try {
      await runCreate({
        folder: projectDir,
        resolveExtensionFn: rejectingResolve,
      });
    } catch (e) {
      error = e;
    }

    assert({
      given:
        "resolveExtension rejects (e.g. user cancels remote code confirmation)",
      should: "not create the project directory on disk",
      actual: await fs.pathExists(projectDir),
      expected: false,
    });

    assert({
      given: "resolveExtension rejects",
      should: "propagate the error to the caller",
      actual: /** @type {any} */ (error)?.message,
      expected: "User cancelled",
    });
  });

  test("passes type to resolveExtension", async () => {
    const calls = /** @type {Array<{type?: string}>} */ ([]);
    const trackingResolve = async (/** @type {{type?: string}} */ { type }) => {
      calls.push({ type });
      return { manifestPath: path.join(scaffoldDir, "SCAFFOLD-MANIFEST.yml") };
    };

    await runCreate({
      type: "scaffold-example",
      folder: projectDir,
      resolveExtensionFn: trackingResolve,
    });

    assert({
      given: "type supplied",
      should: "pass type to resolveExtension",
      actual: calls[0]?.type,
      expected: "scaffold-example",
    });
  });

  test("passes agentConfig, folder, and local manifest path to runManifest", async () => {
    const calls =
      /** @type {Array<{agentConfig?: string, folder?: string, manifestPath?: string}>} */ ([]);
    const trackingManifest = async (
      /** @type {{agentConfig?: string, folder?: string, manifestPath?: string}} */ {
        agentConfig,
        folder,
        manifestPath,
      },
    ) => {
      calls.push({ agentConfig, folder, manifestPath });
    };

    await runCreate({
      folder: projectDir,
      agentConfig: "aider",
      resolveExtensionFn: fixtureResolve(),
      runManifestFn: trackingManifest,
    });

    assert({
      given: "an agent config and folder",
      should: "pass the agentConfig to runManifest",
      actual: calls[0]?.agentConfig,
      expected: "aider",
    });

    assert({
      given: "scaffold files copied to the project folder",
      should:
        "pass the folder-relative manifest path (not the resolver path) to runManifest",
      actual: calls[0]?.manifestPath,
      expected: path.join(projectDir, "SCAFFOLD-MANIFEST.yml"),
    });
  });

  test("given --prompt with echo agent, invokes agent and returns success", async () => {
    const result = await runCreate({
      folder: projectDir,
      agentConfig: echoAgentPath,
      prompt: "hello world",
      resolveExtensionFn: fixtureResolve(),
    });

    assert({
      given: "a --prompt with an echo-agent.yml config (command: echo)",
      should: "invoke the agent successfully and return success",
      actual: result.success,
      expected: true,
    });
  });

  test("given --prompt with failing agent, propagates ScaffoldStepError", async () => {
    const failingAgentPath = path.join(tempDir, "failing-agent.yml");
    await fs.writeFile(
      failingAgentPath,
      "command: node\nargs:\n  - '-e'\n  - 'process.exit(1)'\n",
    );

    let error;
    try {
      await runCreate({
        folder: projectDir,
        agentConfig: failingAgentPath,
        prompt: "fail please",
        resolveExtensionFn: fixtureResolve(),
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "a --prompt agent that exits non-zero",
      should: "propagate the ScaffoldStepError to the caller",
      actual: /** @type {any} */ (error)?.cause?.code,
      expected: "SCAFFOLD_STEP_ERROR",
    });
  });

  test("given no --prompt, completes without invoking the agent", async () => {
    const result = await runCreate({
      folder: projectDir,
      resolveExtensionFn: fixtureResolve(),
    });

    assert({
      given: "no --prompt flag",
      should: "complete successfully without attempting to run an agent",
      actual: result.success,
      expected: true,
    });
  });
});
