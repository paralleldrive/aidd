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
      should: "set type to the URL",
      actual: result.type,
      expected: "https://github.com/org/repo",
    });
    assert({
      given: "an https:// URL as type and an explicit folder",
      should: "set resolvedFolder to the folder argument",
      actual: result.resolvedFolder,
      expected: "my-project",
    });
  });

  test("one-arg: treats single value as folder, type is undefined", () => {
    const result =
      /** @type {NonNullable<ReturnType<typeof resolveCreateArgs>>} */ (
        resolveCreateArgs("my-project", undefined)
      );

    assert({
      given: "only a folder argument",
      should: "set type to undefined",
      actual: result.type,
      expected: undefined,
    });

    assert({
      given: "only a folder argument",
      should: "set resolvedFolder to the given value",
      actual: result.resolvedFolder,
      expected: "my-project",
    });
  });

  test("one-arg: resolves absolute folderPath from cwd", () => {
    const result =
      /** @type {NonNullable<ReturnType<typeof resolveCreateArgs>>} */ (
        resolveCreateArgs("my-project", undefined)
      );

    assert({
      given: "only a folder argument",
      should: "resolve folderPath to an absolute path",
      actual: path.isAbsolute(result.folderPath),
      expected: true,
    });

    assert({
      given: "only a folder argument",
      should: "folderPath ends with the given folder name",
      actual: result.folderPath.endsWith("my-project"),
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
      should: "set type to the first argument",
      actual: result.type,
      expected: "scaffold-example",
    });

    assert({
      given: "type and folder arguments",
      should: "set resolvedFolder to the second argument",
      actual: result.resolvedFolder,
      expected: "my-project",
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
    extensionJsPath: null,
    manifestPath: "/fake/SCAFFOLD-MANIFEST.yml",
    readmePath: "/fake/README.md",
    downloaded: true,
  });
  const noopRunManifest = async () => {};

  test("uses absolute folderPath in the cleanup tip", async () => {
    const result = await runCreate({
      type: undefined,
      folder: "/absolute/path/to/my-project",
      agent: "claude",
      resolveExtensionFn: noopResolveExtension,
      runManifestFn: noopRunManifest,
      ensureDirFn: noopEnsureDir,
    });

    assert({
      given: "a resolved absolute folder path",
      should: "return a cleanup tip containing the absolute path",
      actual: result.cleanupTip?.includes("/absolute/path/to/my-project"),
      expected: true,
    });
  });

  test("cleanup tip does not contain a relative folder name", async () => {
    const result = await runCreate({
      type: undefined,
      folder: path.resolve(process.cwd(), "relative-project"),
      agent: "claude",
      resolveExtensionFn: noopResolveExtension,
      runManifestFn: noopRunManifest,
      ensureDirFn: noopEnsureDir,
    });

    assert({
      given: "a folder resolved to an absolute path",
      should:
        "return a cleanup tip with the absolute path, not the relative name",
      actual: path.isAbsolute(
        (result.cleanupTip ?? "").replace("npx aidd scaffold-cleanup ", ""),
      ),
      expected: true,
    });
  });

  test("passes type and folder to resolveExtension", async () => {
    const calls = /** @type {Array<{type?: string, folder?: string}>} */ ([]);
    const trackingResolve = async (
      /** @type {{type?: string, folder?: string}} */ { type, folder },
    ) => {
      calls.push({ type, folder });
      return {
        extensionJsPath: null,
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
    });

    assert({
      given: "type and folder supplied",
      should: "pass type to resolveExtension",
      actual: calls[0]?.type,
      expected: "scaffold-example",
    });

    assert({
      given: "type and folder supplied",
      should: "pass the folder path to resolveExtension",
      actual: calls[0]?.folder,
      expected: "/abs/my-project",
    });
  });

  test("does not include cleanupTip when resolveExtension returns downloaded:false", async () => {
    const localResolve = async () => ({
      extensionJsPath: null,
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
      extensionJsPath: null,
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
    });

    assert({
      given: "an HTTP/HTTPS scaffold (downloaded:true)",
      should: "include a cleanupTip with the absolute folder path",
      actual:
        typeof result.cleanupTip === "string" &&
        result.cleanupTip.includes("/abs/remote-project"),
      expected: true,
    });
  });

  test("does not create the project directory when resolveExtension rejects", async () => {
    const ensureDirCalls = [];
    const trackingEnsureDir = async (folder) => {
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
      actual: error?.message,
      expected: "User cancelled",
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
    });

    assert({
      given: "an agent name and folder",
      should: "pass the agent to runManifest",
      actual: calls[0]?.agent,
      expected: "aider",
    });
  });
});
