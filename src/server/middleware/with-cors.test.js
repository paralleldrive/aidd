import { describe, test, vi } from "vitest";
import { assert } from "riteway/vitest";
import { createWithCors } from "./with-cors.js";
import { createServer } from "../test-utils.js";

describe("createWithCors", () => {
  test("requires allowedOrigins parameter", async () => {
    let error;
    try {
      createWithCors();
    } catch (e) {
      error = e;
    }

    assert({
      given: "no configuration",
      should: "throw error requiring allowedOrigins",
      actual: error?.message.includes("allowedOrigins is required"),
      expected: true,
    });
  });

  test("allows wildcard origin when explicitly configured", async () => {
    const withCors = createWithCors({ allowedOrigins: "*" });
    const mockResponse = {
      setHeader: vi.fn(),
    };

    await withCors(
      createServer({
        request: { headers: { origin: "https://example.com" } },
        response: mockResponse,
      }),
    );

    const originCall = mockResponse.setHeader.mock.calls.find(
      (call) => call[0] === "Access-Control-Allow-Origin",
    );

    assert({
      given: "wildcard configuration and request with origin",
      should: "set Access-Control-Allow-Origin to wildcard",
      actual: originCall[1],
      expected: "*",
    });
  });

  test("allows single allowed origin", async () => {
    const withCors = createWithCors({
      allowedOrigins: "https://app.example.com",
    });
    const mockResponse = {
      setHeader: vi.fn(),
    };

    await withCors(
      createServer({
        request: { headers: { origin: "https://app.example.com" } },
        response: mockResponse,
      }),
    );

    const originCall = mockResponse.setHeader.mock.calls.find(
      (call) => call[0] === "Access-Control-Allow-Origin",
    );

    assert({
      given: "matching origin",
      should: "allow the origin",
      actual: originCall[1],
      expected: "https://app.example.com",
    });
  });

  test("rejects origin not in allowlist", async () => {
    const withCors = createWithCors({
      allowedOrigins: "https://app.example.com",
    });
    const mockResponse = {
      setHeader: vi.fn(),
    };

    await withCors(
      createServer({
        request: { headers: { origin: "https://evil.com" } },
        response: mockResponse,
      }),
    );

    const originCall = mockResponse.setHeader.mock.calls.find(
      (call) => call[0] === "Access-Control-Allow-Origin",
    );

    assert({
      given: "non-matching origin",
      should: "not set Access-Control-Allow-Origin header",
      actual: originCall,
      expected: undefined,
    });
  });

  test("allows multiple origins via array", async () => {
    const withCors = createWithCors({
      allowedOrigins: ["https://app.example.com", "https://admin.example.com"],
    });
    const mockResponse = {
      setHeader: vi.fn(),
    };

    await withCors(
      createServer({
        request: { headers: { origin: "https://admin.example.com" } },
        response: mockResponse,
      }),
    );

    const originCall = mockResponse.setHeader.mock.calls.find(
      (call) => call[0] === "Access-Control-Allow-Origin",
    );

    assert({
      given: "origin in array of allowed origins",
      should: "allow the origin",
      actual: originCall[1],
      expected: "https://admin.example.com",
    });
  });

  test("rejects null origin for security", async () => {
    const withCors = createWithCors({ allowedOrigins: "*" });
    const mockResponse = {
      setHeader: vi.fn(),
    };

    await withCors(
      createServer({
        request: { headers: { origin: "null" } },
        response: mockResponse,
      }),
    );

    const originCall = mockResponse.setHeader.mock.calls.find(
      (call) => call[0] === "Access-Control-Allow-Origin",
    );

    assert({
      given: "null origin (security risk)",
      should: "reject null origin even with wildcard",
      actual: originCall,
      expected: undefined,
    });
  });

  test("adds Access-Control-Allow-Headers", async () => {
    const withCors = createWithCors({ allowedOrigins: "*" });
    const mockResponse = {
      setHeader: vi.fn(),
    };

    await withCors(
      createServer({
        request: { headers: { origin: "https://example.com" } },
        response: mockResponse,
      }),
    );

    const headersCall = mockResponse.setHeader.mock.calls.find(
      (call) => call[0] === "Access-Control-Allow-Headers",
    );

    assert({
      given: "CORS request",
      should: "add Access-Control-Allow-Headers",
      actual: headersCall[1].includes("Content-Type"),
      expected: true,
    });
  });

  test("adds Allow-Methods for OPTIONS requests", async () => {
    const withCors = createWithCors({ allowedOrigins: "*" });
    const mockResponse = {
      setHeader: vi.fn(),
    };

    await withCors(
      createServer({
        request: {
          method: "OPTIONS",
          headers: { origin: "https://example.com" },
        },
        response: mockResponse,
      }),
    );

    const methodsCall = mockResponse.setHeader.mock.calls.find(
      (call) => call[0] === "Access-Control-Allow-Methods",
    );

    assert({
      given: "OPTIONS request",
      should: "add Access-Control-Allow-Methods header",
      actual: methodsCall[1].includes("POST"),
      expected: true,
    });
  });

  test("does not add Allow-Methods for non-OPTIONS requests", async () => {
    const withCors = createWithCors({ allowedOrigins: "*" });
    const mockResponse = {
      setHeader: vi.fn(),
    };

    await withCors(
      createServer({
        request: { method: "GET", headers: { origin: "https://example.com" } },
        response: mockResponse,
      }),
    );

    const methodsCall = mockResponse.setHeader.mock.calls.find(
      (call) => call[0] === "Access-Control-Allow-Methods",
    );

    assert({
      given: "non-OPTIONS request",
      should: "not add Access-Control-Allow-Methods header",
      actual: methodsCall,
      expected: undefined,
    });
  });

  test("returns request and response", async () => {
    const withCors = createWithCors({ allowedOrigins: "*" });
    const mockResponse = {
      setHeader: vi.fn(),
    };

    const result = await withCors(
      createServer({
        request: { headers: { origin: "https://example.com" } },
        response: mockResponse,
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
      should: "return response object",
      actual: typeof result.response,
      expected: "object",
    });
  });

  test("custom allowed headers", async () => {
    const withCors = createWithCors({
      allowedOrigins: "*",
      allowedHeaders: ["X-Custom-Header"],
    });
    const mockResponse = {
      setHeader: vi.fn(),
    };

    await withCors(
      createServer({
        request: { headers: { origin: "https://example.com" } },
        response: mockResponse,
      }),
    );

    const headersCall = mockResponse.setHeader.mock.calls.find(
      (call) => call[0] === "Access-Control-Allow-Headers",
    );

    assert({
      given: "custom allowed headers",
      should: "use custom headers instead of defaults",
      actual: headersCall[1],
      expected: "X-Custom-Header",
    });
  });

  test("custom allowed methods", async () => {
    const withCors = createWithCors({
      allowedOrigins: "*",
      allowedMethods: ["GET", "POST"],
    });
    const mockResponse = {
      setHeader: vi.fn(),
    };

    await withCors(
      createServer({
        request: {
          method: "OPTIONS",
          headers: { origin: "https://example.com" },
        },
        response: mockResponse,
      }),
    );

    const methodsCall = mockResponse.setHeader.mock.calls.find(
      (call) => call[0] === "Access-Control-Allow-Methods",
    );

    assert({
      given: "custom allowed methods",
      should: "use custom methods instead of defaults",
      actual: methodsCall[1],
      expected: "GET, POST",
    });
  });
});
