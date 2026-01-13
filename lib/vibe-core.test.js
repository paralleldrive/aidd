/**
 * vibe-core.test.js
 *
 * Unit tests for vibe-core module
 * Uses Riteway format with Vitest
 */
import { assert } from "riteway/vitest";
import { describe, test, vi, beforeEach, afterEach } from "vitest";

import { executeVibe, validateVibeParams } from "./vibe-core.js";

// =============================================================================
// Mock fetch for API tests
// =============================================================================

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  mockFetch.mockReset();
});

// =============================================================================
// validateVibeParams tests
// =============================================================================

describe("validateVibeParams", () => {
  test("requires title", () => {
    const result = validateVibeParams({ prompt: "Build a todo app" });

    assert({
      given: "missing title",
      should: "return valid false",
      actual: result.valid,
      expected: false,
    });

    assert({
      given: "missing title",
      should: "include title error in errors array",
      actual: result.errors.some((e) => e.includes("title")),
      expected: true,
    });
  });

  test("requires prompt or files", () => {
    const result = validateVibeParams({ title: "My Vibe" });

    assert({
      given: "missing prompt and files",
      should: "return valid false",
      actual: result.valid,
      expected: false,
    });

    assert({
      given: "missing prompt and files",
      should: "include prompt error in errors array",
      actual: result.errors.some((e) => e.includes("prompt")),
      expected: true,
    });
  });

  test("validates runner value", () => {
    const result = validateVibeParams({
      title: "My Vibe",
      prompt: "Build an app",
      runner: "invalid-runner",
    });

    assert({
      given: "invalid runner value",
      should: "return valid false",
      actual: result.valid,
      expected: false,
    });

    assert({
      given: "invalid runner value",
      should: "include runner error in errors array",
      actual: result.errors.some((e) => e.includes("runner")),
      expected: true,
    });
  });

  test("validates visibility value", () => {
    const result = validateVibeParams({
      title: "My Vibe",
      prompt: "Build an app",
      visibility: "secret",
    });

    assert({
      given: "invalid visibility value",
      should: "return valid false",
      actual: result.valid,
      expected: false,
    });

    assert({
      given: "invalid visibility value",
      should: "include visibility error in errors array",
      actual: result.errors.some((e) => e.includes("visibility")),
      expected: true,
    });
  });

  test("accepts valid parameters", () => {
    const result = validateVibeParams({
      title: "My Vibe",
      prompt: "Build a todo app",
      runner: "client-static",
      visibility: "public",
    });

    assert({
      given: "all valid parameters",
      should: "return valid true",
      actual: result.valid,
      expected: true,
    });

    assert({
      given: "all valid parameters",
      should: "have empty errors array",
      actual: result.errors.length,
      expected: 0,
    });
  });

  test("accepts webcontainer runner", () => {
    const result = validateVibeParams({
      title: "My Vibe",
      prompt: "Build an app",
      runner: "webcontainer",
    });

    assert({
      given: "webcontainer runner",
      should: "return valid true",
      actual: result.valid,
      expected: true,
    });
  });

  test("accepts all visibility options", () => {
    const visibilities = ["public", "unlisted", "private"];

    for (const visibility of visibilities) {
      const result = validateVibeParams({
        title: "My Vibe",
        prompt: "Build an app",
        visibility,
      });

      assert({
        given: `${visibility} visibility`,
        should: "return valid true",
        actual: result.valid,
        expected: true,
      });
    }
  });
});

// =============================================================================
// executeVibe tests
// =============================================================================

describe("executeVibe", () => {
  test("returns validation error for missing title", async () => {
    const result = await executeVibe({ prompt: "Build an app" });

    assert({
      given: "missing title",
      should: "return success false",
      actual: result.success,
      expected: false,
    });

    assert({
      given: "missing title",
      should: "return VALIDATION_ERROR code",
      actual: result.error?.code,
      expected: "VALIDATION_ERROR",
    });
  });

  test("returns validation error for missing prompt and files", async () => {
    const result = await executeVibe({ title: "My Vibe" });

    assert({
      given: "missing prompt and files",
      should: "return success false",
      actual: result.success,
      expected: false,
    });

    assert({
      given: "missing prompt and files",
      should: "return VALIDATION_ERROR code",
      actual: result.error?.code,
      expected: "VALIDATION_ERROR",
    });
  });

  test("generates placeholder code when prompt provided without files", async () => {
    // Code generation now works with placeholder templates
    // The result will be AUTH_REQUIRED because we don't have credentials
    // but generation itself succeeds
    const result = await executeVibe({
      title: "My Vibe",
      prompt: "Build a todo app",
    });

    assert({
      given: "prompt without files (no auth configured)",
      should: "return success false",
      actual: result.success,
      expected: false,
    });

    // Generation succeeded but auth failed since no credentials
    assert({
      given: "prompt without files (no auth configured)",
      should: "return AUTH_REQUIRED code (generation worked, auth needed)",
      actual: result.error?.code,
      expected: "AUTH_REQUIRED",
    });
  });

  test("returns generation error when generateFn throws", async () => {
    const result = await executeVibe({
      title: "My Vibe",
      prompt: "Build a todo app",
      generateFn: async () => {
        throw new Error("AI API failed");
      },
    });

    assert({
      given: "generateFn that throws",
      should: "return success false",
      actual: result.success,
      expected: false,
    });

    assert({
      given: "generateFn that throws",
      should: "return GENERATION_FAILED code",
      actual: result.error?.code,
      expected: "GENERATION_FAILED",
    });
  });

  test("validates file structure", async () => {
    const result = await executeVibe({
      title: "My Vibe",
      files: [{ path: "App.tsx" }], // missing content
    });

    assert({
      given: "file missing content",
      should: "return success false",
      actual: result.success,
      expected: false,
    });

    assert({
      given: "file missing content",
      should: "return VALIDATION_ERROR code",
      actual: result.error?.code,
      expected: "VALIDATION_ERROR",
    });
  });

  test("dry run mode returns simulated result", async () => {
    const result = await executeVibe({
      title: "My Vibe",
      files: [{ path: "App.tsx", content: "export default () => <div />" }],
      dryRun: true,
    });

    assert({
      given: "dry run mode",
      should: "return success true",
      actual: result.success,
      expected: true,
    });

    assert({
      given: "dry run mode",
      should: "return dryRun flag",
      actual: result.dryRun,
      expected: true,
    });

    assert({
      given: "dry run mode",
      should: "include wouldPublish info",
      actual: result.wouldPublish?.title,
      expected: "My Vibe",
    });

    assert({
      given: "dry run mode",
      should: "include file count in wouldPublish",
      actual: result.wouldPublish?.fileCount,
      expected: 1,
    });
  });

  test("dry run includes entry and runner in wouldPublish", async () => {
    const result = await executeVibe({
      title: "My Vibe",
      files: [{ path: "App.tsx", content: "content" }],
      entry: "App.tsx",
      runner: "webcontainer",
      visibility: "unlisted",
      dryRun: true,
    });

    assert({
      given: "dry run with entry",
      should: "include entry in wouldPublish",
      actual: result.wouldPublish?.entry,
      expected: "App.tsx",
    });

    assert({
      given: "dry run with runner",
      should: "include runner in wouldPublish",
      actual: result.wouldPublish?.runner,
      expected: "webcontainer",
    });

    assert({
      given: "dry run with visibility",
      should: "include visibility in wouldPublish",
      actual: result.wouldPublish?.visibility,
      expected: "unlisted",
    });
  });

  test("returns auth error when no credentials", async () => {
    // This test uses a non-existent config path to trigger auth error
    const result = await executeVibe({
      title: "My Vibe",
      files: [{ path: "App.tsx", content: "content" }],
      configPath: "/non/existent/path/cli.json",
    });

    assert({
      given: "no auth credentials",
      should: "return success false",
      actual: result.success,
      expected: false,
    });

    assert({
      given: "no auth credentials",
      should: "return AUTH_REQUIRED code",
      actual: result.error?.code,
      expected: "AUTH_REQUIRED",
    });

    assert({
      given: "no auth credentials",
      should: "include hint about authentication",
      actual: result.error?.hint?.includes("login"),
      expected: true,
    });
  });
});

// =============================================================================
// Error handling tests
// =============================================================================

describe("executeVibe error handling", () => {
  test("handles empty files array", async () => {
    const result = await executeVibe({
      title: "My Vibe",
      files: [],
    });

    assert({
      given: "empty files array",
      should: "return success false",
      actual: result.success,
      expected: false,
    });
  });

  test("handles invalid file without path", async () => {
    const result = await executeVibe({
      title: "My Vibe",
      files: [{ content: "content without path" }],
    });

    assert({
      given: "file without path",
      should: "return success false",
      actual: result.success,
      expected: false,
    });
  });

  test("trims title for validation", async () => {
    const result = await executeVibe({
      title: "   ",
      files: [{ path: "App.tsx", content: "content" }],
    });

    assert({
      given: "whitespace-only title",
      should: "return validation error",
      actual: result.success,
      expected: false,
    });
  });
});
