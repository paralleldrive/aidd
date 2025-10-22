import { describe, test, vi } from "vitest";
import { assert } from "riteway/vitest";
import withCors from "./with-cors.js";
import { createServer } from "../test-utils.js";

describe("withCors", () => {
  test("adds Access-Control-Allow-Origin header", async () => {
    const mockResponse = {
      setHeader: vi.fn(),
    };

    const result = await withCors(
      createServer({
        request: {},
        response: mockResponse,
      }),
    );

    const originCall = mockResponse.setHeader.mock.calls.find(
      (call) => call[0] === "Access-Control-Allow-Origin",
    );

    assert({
      given: "request",
      should: "add Access-Control-Allow-Origin header",
      actual: originCall[1],
      expected: "*",
    });
  });

  test("adds Access-Control-Allow-Headers", async () => {
    const mockResponse = {
      setHeader: vi.fn(),
    };

    const result = await withCors(
      createServer({
        request: {},
        response: mockResponse,
      }),
    );

    const headersCall = mockResponse.setHeader.mock.calls.find(
      (call) => call[0] === "Access-Control-Allow-Headers",
    );

    assert({
      given: "request",
      should: "add Access-Control-Allow-Headers",
      actual: headersCall[1].includes("Content-Type"),
      expected: true,
    });
  });

  test("adds Allow-Methods for OPTIONS requests", async () => {
    const mockResponse = {
      setHeader: vi.fn(),
    };

    const result = await withCors(
      createServer({
        request: { method: "OPTIONS" },
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
    const mockResponse = {
      setHeader: vi.fn(),
    };

    const result = await withCors(
      createServer({
        request: { method: "GET" },
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
    const mockResponse = {
      setHeader: vi.fn(),
    };

    const result = await withCors(
      createServer({
        request: {},
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
});
