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

  test("cleanup tip is 'npx aidd scaffold-cleanup' with no folder argument", async () => {
    const result = await runCreate({
      type: undefined,
      folder: "/absolute/path/to/my-project",
      agentConfig: "claude",
      resolveExtensionFn: noopResolveExtension,
      runManifestFn: noopRunManifest,
      ensureDirFn: noopEnsureDir,
    });

    assert({
      given: "a downloaded scaffold",
      should:
        "return a cleanup tip with no folder path (cleanup targets ~/.aidd/scaffold)",
      actual: result.cleanupTip,
      expected: "npx aidd scaffold-cleanup",
    });
  });

  test("passes type to resolveExtension (folder is not passed — download target is fixed)", async () => {
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
      agentConfig: "claude",
      resolveExtensionFn: trackingResolve,
      runManifestFn: noopRunManifest,
      ensureDirFn: noopEnsureDir,
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
      agentConfig: "claude",
      resolveExtensionFn: localResolve,
      runManifestFn: noopRunManifest,
      ensureDirFn: noopEnsureDir,
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
      agentConfig: "claude",
      resolveExtensionFn: remoteResolve,
      runManifestFn: noopRunManifest,
      ensureDirFn: noopEnsureDir,
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
        agentConfig: "claude",
        resolveExtensionFn: rejectingResolve,
        runManifestFn: noopRunManifest,
        ensureDirFn: trackingEnsureDir,
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
      agentConfig: "claude",
      resolveExtensionFn: remoteResolve,
      runManifestFn: noopRunManifest,
      ensureDirFn: noopEnsureDir,
    });

    assert({
      given: "a folder path with spaces",
      should: "still return the simple cleanup tip (no folder path needed)",
      actual: result.cleanupTip,
      expected: "npx aidd scaffold-cleanup",
    });
  });

  test("passes agentConfig and folder to runManifest", async () => {
    const calls =
      /** @type {Array<{agentConfig?: string, folder?: string}>} */ ([]);
    const trackingManifest = async (
      /** @type {{agentConfig?: string, folder?: string}} */ {
        agentConfig,
        folder,
      },
    ) => {
      calls.push({ agentConfig, folder });
    };

    await runCreate({
      type: undefined,
      folder: "/abs/my-project",
      agentConfig: "aider",
      resolveExtensionFn: noopResolveExtension,
      runManifestFn: trackingManifest,
      ensureDirFn: noopEnsureDir,
    });

    assert({
      given: "an agent config and folder",
      should: "pass the agentConfig to runManifest",
      actual: calls[0]?.agentConfig,
      expected: "aider",
    });
  });
});
