/**
 * vibe-utils.test.js
 *
 * Unit tests for vibe-utils module
 * Uses Riteway format with Vitest
 */
import { assert } from "riteway/vitest";
import { describe, test, vi, beforeEach, afterEach } from "vitest";

import {
  normalizeOrigin,
  validateApiBase,
  validatePlayerBase,
  createVerboseLogger,
  verboseLog,
  fetchJson,
  fetchWithTimeout,
  fetchWithRetry,
  isAuthError,
  isLikelyClerkTokenProblem,
  isPathSafe,
  deepClone,
  mergeConfig,
  allowedOrigins,
} from "./vibe-utils.js";

// =============================================================================
// Mock fetch for HTTP tests
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
// normalizeOrigin tests
// =============================================================================

describe("normalizeOrigin", () => {
  test("removes trailing slashes", () => {
    assert({
      given: "a URL with trailing slashes",
      should: "remove all trailing slashes",
      actual: normalizeOrigin("https://api.vibecodr.space///"),
      expected: "https://api.vibecodr.space",
    });
  });

  test("leaves clean URLs unchanged", () => {
    assert({
      given: "a URL without trailing slashes",
      should: "return the URL unchanged",
      actual: normalizeOrigin("https://api.vibecodr.space"),
      expected: "https://api.vibecodr.space",
    });
  });

  test("handles empty string", () => {
    assert({
      given: "an empty string",
      should: "return empty string",
      actual: normalizeOrigin(""),
      expected: "",
    });
  });

  test("handles null/undefined", () => {
    assert({
      given: "null input",
      should: "return empty string",
      actual: normalizeOrigin(null),
      expected: "",
    });
  });
});

// =============================================================================
// validateApiBase tests
// =============================================================================

describe("validateApiBase", () => {
  test("accepts production API URL", () => {
    const result = validateApiBase("https://api.vibecodr.space");

    assert({
      given: "production API URL",
      should: "return valid true",
      actual: result.valid,
      expected: true,
    });
  });

  test("accepts staging API URL", () => {
    const result = validateApiBase("https://api.staging.vibecodr.space");

    assert({
      given: "staging API URL",
      should: "return valid true",
      actual: result.valid,
      expected: true,
    });
  });

  test("accepts localhost for development", () => {
    const result = validateApiBase("http://localhost:8787");

    assert({
      given: "localhost URL",
      should: "return valid true",
      actual: result.valid,
      expected: true,
    });
  });

  test("rejects unknown origins", () => {
    const result = validateApiBase("https://evil-api.com");

    assert({
      given: "unknown origin",
      should: "return valid false",
      actual: result.valid,
      expected: false,
    });

    assert({
      given: "unknown origin",
      should: "include reason",
      actual: result.reason.includes("not in the allowed list"),
      expected: true,
    });
  });

  test("rejects empty input", () => {
    const result = validateApiBase("");

    assert({
      given: "empty string",
      should: "return valid false",
      actual: result.valid,
      expected: false,
    });
  });

  test("accepts _testOnlyOrigins for testing", () => {
    const result = validateApiBase("https://test-api.example.com", {
      _testOnlyOrigins: ["https://test-api.example.com"],
    });

    assert({
      given: "URL in _testOnlyOrigins",
      should: "return valid true",
      actual: result.valid,
      expected: true,
    });
  });

  test("handles URLs with paths", () => {
    const result = validateApiBase("https://api.vibecodr.space/v1/endpoint");

    assert({
      given: "API URL with path",
      should: "validate based on origin",
      actual: result.valid,
      expected: true,
    });
  });
});

// =============================================================================
// validatePlayerBase tests
// =============================================================================

describe("validatePlayerBase", () => {
  test("accepts production player URL", () => {
    const result = validatePlayerBase("https://vibecodr.space");

    assert({
      given: "production player URL",
      should: "return valid true",
      actual: result.valid,
      expected: true,
    });
  });

  test("rejects unknown origins", () => {
    const result = validatePlayerBase("https://fake-player.com");

    assert({
      given: "unknown origin",
      should: "return valid false",
      actual: result.valid,
      expected: false,
    });
  });
});

// =============================================================================
// createVerboseLogger tests
// =============================================================================

describe("createVerboseLogger", () => {
  test("creates logger that outputs when verbose is true", () => {
    const output = [];
    const originalWrite = process.stderr.write;
    process.stderr.write = (msg) => output.push(msg);

    const log = createVerboseLogger("test-module");
    log("Test message", true);

    process.stderr.write = originalWrite;

    assert({
      given: "verbose true",
      should: "output message with prefix",
      actual: output[0],
      expected: "[test-module] Test message\n",
    });
  });

  test("creates logger that is silent when verbose is false", () => {
    const output = [];
    const originalWrite = process.stderr.write;
    process.stderr.write = (msg) => output.push(msg);

    const log = createVerboseLogger("test-module");
    log("Test message", false);

    process.stderr.write = originalWrite;

    assert({
      given: "verbose false",
      should: "not output anything",
      actual: output.length,
      expected: 0,
    });
  });
});

describe("verboseLog", () => {
  test("outputs with prefix when verbose is true", () => {
    const output = [];
    const originalWrite = process.stderr.write;
    process.stderr.write = (msg) => output.push(msg);

    verboseLog("my-module", "Test message", true);

    process.stderr.write = originalWrite;

    assert({
      given: "verbose true",
      should: "output message with prefix",
      actual: output[0],
      expected: "[my-module] Test message\n",
    });
  });

  test("is silent when verbose is false", () => {
    const output = [];
    const originalWrite = process.stderr.write;
    process.stderr.write = (msg) => output.push(msg);

    verboseLog("my-module", "Test message", false);

    process.stderr.write = originalWrite;

    assert({
      given: "verbose false",
      should: "not output anything",
      actual: output.length,
      expected: 0,
    });
  });
});

// =============================================================================
// fetchWithTimeout tests
// =============================================================================

describe("fetchWithTimeout", () => {
  test("returns response on success within timeout", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => "OK",
    });

    const response = await fetchWithTimeout(
      "https://api.test.com/data",
      {},
      5000,
    );

    assert({
      given: "successful fetch within timeout",
      should: "return response",
      actual: response.status,
      expected: 200,
    });
  });

  test("throws FETCH_TIMEOUT on abort", async () => {
    // Simulate a slow request that will be aborted by our timeout
    // The mock listens to the signal and rejects when aborted
    mockFetch.mockImplementationOnce(
      (url, options) =>
        new Promise((_, reject) => {
          // When the signal aborts (from our timeout), reject with AbortError
          options.signal.addEventListener("abort", () => {
            const error = new Error("Aborted");
            error.name = "AbortError";
            reject(error);
          });
          // This promise would never resolve on its own - simulates slow server
        }),
    );

    let error;
    try {
      // Short timeout so test runs fast
      await fetchWithTimeout("https://api.test.com/slow", {}, 50);
    } catch (e) {
      error = e;
    }

    // error-causes stores code in error.cause.code
    assert({
      given: "request that times out",
      should: "throw FETCH_TIMEOUT error",
      actual: error?.cause?.code,
      expected: "FETCH_TIMEOUT",
    });

    assert({
      given: "timeout error",
      should: "include URL in error",
      actual: error?.cause?.url,
      expected: "https://api.test.com/slow",
    });
  });

  test("respects external AbortSignal for cancellation", async () => {
    // Create an external controller that will abort
    const externalController = new AbortController();

    // Mock fetch to simulate a pending request that gets aborted externally
    mockFetch.mockImplementationOnce(
      (url, options) =>
        new Promise((_, reject) => {
          // Listen for abort on the combined signal
          options.signal.addEventListener("abort", () => {
            const error = new Error("Aborted");
            error.name = "AbortError";
            reject(error);
          });
        }),
    );

    // Start the fetch, then abort via external signal
    const fetchPromise = fetchWithTimeout(
      "https://api.test.com/slow",
      { signal: externalController.signal },
      30000, // Long timeout so it won't timeout first
    );

    // Abort via external signal
    externalController.abort();

    let error;
    try {
      await fetchPromise;
    } catch (e) {
      error = e;
    }

    // External abort should NOT be wrapped as FETCH_TIMEOUT
    // It should be rethrown as-is (AbortError)
    assert({
      given: "external signal aborts request",
      should: "throw AbortError (not FETCH_TIMEOUT)",
      actual: error?.name,
      expected: "AbortError",
    });

    // Should NOT have FETCH_TIMEOUT code
    assert({
      given: "external signal aborts request",
      should: "not be classified as timeout",
      actual: error?.cause?.code !== "FETCH_TIMEOUT",
      expected: true,
    });
  });

  test("rejects immediately if external signal already aborted", async () => {
    // Create already-aborted signal
    const abortedController = new AbortController();
    abortedController.abort();

    let error;
    try {
      await fetchWithTimeout(
        "https://api.test.com/data",
        { signal: abortedController.signal },
        5000,
      );
    } catch (e) {
      error = e;
    }

    // Should throw immediately without calling fetch
    assert({
      given: "already-aborted signal",
      should: "throw AbortError immediately",
      actual: error?.name,
      expected: "AbortError",
    });

    // Fetch should not have been called
    assert({
      given: "already-aborted signal",
      should: "not call fetch",
      actual: mockFetch.mock.calls.length,
      expected: 0,
    });
  });

  test("passes through non-timeout errors with wrapping", async () => {
    const networkError = new Error("Network failure");
    networkError.code = "ECONNREFUSED";
    mockFetch.mockRejectedValueOnce(networkError);

    let error;
    try {
      await fetchWithTimeout("https://api.test.com/data", {}, 5000);
    } catch (e) {
      error = e;
    }

    // Error is wrapped with FetchError
    assert({
      given: "non-timeout network error",
      should: "wrap with FetchError",
      actual: error?.cause?.code,
      expected: "FETCH_FAILED",
    });

    assert({
      given: "wrapped network error",
      should: "preserve original error code",
      actual: error?.cause?.originalCode,
      expected: "ECONNREFUSED",
    });

    assert({
      given: "wrapped network error",
      should: "preserve original error in cause",
      actual: error?.cause?.cause?.message,
      expected: "Network failure",
    });

    assert({
      given: "wrapped network error",
      should: "include URL in error context",
      actual: error?.cause?.url,
      expected: "https://api.test.com/data",
    });
  });
});

// =============================================================================
// fetchWithRetry tests
// =============================================================================

describe("fetchWithRetry", () => {
  test("returns response on first success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => "OK",
    });

    const response = await fetchWithRetry(
      "https://api.test.com/data",
      {},
      { maxRetries: 3 },
    );

    assert({
      given: "successful first attempt",
      should: "return response",
      actual: response.status,
      expected: 200,
    });

    assert({
      given: "successful first attempt",
      should: "only call fetch once",
      actual: mockFetch.mock.calls.length,
      expected: 1,
    });
  });

  test("retries on 502 and succeeds", async () => {
    // First call returns 502, second succeeds
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        headers: new Map(),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => "OK",
      });

    const response = await fetchWithRetry(
      "https://api.test.com/data",
      {},
      { maxRetries: 3, baseDelayMs: 1 }, // Use 1ms delay for fast tests
    );

    assert({
      given: "502 then 200",
      should: "return success response",
      actual: response.status,
      expected: 200,
    });

    assert({
      given: "retry scenario",
      should: "call fetch twice",
      actual: mockFetch.mock.calls.length,
      expected: 2,
    });
  });

  test("retries on 429 with Retry-After header", async () => {
    // First call returns 429, second succeeds
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Map([["Retry-After", "1"]]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => "OK",
      });

    const response = await fetchWithRetry(
      "https://api.test.com/data",
      {},
      { maxRetries: 3, baseDelayMs: 1 },
    );

    assert({
      given: "rate limited then success",
      should: "return success response",
      actual: response.status,
      expected: 200,
    });
  });

  test("retries on ECONNRESET", async () => {
    const networkError = new Error("Connection reset");
    networkError.code = "ECONNRESET";

    mockFetch.mockRejectedValueOnce(networkError).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => "OK",
    });

    const response = await fetchWithRetry(
      "https://api.test.com/data",
      {},
      { maxRetries: 3, baseDelayMs: 1 },
    );

    assert({
      given: "ECONNRESET then success",
      should: "return success response",
      actual: response.status,
      expected: 200,
    });
  });

  test("throws FETCH_RETRY_EXHAUSTED after max retries", async () => {
    // All attempts return 503
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      headers: new Map(),
    });

    let error;
    try {
      await fetchWithRetry(
        "https://api.test.com/data",
        {},
        { maxRetries: 2, baseDelayMs: 1 },
      );
    } catch (e) {
      error = e;
    }

    // error-causes stores code in error.cause.code
    assert({
      given: "all retries exhausted",
      should: "throw FETCH_RETRY_EXHAUSTED",
      actual: error?.cause?.code,
      expected: "FETCH_RETRY_EXHAUSTED",
    });

    assert({
      given: "exhausted retries",
      should: "include attempt count",
      actual: error?.cause?.attempts,
      expected: 2,
    });
  });

  test("does not retry on 400 errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: new Map(),
      text: async () => JSON.stringify({ error: "Bad request" }),
    });

    const response = await fetchWithRetry(
      "https://api.test.com/data",
      {},
      { maxRetries: 3, baseDelayMs: 1 },
    );

    assert({
      given: "400 error",
      should: "return response without retry",
      actual: response.status,
      expected: 400,
    });

    assert({
      given: "non-retryable error",
      should: "only call fetch once",
      actual: mockFetch.mock.calls.length,
      expected: 1,
    });
  });

  test("does not retry on non-retryable network errors", async () => {
    const error = new Error("Unknown error");
    error.code = "SOME_UNKNOWN_CODE";
    mockFetch.mockRejectedValueOnce(error);

    let caught;
    try {
      await fetchWithRetry(
        "https://api.test.com/data",
        {},
        { maxRetries: 3, baseDelayMs: 1 },
      );
    } catch (e) {
      caught = e;
    }

    // Error is wrapped by fetchWithTimeout as FetchError
    assert({
      given: "non-retryable network error",
      should: "wrap with FetchError",
      actual: caught?.cause?.code,
      expected: "FETCH_FAILED",
    });

    assert({
      given: "wrapped non-retryable error",
      should: "preserve original error code",
      actual: caught?.cause?.originalCode,
      expected: "SOME_UNKNOWN_CODE",
    });

    assert({
      given: "wrapped non-retryable error",
      should: "include retryable flag",
      actual: caught?.cause?.retryable,
      expected: false,
    });

    assert({
      given: "non-retryable error",
      should: "only call fetch once",
      actual: mockFetch.mock.calls.length,
      expected: 1,
    });
  });
});

// =============================================================================
// fetchJson tests
// =============================================================================

describe("fetchJson", () => {
  test("parses JSON response on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map(),
      text: async () => JSON.stringify({ success: true, data: "test" }),
    });

    const result = await fetchJson("https://api.test.com/data");

    assert({
      given: "successful JSON response",
      should: "return parsed JSON",
      actual: result.success,
      expected: true,
    });
  });

  test("throws on non-OK response with body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: new Map(),
      text: async () => JSON.stringify({ error: "Bad request" }),
    });

    let error;
    try {
      await fetchJson("https://api.test.com/data");
    } catch (e) {
      error = e;
    }

    assert({
      given: "400 response",
      should: "throw error with status",
      actual: error?.status,
      expected: 400,
    });

    assert({
      given: "400 response",
      should: "include body in error",
      actual: error?.body?.error,
      expected: "Bad request",
    });
  });

  test("throws on invalid JSON", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map(),
      text: async () => "not json",
    });

    let error;
    try {
      await fetchJson("https://api.test.com/data");
    } catch (e) {
      error = e;
    }

    assert({
      given: "invalid JSON response",
      should: "throw error",
      actual: error?.message.includes("Expected JSON"),
      expected: true,
    });
  });

  test("throws EMPTY_RESPONSE on empty body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map(),
      text: async () => "",
    });

    let error;
    try {
      await fetchJson("https://api.test.com/data");
    } catch (e) {
      error = e;
    }

    assert({
      given: "empty response body",
      should: "throw error with EMPTY_RESPONSE code",
      actual: error?.code,
      expected: "EMPTY_RESPONSE",
    });

    assert({
      given: "empty response body",
      should: "include status in error",
      actual: error?.status,
      expected: 200,
    });

    assert({
      given: "empty response body",
      should: "include URL in error",
      actual: error?.url,
      expected: "https://api.test.com/data",
    });
  });
});

// =============================================================================
// isAuthError tests
// =============================================================================

describe("isAuthError", () => {
  test("returns true for 401 status", () => {
    const err = new Error("Unauthorized");
    err.status = 401;

    assert({
      given: "error with status 401",
      should: "return true",
      actual: isAuthError(err),
      expected: true,
    });
  });

  test("returns true for expiring soon hint", () => {
    const err = new Error("Token error");
    err.body = { hint: "Token expiring soon" };

    assert({
      given: "error with expiring soon hint",
      should: "return true",
      actual: isAuthError(err),
      expected: true,
    });
  });

  test("returns true for auth code in body", () => {
    const err = new Error("Auth error");
    err.body = { code: "auth.token_expired" };

    assert({
      given: "error with auth code",
      should: "return true",
      actual: isAuthError(err),
      expected: true,
    });
  });

  test("returns false for non-auth errors", () => {
    const err = new Error("Server error");
    err.status = 500;

    assert({
      given: "500 error",
      should: "return false",
      actual: isAuthError(err),
      expected: false,
    });
  });

  test("returns false for null/undefined", () => {
    assert({
      given: "null input",
      should: "return false",
      actual: isAuthError(null),
      expected: false,
    });
  });
});

describe("isLikelyClerkTokenProblem", () => {
  test("is alias for isAuthError", () => {
    assert({
      given: "the function",
      should: "be same as isAuthError",
      actual: isLikelyClerkTokenProblem === isAuthError,
      expected: true,
    });
  });
});

// =============================================================================
// isPathSafe tests
// =============================================================================

describe("isPathSafe", () => {
  test("accepts valid relative paths", () => {
    assert({
      given: "valid relative path",
      should: "return safe true",
      actual: isPathSafe("src/App.tsx").safe,
      expected: true,
    });
  });

  test("rejects path traversal", () => {
    const result = isPathSafe("../../../etc/passwd");

    assert({
      given: "path with traversal",
      should: "return safe false",
      actual: result.safe,
      expected: false,
    });
  });

  test("rejects absolute paths", () => {
    const result = isPathSafe("/etc/passwd");

    assert({
      given: "absolute path",
      should: "return safe false",
      actual: result.safe,
      expected: false,
    });
  });

  test("rejects Windows absolute paths", () => {
    const result = isPathSafe("C:\\Windows\\System32");

    assert({
      given: "Windows absolute path",
      should: "return safe false",
      actual: result.safe,
      expected: false,
    });
  });

  test("rejects URL-encoded traversal", () => {
    const result = isPathSafe("src/%2e%2e/etc/passwd");

    assert({
      given: "URL-encoded traversal",
      should: "return safe false",
      actual: result.safe,
      expected: false,
    });
  });

  test("rejects null bytes", () => {
    const result = isPathSafe("src/file\0.txt");

    assert({
      given: "path with null byte",
      should: "return safe false",
      actual: result.safe,
      expected: false,
    });
  });

  test("accepts dotfiles", () => {
    assert({
      given: "dotfile path",
      should: "return safe true",
      actual: isPathSafe(".gitignore").safe,
      expected: true,
    });
  });

  test("rejects UNC paths", () => {
    const result = isPathSafe("\\\\server\\share\\file.txt");

    assert({
      given: "UNC path (Windows network path)",
      should: "return safe false",
      actual: result.safe,
      expected: false,
    });

    assert({
      given: "UNC path rejection",
      should: "give absolute path reason",
      actual: result.reason,
      expected: "Absolute paths are not allowed",
    });
  });

  test("rejects UNC paths with extended prefix", () => {
    // \\?\C:\ is Windows extended-length path prefix
    const result = isPathSafe("\\\\?\\C:\\Windows\\System32");

    assert({
      given: "UNC extended-length path",
      should: "return safe false",
      actual: result.safe,
      expected: false,
    });
  });
});

// =============================================================================
// deepClone tests
// =============================================================================

describe("deepClone", () => {
  test("creates independent copy", () => {
    const original = { a: 1, b: { c: 2 } };
    const clone = deepClone(original);
    clone.b.c = 999;

    assert({
      given: "cloned object modified",
      should: "not affect original",
      actual: original.b.c,
      expected: 2,
    });
  });

  test("handles null", () => {
    assert({
      given: "null input",
      should: "return null",
      actual: deepClone(null),
      expected: null,
    });
  });

  test("handles primitives", () => {
    assert({
      given: "string input",
      should: "return same string",
      actual: deepClone("test"),
      expected: "test",
    });
  });
});

// =============================================================================
// mergeConfig tests
// =============================================================================

describe("mergeConfig", () => {
  test("merges objects immutably", () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };
    const result = mergeConfig(target, source);

    assert({
      given: "two objects",
      should: "merge with source overwriting",
      actual: result,
      expected: { a: 1, b: 3, c: 4 },
    });

    assert({
      given: "merge operation",
      should: "not modify original target",
      actual: target.b,
      expected: 2,
    });
  });
});

// =============================================================================
// allowedOrigins export tests
// =============================================================================

describe("allowedOrigins", () => {
  test("exports API origins", () => {
    assert({
      given: "allowedOrigins.api",
      should: "include production URL",
      actual: allowedOrigins.api.includes("https://api.vibecodr.space"),
      expected: true,
    });
  });

  test("exports player origins", () => {
    assert({
      given: "allowedOrigins.player",
      should: "include production URL",
      actual: allowedOrigins.player.includes("https://vibecodr.space"),
      expected: true,
    });
  });
});

// =============================================================================
// SECURITY: URL Origin Confusion Attack Tests (CRITICAL-2)
// =============================================================================

describe("validateApiBase - origin confusion attacks", () => {
  test("rejects URLs with embedded credentials", () => {
    const result = validateApiBase("https://api.vibecodr.space@evil.com/api");

    assert({
      given: "URL with embedded credentials (origin confusion attack)",
      should: "return valid false",
      actual: result.valid,
      expected: false,
    });

    assert({
      given: "URL with embedded credentials",
      should: "include credentials in reason",
      actual: result.reason.includes("credentials"),
      expected: true,
    });
  });

  test("rejects URLs with username only", () => {
    const result = validateApiBase("https://user@api.vibecodr.space");

    assert({
      given: "URL with username only",
      should: "return valid false",
      actual: result.valid,
      expected: false,
    });
  });

  test("rejects URLs with backslashes", () => {
    const result = validateApiBase("https://api.vibecodr.space\\@evil.com");

    assert({
      given: "URL with backslash",
      should: "return valid false",
      actual: result.valid,
      expected: false,
    });
  });
});

// =============================================================================
// SECURITY: Unicode Path Traversal Bypass Tests (CRITICAL-1)
// =============================================================================

describe("isPathSafe - Unicode bypass attempts", () => {
  test("rejects fullwidth dot traversal (\\uFF0E)", () => {
    // \uFF0E is FULLWIDTH FULL STOP which looks like "."
    const result = isPathSafe("src/\uFF0E\uFF0E/etc/passwd");

    assert({
      given: "path with Unicode fullwidth dots (bypass attempt)",
      should: "return safe false",
      actual: result.safe,
      expected: false,
    });
  });

  test("rejects one dot leader traversal (\\u2024)", () => {
    // \u2024 is ONE DOT LEADER which looks like "."
    const result = isPathSafe("src/\u2024\u2024/etc/passwd");

    assert({
      given: "path with Unicode one dot leader (bypass attempt)",
      should: "return safe false",
      actual: result.safe,
      expected: false,
    });
  });

  test("rejects mixed Unicode and ASCII dots", () => {
    // Mix of \uFF0E and ASCII "."
    const result = isPathSafe("src/\uFF0E./etc/passwd");

    assert({
      given: "path with mixed Unicode and ASCII dots",
      should: "return safe false",
      actual: result.safe,
      expected: false,
    });
  });

  test("accepts legitimate Unicode in filenames", () => {
    // Legitimate international characters should be allowed
    const result = isPathSafe("src/日本語ファイル.tsx");

    assert({
      given: "path with legitimate Japanese characters",
      should: "return safe true",
      actual: result.safe,
      expected: true,
    });
  });

  test("accepts legitimate emoji in filenames", () => {
    const result = isPathSafe("src/components/Button🎉.tsx");

    assert({
      given: "path with emoji",
      should: "return safe true",
      actual: result.safe,
      expected: true,
    });
  });
});
