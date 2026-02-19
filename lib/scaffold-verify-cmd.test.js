import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import { runVerifyScaffold } from "./scaffold-verify-cmd.js";

describe("runVerifyScaffold", () => {
  const validManifestPath = "/fake/SCAFFOLD-MANIFEST.yml";

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
    });

    assert({
      given: "a resolved manifest path",
      should: "pass it to verifyScaffold",
      actual: calls[0]?.manifestPath,
      expected: validManifestPath,
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
