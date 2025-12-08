import { describe, test, vi } from "vitest";
import { assert } from "riteway/vitest";
import { createWithAuth, createWithOptionalAuth } from "./with-auth.js";
import { createServer } from "../test-utils.js";

// Mock better-auth instance factory
const createMockAuth = ({
  session = null,
  user = null,
  getSessionError = null,
} = {}) => ({
  api: {
    getSession: vi.fn(async () => {
      if (getSessionError) throw getSessionError;
      if (!session) return null;
      return { session, user };
    }),
  },
});

describe("createWithAuth", () => {
  test("requires auth parameter", async () => {
    let error;
    try {
      createWithAuth();
    } catch (e) {
      error = e;
    }

    assert({
      given: "no configuration",
      should: "throw error with cause",
      actual: error instanceof Error && error.cause !== undefined,
      expected: true,
    });

    assert({
      given: "no configuration",
      should: "have ValidationError name in cause",
      actual: error.cause.name,
      expected: "ValidationError",
    });

    assert({
      given: "no configuration",
      should: "have MISSING_AUTH_INSTANCE code in cause",
      actual: error.cause.code,
      expected: "MISSING_AUTH_INSTANCE",
    });

    assert({
      given: "no configuration",
      should: "include 'auth' and 'required' in message",
      actual:
        error.cause.message.includes("auth") &&
        error.cause.message.includes("required"),
      expected: true,
    });
  });

  test("attaches user and session to response.locals.auth", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    const mockSession = { id: "session-456", expiresAt: new Date() };
    const auth = createMockAuth({ user: mockUser, session: mockSession });

    const withAuth = createWithAuth({ auth });
    const result = await withAuth(
      createServer({
        request: { headers: {} },
      }),
    );

    assert({
      given: "valid session",
      should: "attach user to response.locals.auth",
      actual: result.response.locals.auth.user,
      expected: mockUser,
    });

    assert({
      given: "valid session",
      should: "attach session to response.locals.auth",
      actual: result.response.locals.auth.session,
      expected: mockSession,
    });
  });

  test("returns 401 when no session", async () => {
    const auth = createMockAuth({ session: null });
    const mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const withAuth = createWithAuth({ auth });
    await withAuth(
      createServer({
        request: { headers: {} },
        response: mockResponse,
      }),
    );

    assert({
      given: "no session",
      should: "call response.status with 401",
      actual: mockResponse.status.mock.calls[0]?.[0],
      expected: 401,
    });

    assert({
      given: "no session",
      should: "return error in response body",
      actual: mockResponse.json.mock.calls[0]?.[0]?.error,
      expected: "Unauthorized",
    });
  });

  test("calls custom onUnauthenticated handler when provided", async () => {
    const auth = createMockAuth({ session: null });
    const onUnauthenticated = vi.fn(({ response }) => {
      response.status(403).json({ error: "Custom rejection" });
    });
    const mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const withAuth = createWithAuth({ auth, onUnauthenticated });
    await withAuth(
      createServer({
        request: { headers: {} },
        response: mockResponse,
      }),
    );

    assert({
      given: "custom onUnauthenticated handler",
      should: "call the custom handler",
      actual: onUnauthenticated.mock.calls.length,
      expected: 1,
    });

    assert({
      given: "custom onUnauthenticated handler",
      should: "use custom status code",
      actual: mockResponse.status.mock.calls[0]?.[0],
      expected: 403,
    });
  });

  test("passes request to auth.api.getSession", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    const mockSession = { id: "session-456" };
    const auth = createMockAuth({ user: mockUser, session: mockSession });
    const mockRequest = { headers: { cookie: "session=abc123" } };

    const withAuth = createWithAuth({ auth });
    await withAuth(
      createServer({
        request: mockRequest,
      }),
    );

    assert({
      given: "request with headers",
      should: "pass request to getSession",
      actual: auth.api.getSession.mock.calls[0]?.[0]?.headers !== undefined,
      expected: true,
    });
  });

  test("creates locals object if missing", async () => {
    const mockUser = { id: "user-123" };
    const mockSession = { id: "session-456" };
    const auth = createMockAuth({ user: mockUser, session: mockSession });
    const mockResponse = {};

    const withAuth = createWithAuth({ auth });
    const result = await withAuth(
      createServer({
        request: { headers: {} },
        response: mockResponse,
      }),
    );

    assert({
      given: "response without locals",
      should: "create locals object",
      actual: typeof result.response.locals,
      expected: "object",
    });
  });

  test("returns request and response with auth attached", async () => {
    const auth = createMockAuth({
      user: { id: "1" },
      session: { id: "s1" },
    });

    const withAuth = createWithAuth({ auth });
    const result = await withAuth(
      createServer({
        request: { headers: {} },
      }),
    );

    assert({
      given: "valid session",
      should: "return request object",
      actual: typeof result.request,
      expected: "object",
    });

    assert({
      given: "valid session",
      should: "return response with auth attached",
      actual: result.response.locals.auth !== undefined,
      expected: true,
    });
  });

  test("factory creates independent middleware instances", async () => {
    const auth1 = createMockAuth({
      user: { id: "user-1" },
      session: { id: "s1" },
    });
    const auth2 = createMockAuth({
      user: { id: "user-2" },
      session: { id: "s2" },
    });

    const withAuth1 = createWithAuth({ auth: auth1 });
    const withAuth2 = createWithAuth({ auth: auth2 });

    const result1 = await withAuth1(createServer({ request: { headers: {} } }));
    const result2 = await withAuth2(createServer({ request: { headers: {} } }));

    assert({
      given: "two factory-created middleware instances",
      should: "have different users",
      actual:
        result1.response.locals.auth.user.id !==
        result2.response.locals.auth.user.id,
      expected: true,
    });
  });
});

describe("createWithOptionalAuth", () => {
  test("requires auth parameter", async () => {
    let error;
    try {
      createWithOptionalAuth();
    } catch (e) {
      error = e;
    }

    assert({
      given: "no configuration",
      should: "throw error with cause",
      actual: error instanceof Error && error.cause !== undefined,
      expected: true,
    });

    assert({
      given: "no configuration",
      should: "have ValidationError name in cause",
      actual: error.cause.name,
      expected: "ValidationError",
    });

    assert({
      given: "no configuration",
      should: "have MISSING_AUTH_INSTANCE code in cause",
      actual: error.cause.code,
      expected: "MISSING_AUTH_INSTANCE",
    });

    assert({
      given: "no configuration",
      should: "include 'auth' and 'required' in message",
      actual:
        error.cause.message.includes("auth") &&
        error.cause.message.includes("required"),
      expected: true,
    });
  });

  test("attaches user and session when session exists", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    const mockSession = { id: "session-456" };
    const auth = createMockAuth({ user: mockUser, session: mockSession });

    const withOptionalAuth = createWithOptionalAuth({ auth });
    const result = await withOptionalAuth(
      createServer({
        request: { headers: {} },
      }),
    );

    assert({
      given: "valid session",
      should: "attach user to response.locals.auth",
      actual: result.response.locals.auth.user,
      expected: mockUser,
    });

    assert({
      given: "valid session",
      should: "attach session to response.locals.auth",
      actual: result.response.locals.auth.session,
      expected: mockSession,
    });
  });

  test("sets auth to null when no session", async () => {
    const auth = createMockAuth({ session: null });

    const withOptionalAuth = createWithOptionalAuth({ auth });
    const result = await withOptionalAuth(
      createServer({
        request: { headers: {} },
      }),
    );

    assert({
      given: "no session",
      should: "set auth to null",
      actual: result.response.locals.auth,
      expected: null,
    });
  });

  test("does not return 401 when no session and still sets locals.auth", async () => {
    const auth = createMockAuth({ session: null });
    const mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const withOptionalAuth = createWithOptionalAuth({ auth });
    const result = await withOptionalAuth(
      createServer({
        request: { headers: {} },
        response: mockResponse,
      }),
    );

    assert({
      given: "no session",
      should: "not call response.status",
      actual: mockResponse.status.mock.calls.length,
      expected: 0,
    });

    assert({
      given: "no session",
      should: "still set locals.auth to null",
      actual: result.response.locals.auth,
      expected: null,
    });
  });

  test("passes request to auth.api.getSession", async () => {
    const auth = createMockAuth({ session: null });
    const mockRequest = { headers: { cookie: "session=abc123" } };

    const withOptionalAuth = createWithOptionalAuth({ auth });
    await withOptionalAuth(
      createServer({
        request: mockRequest,
      }),
    );

    assert({
      given: "request with headers",
      should: "pass request to getSession",
      actual: auth.api.getSession.mock.calls[0]?.[0]?.headers !== undefined,
      expected: true,
    });
  });

  test("creates locals object if missing", async () => {
    const auth = createMockAuth({ session: null });
    const mockResponse = {};

    const withOptionalAuth = createWithOptionalAuth({ auth });
    const result = await withOptionalAuth(
      createServer({
        request: { headers: {} },
        response: mockResponse,
      }),
    );

    assert({
      given: "response without locals",
      should: "create locals object",
      actual: typeof result.response.locals,
      expected: "object",
    });
  });

  test("returns request and response with locals initialized", async () => {
    const auth = createMockAuth({ session: null });

    const withOptionalAuth = createWithOptionalAuth({ auth });
    const result = await withOptionalAuth(
      createServer({
        request: { headers: {} },
      }),
    );

    assert({
      given: "middleware execution",
      should: "return request object",
      actual: typeof result.request,
      expected: "object",
    });

    assert({
      given: "middleware execution",
      should: "return response with locals initialized",
      actual: typeof result.response.locals,
      expected: "object",
    });
  });
});
