import { describe, test } from "vitest";
import { assert } from "riteway/vitest";
import withServerError from "./with-server-error.js";
import { createServer } from "../test-utils.js";

describe("withServerError", () => {
  test("attaches serverError function to response.locals", async () => {
    const result = await withServerError(createServer());

    assert({
      given: "server object",
      should: "attach serverError function to response.locals",
      actual: typeof result.response.locals.serverError,
      expected: "function",
    });
  });

  test("creates error response with default values", async () => {
    const result = await withServerError(createServer());
    const errorResponse = result.response.locals.serverError();

    assert({
      given: "no parameters",
      should: "use default error message",
      actual: errorResponse.error.message,
      expected: "Internal Server Error",
    });

    assert({
      given: "no parameters",
      should: "use default status code",
      actual: errorResponse.error.status,
      expected: 500,
    });
  });

  test("creates error response with custom message and status", async () => {
    const result = await withServerError(createServer());
    const errorResponse = result.response.locals.serverError({
      message: "Not Found",
      status: 404,
    });

    assert({
      given: "custom message and status",
      should: "use custom message",
      actual: errorResponse.error.message,
      expected: "Not Found",
    });

    assert({
      given: "custom message and status",
      should: "use custom status",
      actual: errorResponse.error.status,
      expected: 404,
    });
  });

  test("includes requestId from response.locals", async () => {
    const mockResponse = {
      locals: {
        requestId: "test-request-123",
      },
    };

    const result = await withServerError(
      createServer({
        response: mockResponse,
      }),
    );

    const errorResponse = result.response.locals.serverError();

    assert({
      given: "response with requestId",
      should: "include requestId in error response",
      actual: errorResponse.error.requestId,
      expected: "test-request-123",
    });
  });

  test("allows custom requestId override", async () => {
    const mockResponse = {
      locals: {
        requestId: "default-id",
      },
    };

    const result = await withServerError(
      createServer({
        response: mockResponse,
      }),
    );

    const errorResponse = result.response.locals.serverError({
      requestId: "custom-id",
    });

    assert({
      given: "custom requestId parameter",
      should: "use custom requestId",
      actual: errorResponse.error.requestId,
      expected: "custom-id",
    });
  });

  test("creates locals object if missing", async () => {
    const mockResponse = {};

    const result = await withServerError(
      createServer({
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

  test("returns request and response", async () => {
    const result = await withServerError(createServer());

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

  test("error response has correct structure", async () => {
    const result = await withServerError(createServer());
    const errorResponse = result.response.locals.serverError({
      message: "Unauthorized",
      status: 401,
      requestId: "req-456",
    });

    assert({
      given: "error response",
      should: "have error property",
      actual: typeof errorResponse.error,
      expected: "object",
    });

    assert({
      given: "error response",
      should: "have message in error object",
      actual: errorResponse.error.message,
      expected: "Unauthorized",
    });

    assert({
      given: "error response",
      should: "have status in error object",
      actual: errorResponse.error.status,
      expected: 401,
    });

    assert({
      given: "error response",
      should: "have requestId in error object",
      actual: errorResponse.error.requestId,
      expected: "req-456",
    });
  });
});
