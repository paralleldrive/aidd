import { describe, test, vi } from "vitest";
import { assert } from "riteway/vitest";
import { withCSRF } from "./with-csrf.js";

describe("withCSRF", () => {
  // Req 1: GET/HEAD/OPTIONS sets token cookie and response.locals.csrfToken
  test("sets CSRF token cookie and response.locals.csrfToken for GET request", async () => {
    const cookies = {};
    const mockResponse = {
      locals: {},
      setHeader: vi.fn((name, value) => {
        if (name === "Set-Cookie") cookies.raw = value;
      }),
    };

    await withCSRF({
      request: { method: "GET", headers: {} },
      response: mockResponse,
    });

    assert({
      given: "a GET request",
      should: "attach csrfToken to response.locals",
      actual: typeof mockResponse.locals.csrfToken,
      expected: "string",
    });

    assert({
      given: "a GET request",
      should: "set CSRF token cookie",
      actual: cookies.raw?.includes("csrf_token="),
      expected: true,
    });
  });

  // Req 2: POST with matching token in header allowed
  test("allows POST request with matching token in header", async () => {
    const token = "test-token-123";
    const mockResponse = {
      locals: {},
      setHeader: vi.fn(),
      status: vi.fn(),
      json: vi.fn(),
    };

    const result = await withCSRF({
      request: {
        method: "POST",
        headers: {
          cookie: `csrf_token=${token}`,
          "x-csrf-token": token,
        },
      },
      response: mockResponse,
    });

    assert({
      given: "a POST request with matching token in header",
      should: "allow request to proceed and return request/response",
      actual: result.request.method,
      expected: "POST",
    });

    assert({
      given: "a POST request with matching token in header",
      should: "not set error status",
      actual: mockResponse.status.mock.calls.length,
      expected: 0,
    });
  });

  // Req 3: POST with matching token in body allowed
  test("allows POST request with matching token in body field", async () => {
    const token = "test-token-456";
    const mockResponse = {
      locals: {},
      setHeader: vi.fn(),
      status: vi.fn(),
      json: vi.fn(),
    };

    const result = await withCSRF({
      request: {
        method: "POST",
        headers: {
          cookie: `csrf_token=${token}`,
        },
        body: { _csrf: token },
      },
      response: mockResponse,
    });

    assert({
      given: "a POST request with matching token in body",
      should: "allow request to proceed",
      actual: result.request.method,
      expected: "POST",
    });

    assert({
      given: "a POST request with matching token in body",
      should: "not set error status",
      actual: mockResponse.status.mock.calls.length,
      expected: 0,
    });
  });

  // Req 4: Missing cookie token returns 403
  test("rejects POST request when token is missing from cookie", async () => {
    const mockResponse = {
      locals: { requestId: "req-123" },
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await withCSRF({
      request: {
        method: "POST",
        headers: {
          "x-csrf-token": "some-token",
        },
      },
      response: mockResponse,
    });

    assert({
      given: "a POST request with no CSRF cookie",
      should: "return 403 status",
      actual: mockResponse.status.mock.calls[0]?.[0],
      expected: 403,
    });

    assert({
      given: "a POST request with no CSRF cookie",
      should: "return error message",
      actual: mockResponse.json.mock.calls[0]?.[0]?.error,
      expected: "CSRF validation failed",
    });
  });

  // Req 5: Mismatched token returns 403
  test("rejects POST request when tokens do not match", async () => {
    const mockResponse = {
      locals: { requestId: "req-456" },
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await withCSRF({
      request: {
        method: "POST",
        headers: {
          cookie: "csrf_token=cookie-token",
          "x-csrf-token": "different-token",
        },
      },
      response: mockResponse,
    });

    assert({
      given: "a POST request with mismatched tokens",
      should: "return 403 status",
      actual: mockResponse.status.mock.calls[0]?.[0],
      expected: 403,
    });
  });

  // Req 6: Tokens generated with CUID2 (verified by format)
  test("generates tokens using CUID2 format", async () => {
    const mockResponse = {
      locals: {},
      setHeader: vi.fn(),
    };

    await withCSRF({
      request: { method: "GET", headers: {} },
      response: mockResponse,
    });

    // CUID2 tokens are 24 characters by default and lowercase alphanumeric
    const token = mockResponse.locals.csrfToken;

    assert({
      given: "a GET request",
      should:
        "generate token with CUID2 format (24 chars, lowercase alphanumeric)",
      actual: /^[a-z0-9]{24,}$/.test(token),
      expected: true,
    });
  });

  // Req 7: Cookie has SameSite=Strict, Secure in production
  test("sets SameSite=Strict on CSRF cookie", async () => {
    let cookieValue = "";
    const mockResponse = {
      locals: {},
      setHeader: vi.fn((name, value) => {
        if (name === "Set-Cookie") cookieValue = value;
      }),
    };

    await withCSRF({
      request: { method: "GET", headers: {} },
      response: mockResponse,
    });

    assert({
      given: "setting CSRF cookie",
      should: "include SameSite=Strict",
      actual: cookieValue.includes("SameSite=Strict"),
      expected: true,
    });
  });

  test("sets Secure flag in production", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    let cookieValue = "";
    const mockResponse = {
      locals: {},
      setHeader: vi.fn((name, value) => {
        if (name === "Set-Cookie") cookieValue = value;
      }),
    };

    await withCSRF({
      request: { method: "GET", headers: {} },
      response: mockResponse,
    });

    process.env.NODE_ENV = originalEnv;

    assert({
      given: "production environment",
      should: "include Secure flag on cookie",
      actual: cookieValue.includes("Secure"),
      expected: true,
    });
  });

  // Req 8: No HttpOnly on cookie
  test("does not set HttpOnly on CSRF cookie", async () => {
    let cookieValue = "";
    const mockResponse = {
      locals: {},
      setHeader: vi.fn((name, value) => {
        if (name === "Set-Cookie") cookieValue = value;
      }),
    };

    await withCSRF({
      request: { method: "GET", headers: {} },
      response: mockResponse,
    });

    assert({
      given: "setting CSRF cookie",
      should: "not include HttpOnly (client must read token)",
      actual: cookieValue.includes("HttpOnly"),
      expected: false,
    });
  });

  // Req 9: Log rejections without exposing tokens
  test("logs CSRF rejection with request ID but without token values", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const mockResponse = {
      locals: { requestId: "req-789" },
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await withCSRF({
      request: {
        method: "POST",
        headers: {
          cookie: "csrf_token=secret-cookie-token",
          "x-csrf-token": "secret-header-token",
        },
      },
      response: mockResponse,
    });

    const logCall = consoleSpy.mock.calls[0]?.[0];
    consoleSpy.mockRestore();

    assert({
      given: "a CSRF rejection",
      should: "log the failure",
      actual: logCall?.message?.includes("CSRF") || logCall?.includes?.("CSRF"),
      expected: true,
    });

    assert({
      given: "a CSRF rejection",
      should: "include request ID in log",
      actual: JSON.stringify(logCall)?.includes("req-789"),
      expected: true,
    });

    assert({
      given: "a CSRF rejection",
      should: "not expose token values in log",
      actual:
        !JSON.stringify(logCall)?.includes("secret-cookie-token") &&
        !JSON.stringify(logCall)?.includes("secret-header-token"),
      expected: true,
    });
  });
});
