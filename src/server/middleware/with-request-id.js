/**
 * Request ID middleware
 * Generates unique request ID for tracking and logging
 */

import { randomUUID } from "crypto";

const appendId = (response) => {
  if (!response.locals) response.locals = {};
  response.locals.requestId = randomUUID();
  return response;
};

const withRequestId = async ({ request, response }) => ({
  request,
  response: appendId(response),
});

export default withRequestId;
