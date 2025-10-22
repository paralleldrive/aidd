import { describe, test } from "vitest";
import { assert } from "riteway/vitest";
import { isCuid } from "@paralleldrive/cuid2";
import { withRequestId } from "./with-request-id.js";
import { createServer } from "../test-utils.js";

describe("withRequestId", () => {
  test("attaches requestId to response.locals", async () => {
    const result = await withRequestId(createServer());

    assert({
      given: "server object",
      should: "attach requestId to response.locals",
      actual: typeof result.response.locals.requestId,
      expected: "string",
    });
  });

  test("generates unique request IDs", async () => {
    const result1 = await withRequestId(createServer());
    const result2 = await withRequestId(createServer());

    assert({
      given: "multiple requests",
      should: "generate unique IDs",
      actual:
        result1.response.locals.requestId !== result2.response.locals.requestId,
      expected: true,
    });
  });

  test("creates locals object if missing", async () => {
    const mockResponse = {};

    const result = await withRequestId(
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
    const result = await withRequestId(createServer());

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

  test("generates CUID2 format", async () => {
    const result = await withRequestId(createServer());

    assert({
      given: "generated requestId",
      should: "match CUID2 format",
      actual: isCuid(result.response.locals.requestId),
      expected: true,
    });
  });
});
