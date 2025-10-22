import { describe, test, beforeEach, vi } from "vitest";
import { assert } from "riteway/vitest";
import { createRoute, convertMiddleware } from "./create-route.js";

describe("createRoute", () => {
  test("composes middleware in order", async () => {
    const order = [];

    const middleware1 = async ({ request, response }) => {
      order.push(1);
      return { request, response };
    };

    const middleware2 = async ({ request, response }) => {
      order.push(2);
      return { request, response };
    };

    const middleware3 = async ({ request, response }) => {
      order.push(3);
      response.status = vi.fn();
      response.json = vi.fn();
      response.status(200);
      response.json({ success: true });
      return { request, response };
    };

    const route = createRoute(middleware1, middleware2, middleware3);

    const mockRequest = {};
    const mockResponse = {};

    await route(mockRequest, mockResponse);

    assert({
      given: "multiple middleware",
      should: "execute in order",
      actual: order,
      expected: [1, 2, 3],
    });
  });

  test("passes modified request through chain", async () => {
    const middleware1 = async ({ request, response }) => {
      request.customField = "added";
      return { request, response };
    };

    const middleware2 = async ({ request, response }) => {
      response.status = vi.fn();
      response.json = vi.fn();
      response.json({ field: request.customField });
      return { request, response };
    };

    const route = createRoute(middleware1, middleware2);

    const mockRequest = {};
    const mockResponse = {};

    await route(mockRequest, mockResponse);

    assert({
      given: "middleware modifying request",
      should: "pass modified request to next middleware",
      actual: mockRequest.customField,
      expected: "added",
    });
  });

  test("catches middleware errors", async () => {
    const consoleLog = console.log;
    console.log = vi.fn();

    const errorMiddleware = async () => {
      throw new Error("Test error");
    };

    const route = createRoute(errorMiddleware);

    const mockRequest = {
      url: "/test",
      method: "GET",
      headers: {},
    };

    const mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      locals: { requestId: "test-123" },
    };

    await route(mockRequest, mockResponse);

    assert({
      given: "middleware throwing error",
      should: "call response.status with 500",
      actual: mockResponse.status.mock.calls[0][0],
      expected: 500,
    });

    assert({
      given: "middleware throwing error",
      should: "include error and requestId in response",
      actual: mockResponse.json.mock.calls[0][0].error,
      expected: "Internal Server Error",
    });

    assert({
      given: "middleware throwing error",
      should: "include requestId in response",
      actual: mockResponse.json.mock.calls[0][0].requestId,
      expected: "test-123",
    });

    assert({
      given: "middleware throwing error",
      should: "log error with context",
      actual: console.log.mock.calls.length > 0,
      expected: true,
    });

    console.log = consoleLog;
  });
});

describe("convertMiddleware", () => {
  test("converts Express middleware to functional style", async () => {
    const expressMiddleware = (req, res, next) => {
      req.converted = true;
      next();
    };

    const functionalMiddleware = convertMiddleware(expressMiddleware);

    const result = await functionalMiddleware({
      request: {},
      response: {},
    });

    assert({
      given: "Express middleware",
      should: "convert to functional middleware",
      actual: result.request.converted,
      expected: true,
    });

    assert({
      given: "converted middleware",
      should: "return request and response",
      actual:
        typeof result.request === "object" &&
        typeof result.response === "object",
      expected: true,
    });
  });
});
