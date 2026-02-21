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

  test("one-arg: treats single value as folder, type is undefined", () => {
    const result = resolveCreateArgs("my-project", undefined);

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
    const result = resolveCreateArgs("my-project", undefined);

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
    const result = resolveCreateArgs("scaffold-example", "my-project");

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
    const result = resolveCreateArgs("scaffold-example", "my-project");

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
    });

    assert({
      given: "a resolved absolute folder path",
      should: "return a cleanup tip containing the absolute path",
      actual: result.cleanupTip.includes("/absolute/path/to/my-project"),
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
    });

    assert({
      given: "a folder resolved to an absolute path",
      should:
        "return a cleanup tip with the absolute path, not the relative name",
      actual: path.isAbsolute(
        result.cleanupTip.replace("npx aidd scaffold-cleanup ", ""),
      ),
      expected: true,
    });
  });

  test("passes type and folder to resolveExtension", async () => {
    const calls = [];
    const trackingResolve = async ({ type, folder }) => {
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

  test("passes agent and folder to runManifest", async () => {
    const calls = [];
    const trackingManifest = async ({ agent, folder }) => {
      calls.push({ agent, folder });
    };

    await runCreate({
      type: undefined,
      folder: "/abs/my-project",
      agent: "aider",
      resolveExtensionFn: noopResolveExtension,
      runManifestFn: trackingManifest,
    });

    assert({
      given: "an agent name and folder",
      should: "pass the agent to runManifest",
      actual: calls[0]?.agent,
      expected: "aider",
    });
  });
});
