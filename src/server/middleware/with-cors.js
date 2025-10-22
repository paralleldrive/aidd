/**
 * CORS middleware factory for handling cross-origin requests
 *
 * @param {Object} options
 * @param {string|string[]} [options.allowedOrigins='*'] - Allowed origins (single origin or array)
 * @param {string[]} [options.allowedHeaders] - Allowed headers
 * @param {string[]} [options.allowedMethods] - Allowed HTTP methods
 * @returns {Function} CORS middleware
 *
 * @example
 * // Allow specific origins
 * const withCors = createWithCors({
 *   allowedOrigins: ['https://example.com', 'https://app.example.com']
 * })
 *
 * @example
 * // Allow any origin (default, less secure)
 * const withCors = createWithCors({ allowedOrigins: '*' })
 *
 * @example
 * // Use environment variable
 * const withCors = createWithCors({
 *   allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || '*'
 * })
 */
const createWithCors = ({
  allowedOrigins = "*",
  allowedHeaders = [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
  allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"],
} = {}) => {
  const getOrigin = (requestOrigin) => {
    if (allowedOrigins === "*") return "*";
    if (typeof allowedOrigins === "string") {
      return allowedOrigins === requestOrigin ? requestOrigin : null;
    }
    if (Array.isArray(allowedOrigins)) {
      return allowedOrigins.includes(requestOrigin) ? requestOrigin : null;
    }
    return null;
  };

  const appendHeaders = ({ request, response }) => {
    const requestOrigin = request.headers?.origin || request.headers?.Origin;
    const origin = getOrigin(requestOrigin);

    if (origin) {
      response.setHeader("Access-Control-Allow-Origin", origin);
      response.setHeader(
        "Access-Control-Allow-Headers",
        allowedHeaders.join(", "),
      );
      if (request.method === "OPTIONS") {
        response.setHeader(
          "Access-Control-Allow-Methods",
          allowedMethods.join(", "),
        );
      }
    }

    return response;
  };

  return async ({ request, response }) => ({
    request,
    response: appendHeaders({ request, response }),
  });
};

// Default export with wildcard for backward compatibility
// For production, use createWithCors({ allowedOrigins: [...] })
const withCors = createWithCors();

export { createWithCors };
export default withCors;
