import os from "os";
import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { runVerifyScaffold } from "./scaffold-verify-cmd.js";

describe("runVerifyScaffold", () => {
  const validManifestPath = "/fake/SCAFFOLD-MANIFEST.yml";
  const noCleanup = async () => {};

  const mockResolvePaths = async () => ({
    extensionJsPath: null,
    manifestPath: validManifestPath,
    readmePath: "/fake/README.md",
  });

  const mockVerifyValid = async () => ({ valid: true, errors: [] });
  const mockVerifyInvalid = async () => ({
    valid: false,
    errors: ["steps must be an array"],
  });

  test("returns valid result when scaffold passes verification", async () => {
    const result = await runVerifyScaffold({
      type: "scaffold-example",
      resolveExtensionFn: mockResolvePaths,
      verifyScaffoldFn: mockVerifyValid,
      cleanupFn: noCleanup,
    });

    assert({
      given: "a scaffold that passes verification",
      should: "return { valid: true }",
      actual: result.valid,
      expected: true,
    });
  });

  test("returns invalid result with errors when scaffold fails verification", async () => {
    const result = await runVerifyScaffold({
      type: "scaffold-example",
      resolveExtensionFn: mockResolvePaths,
      verifyScaffoldFn: mockVerifyInvalid,
      cleanupFn: noCleanup,
    });

    assert({
      given: "a scaffold that fails verification",
      should: "return { valid: false }",
      actual: result.valid,
      expected: false,
    });

    assert({
      given: "a scaffold that fails verification",
      should: "include error messages",
      actual: result.errors.length > 0,
      expected: true,
    });
  });

  test("passes manifestPath from resolveExtension to verifyScaffold", async () => {
    const calls = [];
    const trackingVerify = async ({ manifestPath }) => {
      calls.push({ manifestPath });
      return { valid: true, errors: [] };
    };

    await runVerifyScaffold({
      type: "scaffold-example",
      resolveExtensionFn: mockResolvePaths,
      verifyScaffoldFn: trackingVerify,
      cleanupFn: noCleanup,
    });

    assert({
      given: "a resolved manifest path",
      should: "pass it to verifyScaffold",
      actual: calls[0]?.manifestPath,
      expected: validManifestPath,
    });
  });

  test("passes os.homedir() as folder to resolveExtension", async () => {
    const calls = [];
    const trackingResolve = async (opts) => {
      calls.push(opts);
      return {
        extensionJsPath: null,
        manifestPath: validManifestPath,
        readmePath: "/fake/README.md",
      };
    };

    await runVerifyScaffold({
      type: "scaffold-example",
      resolveExtensionFn: trackingResolve,
      verifyScaffoldFn: mockVerifyValid,
      cleanupFn: noCleanup,
    });

    assert({
      given: "verify-scaffold resolving an extension",
      should: "use os.homedir() as the folder (not process.cwd())",
      actual: calls[0]?.folder,
      expected: os.homedir(),
    });
  });

  test("calls cleanupFn after successful verification", async () => {
    let cleanupCalled = false;
    const trackingCleanup = async () => {
      cleanupCalled = true;
    };

    await runVerifyScaffold({
      type: "scaffold-example",
      resolveExtensionFn: mockResolvePaths,
      verifyScaffoldFn: mockVerifyValid,
      cleanupFn: trackingCleanup,
    });

    assert({
      given: "successful verification",
      should: "call cleanupFn to remove downloaded scaffold files",
      actual: cleanupCalled,
      expected: true,
    });
  });

  test("calls cleanupFn even when resolveExtension throws", async () => {
    let cleanupCalled = false;
    const trackingCleanup = async () => {
      cleanupCalled = true;
    };
    const failingResolve = async () => {
      throw new Error("cancelled by user");
    };

    try {
      await runVerifyScaffold({
        type: "https://bad.example.com/scaffold.tar.gz",
        resolveExtensionFn: failingResolve,
        verifyScaffoldFn: mockVerifyValid,
        cleanupFn: trackingCleanup,
      });
    } catch {
      // expected — we're only checking cleanup
    }

    assert({
      given: "resolveExtension that throws",
      should: "still call cleanupFn before propagating the error",
      actual: cleanupCalled,
      expected: true,
    });
  });

  test("propagates errors thrown by resolveExtension", async () => {
    const failingResolve = async () => {
      throw new Error("cancelled by user");
    };

    let error = null;
    try {
      await runVerifyScaffold({
        type: "https://bad.example.com/scaffold.tar.gz",
        resolveExtensionFn: failingResolve,
        verifyScaffoldFn: mockVerifyValid,
        cleanupFn: noCleanup,
      });
    } catch (err) {
      error = err;
    }

    assert({
      given: "a resolveExtension that throws",
      should: "propagate the error to the caller",
      actual: error !== null,
      expected: true,
    });
  });
});
