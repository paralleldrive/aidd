import path from "path";
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

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
  const noopEnsureDir = async () => {};
  const noopResolveExtension = async () => ({
    manifestPath: "/fake/SCAFFOLD-MANIFEST.yml",
    readmePath: "/fake/README.md",
    downloaded: true,
  });
  const noopRunManifest = async () => {};
  const noopCopy = async () => {};
  const notExists = async () => false;

  test("cleanup tip is 'npx aidd scaffold-cleanup' for a downloaded scaffold", async () => {
    const result = await runCreate({
      type: undefined,
      folder: "/absolute/path/to/my-project",
      agent: "claude",
      resolveExtensionFn: noopResolveExtension,
      runManifestFn: noopRunManifest,
      ensureDirFn: noopEnsureDir,
      copyFn: noopCopy,
      existsFn: notExists,
    });

    assert({
      given: "a downloaded scaffold",
      should:
        "return a cleanup tip with no folder path (cleanup targets ~/.aidd/scaffold)",
      actual: result.cleanupTip,
      expected: "npx aidd scaffold-cleanup",
    });
  });

  test("passes type to resolveExtension (download target is fixed at ~/.aidd/scaffold)", async () => {
    const calls = /** @type {Array<{type?: string}>} */ ([]);
    const trackingResolve = async (/** @type {{type?: string}} */ { type }) => {
      calls.push({ type });
      return {
        manifestPath: "/fake/SCAFFOLD-MANIFEST.yml",
        readmePath: "/fake/README.md",
      };
    };

    await runCreate({
      type: "scaffold-example",
      folder: "/abs/my-project",
      agent: "claude",
      resolveExtensionFn: trackingResolve,
      runManifestFn: noopRunManifest,
      ensureDirFn: noopEnsureDir,
      copyFn: noopCopy,
      existsFn: notExists,
    });

    assert({
      given: "type supplied",
      should: "pass type to resolveExtension",
      actual: calls[0]?.type,
      expected: "scaffold-example",
    });
  });

  test("does not include cleanupTip when resolveExtension returns downloaded:false", async () => {
    const localResolve = async () => ({
      manifestPath: "/fake/SCAFFOLD-MANIFEST.yml",
      readmePath: "/fake/README.md",
      downloaded: false,
    });

    const result = await runCreate({
      type: undefined,
      folder: "/abs/my-project",
      agent: "claude",
      resolveExtensionFn: localResolve,
      runManifestFn: noopRunManifest,
      ensureDirFn: noopEnsureDir,
      copyFn: noopCopy,
      existsFn: notExists,
    });

    assert({
      given: "a named or file:// scaffold (downloaded:false)",
      should: "not include a cleanupTip in the result",
      actual: result.cleanupTip,
      expected: undefined,
    });
  });

  test("includes cleanupTip when resolveExtension returns downloaded:true", async () => {
    const remoteResolve = async () => ({
      manifestPath: "/fake/SCAFFOLD-MANIFEST.yml",
      readmePath: "/fake/README.md",
      downloaded: true,
    });

    const result = await runCreate({
      type: undefined,
      folder: "/abs/remote-project",
      agent: "claude",
      resolveExtensionFn: remoteResolve,
      runManifestFn: noopRunManifest,
      ensureDirFn: noopEnsureDir,
      copyFn: noopCopy,
      existsFn: notExists,
    });

    assert({
      given: "an HTTP/HTTPS scaffold (downloaded:true)",
      should: "include a cleanupTip pointing to npx aidd scaffold-cleanup",
      actual: result.cleanupTip,
      expected: "npx aidd scaffold-cleanup",
    });
  });

  test("does not create the project directory when resolveExtension rejects", async () => {
    const ensureDirCalls = /** @type {string[]} */ ([]);
    const trackingEnsureDir = async (/** @type {string} */ folder) => {
      ensureDirCalls.push(folder);
    };
    const rejectingResolve = async () => {
      throw new Error("User cancelled");
    };

    let error;
    try {
      await runCreate({
        type: "https://github.com/org/repo",
        folder: "/abs/my-project",
        agent: "claude",
        resolveExtensionFn: rejectingResolve,
        runManifestFn: noopRunManifest,
        ensureDirFn: trackingEnsureDir,
        copyFn: noopCopy,
        existsFn: notExists,
      });
    } catch (e) {
      error = e;
    }

    assert({
      given:
        "resolveExtension rejects (e.g. user cancels remote code confirmation)",
      should: "not create the project directory on disk",
      actual: ensureDirCalls.length,
      expected: 0,
    });

    assert({
      given: "resolveExtension rejects",
      should: "propagate the error to the caller",
      actual: /** @type {any} */ (error)?.message,
      expected: "User cancelled",
    });
  });

  test("cleanup tip is stable regardless of folder path (no path quoting needed)", async () => {
    const remoteResolve = async () => ({
      manifestPath: "/fake/SCAFFOLD-MANIFEST.yml",
      readmePath: "/fake/README.md",
      downloaded: true,
    });

    const result = await runCreate({
      type: undefined,
      folder: "/home/user/my project with spaces",
      agent: "claude",
      resolveExtensionFn: remoteResolve,
      runManifestFn: noopRunManifest,
      ensureDirFn: noopEnsureDir,
      copyFn: noopCopy,
      existsFn: notExists,
    });

    assert({
      given: "a folder path with spaces",
      should: "still return the simple cleanup tip (no folder path needed)",
      actual: result.cleanupTip,
      expected: "npx aidd scaffold-cleanup",
    });
  });

  test("passes agent and folder to runManifest", async () => {
    const calls = /** @type {Array<{agent?: string, folder?: string}>} */ ([]);
    const trackingManifest = async (
      /** @type {{agent?: string, folder?: string}} */ { agent, folder },
    ) => {
      calls.push({ agent, folder });
    };

    await runCreate({
      type: undefined,
      folder: "/abs/my-project",
      agent: "aider",
      resolveExtensionFn: noopResolveExtension,
      runManifestFn: trackingManifest,
      ensureDirFn: noopEnsureDir,
      copyFn: noopCopy,
      existsFn: notExists,
    });

    assert({
      given: "an agent name and folder",
      should: "pass the agent to runManifest",
      actual: calls[0]?.agent,
      expected: "aider",
    });
  });

  // --- new behaviour tests ---

  test("copies all files from the scaffold source dir into the project folder", async () => {
    const copyCalls = /** @type {Array<{src: string, dest: string}>} */ ([]);
    const trackingCopy = async (
      /** @type {string} */ src,
      /** @type {string} */ dest,
    ) => {
      copyCalls.push({ dest, src });
    };

    const resolve = async () => ({
      manifestPath: "/home/user/.aidd/scaffold/SCAFFOLD-MANIFEST.yml",
      readmePath: "/home/user/.aidd/scaffold/README.md",
      downloaded: true,
    });

    await runCreate({
      type: "https://github.com/org/repo",
      folder: "/abs/my-project",
      resolveExtensionFn: resolve,
      runManifestFn: noopRunManifest,
      ensureDirFn: noopEnsureDir,
      copyFn: trackingCopy,
      existsFn: notExists,
    });

    assert({
      given: "a scaffold with manifestPath inside a source directory",
      should:
        "copy the contents of that source directory into the project folder",
      actual: copyCalls[0],
      expected: {
        src: "/home/user/.aidd/scaffold",
        dest: "/abs/my-project",
      },
    });
  });

  test("copies scaffold files for named and file:// scaffolds too (not just downloaded)", async () => {
    const copyCalls = /** @type {Array<{src: string, dest: string}>} */ ([]);
    const trackingCopy = async (
      /** @type {string} */ src,
      /** @type {string} */ dest,
    ) => {
      copyCalls.push({ dest, src });
    };

    const namedResolve = async () => ({
      manifestPath: "/pkg/ai/scaffolds/scaffold-example/SCAFFOLD-MANIFEST.yml",
      readmePath: "/pkg/ai/scaffolds/scaffold-example/README.md",
      downloaded: false,
    });

    await runCreate({
      type: "scaffold-example",
      folder: "/abs/my-project",
      resolveExtensionFn: namedResolve,
      runManifestFn: noopRunManifest,
      ensureDirFn: noopEnsureDir,
      copyFn: trackingCopy,
      existsFn: notExists,
    });

    assert({
      given: "a named scaffold (downloaded:false)",
      should: "still copy the scaffold source files into the project folder",
      actual: copyCalls[0],
      expected: {
        src: "/pkg/ai/scaffolds/scaffold-example",
        dest: "/abs/my-project",
      },
    });
  });

  test("runs manifest from <folder>/SCAFFOLD-MANIFEST.yml, not the source path", async () => {
    const manifestCalls = /** @type {Array<{manifestPath: string}>} */ ([]);
    const trackingManifest = async (
      /** @type {{manifestPath: string}} */ { manifestPath },
    ) => {
      manifestCalls.push({ manifestPath });
    };

    const resolve = async () => ({
      manifestPath: "/source/dir/SCAFFOLD-MANIFEST.yml",
      readmePath: "/source/dir/README.md",
      downloaded: false,
    });

    await runCreate({
      type: "scaffold-example",
      folder: "/abs/my-project",
      resolveExtensionFn: resolve,
      runManifestFn: trackingManifest,
      ensureDirFn: noopEnsureDir,
      copyFn: noopCopy,
      existsFn: notExists,
    });

    assert({
      given: "scaffold files copied to project folder",
      should:
        "invoke runManifest with manifestPath inside <folder>, not the source path",
      actual: manifestCalls[0]?.manifestPath,
      expected: path.join("/abs/my-project", "SCAFFOLD-MANIFEST.yml"),
    });
  });

  test("throws ScaffoldValidationError if the destination folder already exists", async () => {
    const resolveCalls = [];
    const trackingResolve = async (/** @type {any} */ opts) => {
      resolveCalls.push(opts);
      return {
        manifestPath: "/fake/SCAFFOLD-MANIFEST.yml",
        readmePath: "/fake/README.md",
        downloaded: false,
      };
    };

    let error;
    try {
      await runCreate({
        folder: "/abs/existing-project",
        resolveExtensionFn: trackingResolve,
        runManifestFn: noopRunManifest,
        ensureDirFn: noopEnsureDir,
        copyFn: noopCopy,
        existsFn: async () => true,
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "a project folder that already exists on disk",
      should: "throw ScaffoldValidationError before resolving the extension",
      actual: /** @type {any} */ (error)?.cause?.code,
      expected: "SCAFFOLD_VALIDATION_ERROR",
    });

    assert({
      given: "a project folder that already exists on disk",
      should: "not call resolveExtension (pre-flight check fires first)",
      actual: resolveCalls.length,
      expected: 0,
    });
  });
});
