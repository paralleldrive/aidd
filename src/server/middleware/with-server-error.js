/**
 * Server error middleware
 * Provides standardized error response helper
 */

/** @param {any} response */
const appendServerError = (response) => {
  if (!response.locals) response.locals = {};
  response.locals.serverError = ({
    message = "Internal Server Error",
    status = 500,
    requestId = response.locals.requestId,
  } = {}) => ({
    error: {
      message,
      requestId,
      status,
    },
  });
  return response;
};

const withServerError = async (
  /** @type {import('../index.js').ServerContext} */ { request, response },
) => ({
  request,
  response: appendServerError(response),
});

export { withServerError };
