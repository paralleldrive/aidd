/**
 * Request ID middleware
 * Generates unique CUID2 request ID for tracking and logging
 */

import { createId } from "@paralleldrive/cuid2";

/** @param {any} response */
const appendId = (response) => {
  if (!response.locals) response.locals = {};
  response.locals.requestId = createId();
  return response;
};

const withRequestId = async (
  /** @type {import('../index.js').ServerContext} */ { request, response },
) => ({
  request,
  response: appendId(response),
});

export { withRequestId };
