/**
 * vibe-publish.test.js
 *
 * Unit tests for vibe-publish module
 * Uses Riteway format with Vitest
 */
import { assert } from "riteway/vitest";
import { describe, test, vi, beforeEach, afterEach } from "vitest";

import {
  createCapsule,
  uploadFile,
  publishCapsule,
  publishVibe,
  isAuthError,
  normalizeOrigin,
  withAuthRetry,
  getMimeType,
} from "./vibe-publish.js";

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
// Helper function tests
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
});

describe("isAuthError", () => {
  test("returns true for 401 status", () => {
    const err = new Error("Unauthorized");
    err.status = 401;

    assert({
      given: "an error with status 401",
      should: "return true",
      actual: isAuthError(err),
      expected: true,
    });
  });

  test("returns false for non-auth errors", () => {
    const err = new Error("Server error");
    err.status = 500;

    assert({
      given: "an error with status 500",
      should: "return false",
      actual: isAuthError(err),
      expected: false,
    });
  });

  test("returns false for null", () => {
    assert({
      given: "null error",
      should: "return false",
      actual: isAuthError(null),
      expected: false,
    });
  });
});

// =============================================================================
// createCapsule tests
// =============================================================================

describe("createCapsule", () => {
  test("throws VALIDATION_ERROR when missing required params", async () => {
    let error;
    try {
      await createCapsule({ apiBase: "http://localhost:8787", token: "test" });
    } catch (e) {
      error = e;
    }

    assert({
      given: "missing title parameter",
      should: "throw error with VALIDATION_ERROR code",
      actual: error?.cause?.code,
      expected: "VALIDATION_ERROR",
    });
  });

  test("creates capsule successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ success: true, capsuleId: "cap-123" }),
    });

    const result = await createCapsule({
      apiBase: "http://localhost:8787",
      token: "test-token",
      title: "Test Vibe",
    });

    assert({
      given: "valid parameters and successful API response",
      should: "return the capsuleId",
      actual: result.capsuleId,
      expected: "cap-123",
    });
  });

  test("includes entry and runner when provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ success: true, capsuleId: "cap-456" }),
    });

    await createCapsule({
      apiBase: "http://localhost:8787",
      token: "test-token",
      title: "Test Vibe",
      entry: "App.tsx",
      runner: "webcontainer",
    });

    // Verify the fetch was called with correct body
    const [, fetchInit] = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchInit.body);

    assert({
      given: "entry and runner parameters",
      should: "include entry in request body",
      actual: body.entry,
      expected: "App.tsx",
    });

    assert({
      given: "entry and runner parameters",
      should: "include runner in request body",
      actual: body.runner,
      expected: "webcontainer",
    });
  });

  test("throws CAPSULE_CREATE_ERROR on API failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ error: "Internal error" }),
    });

    let error;
    try {
      await createCapsule({
        apiBase: "http://localhost:8787",
        token: "test-token",
        title: "Test Vibe",
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "API returns error",
      should: "throw error with CAPSULE_CREATE_ERROR code",
      actual: error?.cause?.code,
      expected: "CAPSULE_CREATE_ERROR",
    });
  });
});

// =============================================================================
// uploadFile tests
// =============================================================================

describe("uploadFile", () => {
  test("throws VALIDATION_ERROR when missing required params", async () => {
    let error;
    try {
      await uploadFile({
        apiBase: "http://localhost:8787",
        token: "test",
        capsuleId: "cap-123",
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "missing path parameter",
      should: "throw error with VALIDATION_ERROR code",
      actual: error?.cause?.code,
      expected: "VALIDATION_ERROR",
    });
  });

  test("rejects path traversal attempts with ..", async () => {
    let error;
    try {
      await uploadFile({
        apiBase: "http://localhost:8787",
        token: "test-token",
        capsuleId: "cap-123",
        path: "../../../etc/passwd",
        content: "malicious",
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "a path with traversal sequences",
      should: "throw VALIDATION_ERROR",
      actual: error?.cause?.code,
      expected: "VALIDATION_ERROR",
    });

    assert({
      given: "a path with traversal sequences",
      should: "include path traversal in error message",
      actual:
        error?.message?.includes("traversal") ||
        error?.message?.includes("forbidden"),
      expected: true,
    });
  });

  test("rejects absolute paths", async () => {
    let error;
    try {
      await uploadFile({
        apiBase: "http://localhost:8787",
        token: "test-token",
        capsuleId: "cap-123",
        path: "/etc/passwd",
        content: "malicious",
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "an absolute path",
      should: "throw VALIDATION_ERROR",
      actual: error?.cause?.code,
      expected: "VALIDATION_ERROR",
    });
  });

  test("rejects URL-encoded path traversal", async () => {
    let error;
    try {
      await uploadFile({
        apiBase: "http://localhost:8787",
        token: "test-token",
        capsuleId: "cap-123",
        path: "src/%2e%2e/etc/passwd",
        content: "malicious",
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "a URL-encoded path traversal",
      should: "throw VALIDATION_ERROR",
      actual: error?.cause?.code,
      expected: "VALIDATION_ERROR",
    });
  });

  test("uploads file successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          ok: true,
          path: "src/App.tsx",
          size: 58,
          totalSize: 58,
          etag: "abc123",
        }),
    });

    const result = await uploadFile({
      apiBase: "http://localhost:8787",
      token: "test-token",
      capsuleId: "cap-123",
      path: "src/App.tsx",
      content: "export default function App() { return <div>Hello</div>; }",
    });

    assert({
      given: "valid parameters and successful upload",
      should: "return ok true",
      actual: result.ok,
      expected: true,
    });

    assert({
      given: "valid parameters and successful upload",
      should: "return the file path",
      actual: result.path,
      expected: "src/App.tsx",
    });

    assert({
      given: "valid parameters and successful upload",
      should: "return the file size",
      actual: result.size,
      expected: 58,
    });

    assert({
      given: "valid parameters and successful upload",
      should: "return the total capsule size",
      actual: result.totalSize,
      expected: 58,
    });

    assert({
      given: "valid parameters and successful upload",
      should: "return the etag",
      actual: result.etag,
      expected: "abc123",
    });
  });

  test("encodes file path in URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          ok: true,
          path: "src/components/My Component.tsx",
          size: 7,
          totalSize: 7,
        }),
    });

    await uploadFile({
      apiBase: "http://localhost:8787",
      token: "test-token",
      capsuleId: "cap-123",
      path: "src/components/My Component.tsx",
      content: "content",
    });

    const [url] = mockFetch.mock.calls[0];

    assert({
      given: "file path with spaces",
      should: "URL encode the path",
      actual: url.includes("My%20Component.tsx"),
      expected: true,
    });
  });

  test("throws FILE_UPLOAD_ERROR on API failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "Invalid file" }),
    });

    let error;
    try {
      await uploadFile({
        apiBase: "http://localhost:8787",
        token: "test-token",
        capsuleId: "cap-123",
        path: "bad-file.txt",
        content: "content",
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "API returns error",
      should: "throw error with FILE_UPLOAD_ERROR code",
      actual: error?.cause?.code,
      expected: "FILE_UPLOAD_ERROR",
    });
  });

  test("throws FILE_UPLOAD_ERROR when response missing ok field", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ path: "test.txt", size: 10 }), // missing ok: true
    });

    let error;
    try {
      await uploadFile({
        apiBase: "http://localhost:8787",
        token: "test-token",
        capsuleId: "cap-123",
        path: "test.txt",
        content: "content",
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "API response missing ok field",
      should: "throw error with FILE_UPLOAD_ERROR code",
      actual: error?.cause?.code,
      expected: "FILE_UPLOAD_ERROR",
    });

    assert({
      given: "API response missing ok field",
      should: "mention expected ok=true in message",
      actual: error?.message?.includes("ok=true"),
      expected: true,
    });
  });

  test("returns response without etag when not provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          ok: true,
          path: "test.txt",
          size: 7,
          totalSize: 7,
          // no etag field
        }),
    });

    const result = await uploadFile({
      apiBase: "http://localhost:8787",
      token: "test-token",
      capsuleId: "cap-123",
      path: "test.txt",
      content: "content",
    });

    assert({
      given: "API response without etag",
      should: "not include etag in result",
      actual: "etag" in result,
      expected: false,
    });
  });

  test("sends correct MIME type for TypeScript files", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          ok: true,
          path: "src/App.tsx",
          size: 7,
          totalSize: 7,
        }),
    });

    await uploadFile({
      apiBase: "https://api.vibecodr.space",
      token: "test-token",
      capsuleId: "cap-123",
      path: "src/App.tsx",
      content: "content",
    });

    const [, fetchInit] = mockFetch.mock.calls[0];

    assert({
      given: "TypeScript file upload",
      should: "send application/typescript Content-Type",
      actual: fetchInit.headers["Content-Type"],
      expected: "application/typescript",
    });
  });

  test("sends correct MIME type for CSS files", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          ok: true,
          path: "styles.css",
          size: 7,
          totalSize: 7,
        }),
    });

    await uploadFile({
      apiBase: "https://api.vibecodr.space",
      token: "test-token",
      capsuleId: "cap-123",
      path: "styles.css",
      content: "content",
    });

    const [, fetchInit] = mockFetch.mock.calls[0];

    assert({
      given: "CSS file upload",
      should: "send text/css Content-Type",
      actual: fetchInit.headers["Content-Type"],
      expected: "text/css",
    });
  });

  test("falls back to octet-stream for unknown extensions", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          ok: true,
          path: "data.xyz",
          size: 7,
          totalSize: 7,
        }),
    });

    await uploadFile({
      apiBase: "https://api.vibecodr.space",
      token: "test-token",
      capsuleId: "cap-123",
      path: "data.xyz",
      content: "content",
    });

    const [, fetchInit] = mockFetch.mock.calls[0];

    assert({
      given: "unknown file extension",
      should: "send application/octet-stream Content-Type",
      actual: fetchInit.headers["Content-Type"],
      expected: "application/octet-stream",
    });
  });

  test("includes If-Match header when etag provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          ok: true,
          path: "test.txt",
          size: 7,
          totalSize: 7,
        }),
    });

    await uploadFile({
      apiBase: "https://api.vibecodr.space",
      token: "test-token",
      capsuleId: "cap-123",
      path: "test.txt",
      content: "content",
      etag: "abc123",
    });

    const [, fetchInit] = mockFetch.mock.calls[0];

    assert({
      given: "etag provided for optimistic concurrency",
      should: "include If-Match header",
      actual: fetchInit.headers["If-Match"],
      expected: '"abc123"',
    });
  });

  test("throws SECURITY_BLOCK on 403 with security code", async () => {
    const mockResponse = {
      ok: false,
      status: 403,
      text: async () =>
        JSON.stringify({
          error: "Unsafe code detected",
          code: "E-VIBECODR-SECURITY-BLOCK",
          reasons: ["eval() detected", "external fetch without proxy"],
          tags: ["security:eval", "security:fetch"],
        }),
    };
    mockFetch.mockResolvedValueOnce(mockResponse);

    let error;
    try {
      await uploadFile({
        apiBase: "https://api.vibecodr.space",
        token: "test-token",
        capsuleId: "cap-123",
        path: "unsafe.js",
        content: "eval('evil')",
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "403 response with security block code",
      should: "throw SECURITY_BLOCK error",
      actual: error?.cause?.code,
      expected: "SECURITY_BLOCK",
    });

    assert({
      given: "403 response with security block code",
      should: "include security reasons in message",
      actual: error?.message?.includes("eval()"),
      expected: true,
    });
  });

  test("throws RATE_LIMITED on 429 response", async () => {
    // Use fake timers to avoid real delays during retry backoff
    // This makes the test instant instead of waiting 2+ seconds
    vi.useFakeTimers();

    // Mock 429 response for all retry attempts (default maxRetries is 3)
    // Use proper headers.get() method that the retry logic uses
    const mockResponse = () => ({
      ok: false,
      status: 429,
      headers: {
        get: (name) => (name === "Retry-After" ? "1" : null),
      },
      text: async () =>
        JSON.stringify({
          error: "Too many requests",
          retryAfter: 1,
        }),
    });
    // Set up mock to return 429 for all 3 retry attempts
    mockFetch.mockResolvedValueOnce(mockResponse());
    mockFetch.mockResolvedValueOnce(mockResponse());
    mockFetch.mockResolvedValueOnce(mockResponse());

    let error;
    const uploadPromise = uploadFile({
      apiBase: "https://api.vibecodr.space",
      token: "test-token",
      capsuleId: "cap-123",
      path: "test.txt",
      content: "content",
    }).catch((e) => {
      error = e;
    });

    // Fast-forward through all pending timers (retry delays)
    await vi.runAllTimersAsync();
    await uploadPromise;

    // Restore real timers
    vi.useRealTimers();

    assert({
      given: "429 rate limit response",
      should: "throw RATE_LIMITED error",
      actual: error?.cause?.code,
      expected: "RATE_LIMITED",
    });

    // Note: After retry exhaustion, retryAfterSeconds may be null since
    // we don't have access to the original response body/headers
    assert({
      given: "429 rate limit response after retries exhausted",
      should: "include retryAfterSeconds property (may be null after retries)",
      actual: "retryAfterSeconds" in (error?.cause || {}),
      expected: true,
    });
  });
});

// =============================================================================
// getMimeType tests
// =============================================================================

describe("getMimeType", () => {
  test("returns correct MIME type for HTML", async () => {
    const { getMimeType } = await import("./vibe-publish.js");

    assert({
      given: ".html extension",
      should: "return text/html",
      actual: getMimeType("index.html"),
      expected: "text/html",
    });
  });

  test("returns correct MIME type for JSON", async () => {
    const { getMimeType } = await import("./vibe-publish.js");

    assert({
      given: ".json extension",
      should: "return application/json",
      actual: getMimeType("package.json"),
      expected: "application/json",
    });
  });

  test("returns correct MIME type for images", async () => {
    const { getMimeType } = await import("./vibe-publish.js");

    assert({
      given: ".png extension",
      should: "return image/png",
      actual: getMimeType("logo.png"),
      expected: "image/png",
    });

    assert({
      given: ".svg extension",
      should: "return image/svg+xml",
      actual: getMimeType("icon.svg"),
      expected: "image/svg+xml",
    });
  });

  test("returns correct MIME type for fonts", async () => {
    const { getMimeType } = await import("./vibe-publish.js");

    assert({
      given: ".woff2 extension",
      should: "return font/woff2",
      actual: getMimeType("font.woff2"),
      expected: "font/woff2",
    });
  });

  test("handles case-insensitive extensions", async () => {
    const { getMimeType } = await import("./vibe-publish.js");

    assert({
      given: "uppercase .HTML extension",
      should: "return text/html",
      actual: getMimeType("INDEX.HTML"),
      expected: "text/html",
    });
  });

  test("falls back for unknown extensions", async () => {
    const { getMimeType } = await import("./vibe-publish.js");

    assert({
      given: "unknown .xyz extension",
      should: "return application/octet-stream",
      actual: getMimeType("data.xyz"),
      expected: "application/octet-stream",
    });
  });
});

// =============================================================================
// publishCapsule tests
// =============================================================================

describe("publishCapsule", () => {
  test("throws VALIDATION_ERROR when missing required params", async () => {
    let error;
    try {
      await publishCapsule({ apiBase: "http://localhost:8787", token: "test" });
    } catch (e) {
      error = e;
    }

    assert({
      given: "missing capsuleId parameter",
      should: "throw error with VALIDATION_ERROR code",
      actual: error?.cause?.code,
      expected: "VALIDATION_ERROR",
    });
  });

  test("throws VALIDATION_ERROR for invalid visibility", async () => {
    let error;
    try {
      await publishCapsule({
        apiBase: "http://localhost:8787",
        token: "test",
        capsuleId: "cap-123",
        visibility: "invalid",
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "invalid visibility value",
      should: "throw error with VALIDATION_ERROR code",
      actual: error?.cause?.code,
      expected: "VALIDATION_ERROR",
    });
  });

  test("publishes capsule successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ postId: "post-789" }),
    });

    const result = await publishCapsule({
      apiBase: "http://localhost:8787",
      token: "test-token",
      capsuleId: "cap-123",
    });

    assert({
      given: "valid parameters and successful API response",
      should: "return the postId",
      actual: result.postId,
      expected: "post-789",
    });
  });

  test("sends visibility in body for non-public", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ postId: "post-789" }),
    });

    await publishCapsule({
      apiBase: "http://localhost:8787",
      token: "test-token",
      capsuleId: "cap-123",
      visibility: "unlisted",
    });

    const [, fetchInit] = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchInit.body);

    assert({
      given: "unlisted visibility",
      should: "include visibility in request body",
      actual: body.visibility,
      expected: "unlisted",
    });
  });

  test("does not send body for public visibility", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ postId: "post-789" }),
    });

    await publishCapsule({
      apiBase: "http://localhost:8787",
      token: "test-token",
      capsuleId: "cap-123",
      visibility: "public",
    });

    const [, fetchInit] = mockFetch.mock.calls[0];

    assert({
      given: "public visibility",
      should: "not include body in request",
      actual: fetchInit.body,
      expected: undefined,
    });
  });
});

// =============================================================================
// publishVibe tests
// =============================================================================

describe("publishVibe", () => {
  test("throws VALIDATION_ERROR when missing required params", async () => {
    let error;
    try {
      await publishVibe({ apiBase: "http://localhost:8787", token: "test" });
    } catch (e) {
      error = e;
    }

    assert({
      given: "missing files and title parameters",
      should: "throw error with VALIDATION_ERROR code",
      actual: error?.cause?.code,
      expected: "VALIDATION_ERROR",
    });
  });

  test("throws VALIDATION_ERROR for empty files array", async () => {
    let error;
    try {
      await publishVibe({
        apiBase: "http://localhost:8787",
        token: "test",
        title: "Test",
        files: [],
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "empty files array",
      should: "throw error with VALIDATION_ERROR code",
      actual: error?.cause?.code,
      expected: "VALIDATION_ERROR",
    });
  });

  test("completes full publish flow successfully", async () => {
    // Mock create capsule
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ success: true, capsuleId: "cap-123" }),
    });

    // Mock file upload (API returns ok: true, not success: true)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({ ok: true, path: "App.tsx", size: 7, totalSize: 7 }),
    });

    // Mock publish
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ postId: "post-789" }),
    });

    const result = await publishVibe({
      apiBase: "http://localhost:8787",
      token: "test-token",
      title: "Test Vibe",
      files: [{ path: "App.tsx", content: "content" }],
    });

    assert({
      given: "valid parameters and successful API responses",
      should: "return success true",
      actual: result.success,
      expected: true,
    });

    assert({
      given: "valid parameters and successful API responses",
      should: "return the postId",
      actual: result.postId,
      expected: "post-789",
    });

    assert({
      given: "valid parameters and successful API responses",
      should: "return the capsuleId",
      actual: result.capsuleId,
      expected: "cap-123",
    });

    assert({
      given: "valid parameters and successful API responses",
      should: "return the player URL",
      actual: result.url,
      expected: "https://vibecodr.space/player/post-789",
    });
  });

  test("uploads multiple files", async () => {
    // Mock create capsule
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ success: true, capsuleId: "cap-123" }),
    });

    // Mock file uploads (3 files) - API returns ok: true format
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({ ok: true, path: "App.tsx", size: 11, totalSize: 11 }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          ok: true,
          path: "styles.css",
          size: 11,
          totalSize: 22,
        }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          ok: true,
          path: "utils.ts",
          size: 13,
          totalSize: 35,
        }),
    });

    // Mock publish
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ postId: "post-789" }),
    });

    await publishVibe({
      apiBase: "http://localhost:8787",
      token: "test-token",
      title: "Test Vibe",
      files: [
        { path: "App.tsx", content: "app content" },
        { path: "styles.css", content: "css content" },
        { path: "utils.ts", content: "utils content" },
      ],
    });

    // Should have 5 fetch calls: 1 create + 3 uploads + 1 publish
    assert({
      given: "3 files to upload",
      should: "make 5 fetch calls total",
      actual: mockFetch.mock.calls.length,
      expected: 5,
    });
  });
});

// =============================================================================
// withAuthRetry tests
// =============================================================================

describe("withAuthRetry", () => {
  test("returns result when operation succeeds", async () => {
    const operation = async () => ({ success: true });
    const getToken = async () => "new-token";
    const wrapped = withAuthRetry(getToken);

    const result = await wrapped(operation);

    assert({
      given: "successful operation",
      should: "return the operation result",
      actual: result.success,
      expected: true,
    });
  });

  test("retries with new token on auth error", async () => {
    let callCount = 0;
    const operation = async (overrideToken) => {
      callCount++;
      if (callCount === 1) {
        const err = new Error("Unauthorized");
        err.status = 401;
        throw err;
      }
      return { success: true, token: overrideToken };
    };

    const getToken = async () => "refreshed-token";
    const wrapped = withAuthRetry(getToken);

    const result = await wrapped(operation);

    assert({
      given: "auth error on first try",
      should: "retry the operation",
      actual: callCount,
      expected: 2,
    });

    assert({
      given: "auth error on first try",
      should: "return success from retry",
      actual: result.success,
      expected: true,
    });
  });

  test("throws non-auth errors immediately", async () => {
    const operation = async () => {
      const err = new Error("Server error");
      err.status = 500;
      throw err;
    };

    const getToken = async () => "new-token";
    const wrapped = withAuthRetry(getToken);

    let error;
    try {
      await wrapped(operation);
    } catch (e) {
      error = e;
    }

    assert({
      given: "non-auth error",
      should: "throw the error without retry",
      actual: error?.message,
      expected: "Server error",
    });
  });
});

// =============================================================================
// Additional Coverage Tests
// =============================================================================

describe("uploadFile - Unicode path traversal", () => {
  test("rejects Unicode path traversal attempts", async () => {
    let error;
    try {
      // Using Unicode look-alike characters for ".."
      await uploadFile({
        apiBase: "http://localhost:8787",
        token: "test-token",
        capsuleId: "cap-123",
        path: "src/．．/etc/passwd", // Unicode full-width periods
        content: "malicious",
      });
    } catch (e) {
      error = e;
    }

    // Path should be rejected (either as traversal or as invalid character)
    assert({
      given: "Unicode path traversal attempt",
      should: "throw VALIDATION_ERROR",
      actual: error?.cause?.code,
      expected: "VALIDATION_ERROR",
    });
  });
});

describe("publishVibe - partial failure scenarios", () => {
  test("wraps upload error in PUBLISH_FAILED with capsuleId context", async () => {
    // Mock create capsule - succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ success: true, capsuleId: "cap-123" }),
    });

    // Mock file upload - fails with 400 (not retryable)
    // Using 400 instead of 500 to avoid retry behavior
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "Upload failed" }),
    });

    let error;
    try {
      await publishVibe({
        apiBase: "http://localhost:8787",
        token: "test-token",
        title: "Test Vibe",
        files: [{ path: "App.tsx", content: "content" }],
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "capsule created but upload fails",
      should: "throw PUBLISH_FAILED error",
      actual: error?.cause?.code,
      expected: "PUBLISH_FAILED",
    });

    // The cause chain should contain FILE_UPLOAD_ERROR
    // Structure: error.cause (PUBLISH_FAILED) -> error.cause.cause (wrapper) -> error.cause.cause.cause (FILE_UPLOAD_ERROR)
    const hasFileUploadError =
      error?.cause?.cause?.cause?.code === "FILE_UPLOAD_ERROR" ||
      error?.cause?.cause?.code === "FILE_UPLOAD_ERROR";
    assert({
      given: "capsule created but upload fails",
      should: "have FILE_UPLOAD_ERROR in cause chain",
      actual: hasFileUploadError,
      expected: true,
    });
  });

  test("handles empty API response body gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => "", // Empty response
    });

    let error;
    try {
      await createCapsule({
        apiBase: "http://localhost:8787",
        token: "test-token",
        title: "Test Vibe",
      });
    } catch (e) {
      error = e;
    }

    // Should throw CAPSULE_CREATE_ERROR due to JSON parse failure or unexpected shape
    assert({
      given: "empty API response body",
      should: "throw CAPSULE_CREATE_ERROR",
      actual: error?.cause?.code,
      expected: "CAPSULE_CREATE_ERROR",
    });
  });
});
