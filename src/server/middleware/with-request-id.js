/**
 * Request ID middleware
 * Generates unique CUID2 request ID for tracking and logging
 */

import { createId } from "@paralleldrive/cuid2";

const appendId = (response) => {
  if (!response.locals) response.locals = {};
  response.locals.requestId = createId();
  return response;
};

const withRequestId = async ({ request, response }) => ({
  request,
  response: appendId(response),
});

export default withRequestId;
