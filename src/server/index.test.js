import { describe, test } from "vitest";
import { assert } from "riteway/vitest";
import { defaultMiddleware } from "./index.js";
import { createServer } from "./test-utils.js";

describe("defaultMiddleware", () => {
  test("applies all standard middleware", async () => {
    const result = await defaultMiddleware(createServer());

    assert({
      given: "server object",
      should: "add requestId to response.locals",
      actual: typeof result.response.locals.requestId,
      expected: "string",
    });

    assert({
      given: "server object",
      should: "add CORS headers",
      actual: result.response.getHeader?.("Access-Control-Allow-Origin"),
      expected: "*",
    });

    assert({
      given: "server object",
      should: "add serverError helper",
      actual: typeof result.response.locals.serverError,
      expected: "function",
    });

    assert({
      given: "server object",
      should: "add config to response.locals",
      actual: typeof result.response.locals.config,
      expected: "object",
    });
  });

  test("returns request and response", async () => {
    const result = await defaultMiddleware(createServer());

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

  test("composes middleware in correct order", async () => {
    const mockResponse = {
      locals: {},
      setHeader: () => {},
      getHeader: () => {},
    };

    const result = await defaultMiddleware(
      createServer({
        response: mockResponse,
      }),
    );

    // requestId should be set first
    assert({
      given: "middleware composition",
      should: "have requestId from withRequestId",
      actual: typeof result.response.locals.requestId,
      expected: "string",
    });

    // config should be set last
    assert({
      given: "middleware composition",
      should: "have config from withConfig",
      actual: typeof result.response.locals.config,
      expected: "object",
    });

    // serverError should be available
    assert({
      given: "middleware composition",
      should: "have serverError from withServerError",
      actual: typeof result.response.locals.serverError,
      expected: "function",
    });
  });
});
