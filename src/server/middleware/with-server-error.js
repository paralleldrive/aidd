/**
 * Server error middleware
 * Provides standardized error response helper
 */

const appendServerError = (response) => {
  if (!response.locals) response.locals = {};
  response.locals.serverError = ({
    message = "Internal Server Error",
    status = 500,
    requestId = response.locals.requestId,
  } = {}) => ({
    error: {
      message,
      status,
      requestId,
    },
  });
  return response;
};

const withServerError = async ({ request, response }) => ({
  request,
  response: appendServerError(response),
});

export default withServerError;
