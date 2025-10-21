/**
 * Example middleware unit test
 * Demonstrates testing pattern for middleware
 */

import { describe } from "riteway";
import { createServer } from "./test-utils.js";
import withRequestId from "./with-request-id.js";

describe("server/middleware/withRequestId", async (assert) => {
  const result = await withRequestId(createServer());

  assert({
    given: "a server object",
    should: "attach a request id to the response",
    actual: typeof result.response.locals.requestId,
    expected: "string",
  });
});
