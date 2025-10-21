import { describe, test, beforeEach, afterEach, vi } from "vitest";
import { assert } from "riteway/vitest";
import {
  getCsrfToken,
  getSecureErrorMessage,
  signin,
  signup,
} from "./auth-service.js";

let mockFetch;

beforeEach(() => {
  mockFetch = vi.fn();
  global.fetch = mockFetch;
  global.document = {
    querySelector: vi.fn(),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getCsrfToken", () => {
  test("retrieves CSRF token from meta tag", () => {
    global.document.querySelector.mockReturnValueOnce({
      content: "test-csrf-token-123",
    });

    assert({
      given: "CSRF meta tag exists",
      should: "return token value",
      actual: getCsrfToken(),
      expected: "test-csrf-token-123",
    });
  });

  test("returns empty string when meta tag not found", () => {
    global.document.querySelector.mockReturnValueOnce(null);

    assert({
      given: "CSRF meta tag missing",
      should: "return empty string",
      actual: getCsrfToken(),
      expected: "",
    });
  });
});

describe("getSecureErrorMessage", () => {
  test("auth errors use generic message", () => {
    assert({
      given: "auth error type",
      should: "return generic message preventing account enumeration",
      actual: getSecureErrorMessage("auth"),
      expected: "If this email exists, a magic link has been sent.",
    });
  });

  test("network errors have specific message", () => {
    assert({
      given: "network error type",
      should: "return network error message",
      actual: getSecureErrorMessage("network"),
      expected: "Network error. Please try again.",
    });
  });

  test("unknown errors have fallback message", () => {
    assert({
      given: "unknown error type",
      should: "return generic fallback message",
      actual: getSecureErrorMessage("unknown"),
      expected: "An error occurred. Please try again.",
    });
  });
});

describe("signin service", () => {
  test("includes CSRF token in request", async () => {
    global.document.querySelector.mockReturnValueOnce({
      content: "csrf-token-abc",
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: "Link sent" }),
    });

    await signin("user@example.com");

    const headers = mockFetch.mock.calls[0][1].headers;

    assert({
      given: "signin request",
      should: "include CSRF token in headers",
      actual: headers["X-CSRF-Token"],
      expected: "csrf-token-abc",
    });
  });

  test("calls correct endpoint", async () => {
    global.document.querySelector.mockReturnValueOnce({ content: "token" });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await signin("user@example.com");

    assert({
      given: "signin request",
      should: "call /api/auth/signin endpoint",
      actual: mockFetch.mock.calls[0][0],
      expected: "/api/auth/signin",
    });
  });

  test("throws secure error message on failure", async () => {
    global.document.querySelector.mockReturnValueOnce({ content: "token" });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: "Email not found" }),
    });

    let error = null;
    try {
      await signin("user@example.com");
    } catch (err) {
      error = err.message;
    }

    assert({
      given: "signin failure",
      should: "throw generic message instead of revealing account existence",
      actual: error,
      expected: "If this email exists, a magic link has been sent.",
    });
  });
});

describe("signup service", () => {
  test("includes CSRF token in request", async () => {
    global.document.querySelector.mockReturnValueOnce({
      content: "csrf-token-xyz",
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, userId: "user123" }),
    });

    await signup({ email: "new@example.com", name: "Alex Archer" });

    const headers = mockFetch.mock.calls[0][1].headers;

    assert({
      given: "signup request",
      should: "include CSRF token in headers",
      actual: headers["X-CSRF-Token"],
      expected: "csrf-token-xyz",
    });
  });

  test("sends email and name in request body", async () => {
    global.document.querySelector.mockReturnValueOnce({ content: "token" });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, userId: "user123" }),
    });

    await signup({ email: "new@example.com", name: "Alex Archer" });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);

    assert({
      given: "signup request",
      should: "include email in body",
      actual: body.email,
      expected: "new@example.com",
    });

    assert({
      given: "signup request",
      should: "include name in body",
      actual: body.name,
      expected: "Alex Archer",
    });
  });

  test("throws secure error message on failure", async () => {
    global.document.querySelector.mockReturnValueOnce({ content: "token" });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: "Email already exists" }),
    });

    let error = null;
    try {
      await signup({ email: "existing@example.com", name: "User" });
    } catch (err) {
      error = err.message;
    }

    assert({
      given: "signup failure",
      should: "throw generic message instead of revealing account existence",
      actual: error,
      expected: "If this email exists, a magic link has been sent.",
    });
  });
});
