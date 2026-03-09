import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { runVerifyScaffold } from "./scaffold-verify-cmd.js";

describe("runVerifyScaffold", () => {
  const validManifestPath = "/fake/SCAFFOLD-MANIFEST.yml";
  const noCleanup = async () => {};

  const mockResolvePaths = async () => ({
    downloaded: false,
    manifestPath: validManifestPath,
    readmePath: "/fake/README.md",
  });

  const mockResolveDownloaded = async () => ({
    downloaded: true,
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
      should: "return the full invalid result",
      actual: result,
      expected: { valid: false, errors: ["steps must be an array"] },
    });
  });

  test("passes manifestPath from resolveExtension to verifyScaffold", async () => {
    const calls = /** @type {Array<{manifestPath: string}>} */ ([]);
    const trackingVerify = async (
      /** @type {{manifestPath: string}} */ { manifestPath },
    ) => {
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

  test("does not pass a folder to resolveExtension (download target is fixed at ~/.aidd/scaffold)", async () => {
    const calls = /** @type {Array<{folder?: string}>} */ ([]);
    const trackingResolve = async (
      /** @type {{type?: string, folder?: string}} */ opts,
    ) => {
      calls.push(opts);
      return {
        downloaded: false,
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
      should:
        "not pass a folder argument (download path is always ~/.aidd/scaffold)",
      actual: calls[0]?.folder,
      expected: undefined,
    });
  });

  test("calls cleanupFn after successful verification of a downloaded scaffold", async () => {
    let cleanupCalled = false;
    const trackingCleanup = async () => {
      cleanupCalled = true;
    };

    await runVerifyScaffold({
      type: "https://example.com/scaffold.tar.gz",
      resolveExtensionFn: mockResolveDownloaded,
      verifyScaffoldFn: mockVerifyValid,
      cleanupFn: trackingCleanup,
    });

    assert({
      given: "a downloaded scaffold and successful verification",
      should: "call cleanupFn to remove downloaded scaffold files",
      actual: cleanupCalled,
      expected: true,
    });
  });

  test("does not call cleanupFn for a named scaffold (nothing was downloaded)", async () => {
    let cleanupCalled = false;
    const trackingCleanup = async () => {
      cleanupCalled = true;
    };

    await runVerifyScaffold({
      type: "next-shadcn",
      resolveExtensionFn: mockResolvePaths,
      verifyScaffoldFn: mockVerifyValid,
      cleanupFn: trackingCleanup,
    });

    assert({
      given: "a named scaffold (downloaded: false)",
      should: "not call cleanupFn (nothing was downloaded)",
      actual: cleanupCalled,
      expected: false,
    });
  });

  test("does not call cleanupFn when resolveExtension throws (downloaded was never set)", async () => {
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
      given: "resolveExtension that throws before setting downloaded",
      should: "not call cleanupFn (nothing was ever downloaded)",
      actual: cleanupCalled,
      expected: false,
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
