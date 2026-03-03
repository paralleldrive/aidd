/**
 * CORS middleware factory for handling cross-origin requests
 *
 * Security: allowedOrigins is REQUIRED. This forces explicit configuration
 * and prevents accidental exposure of APIs to all origins.
 *
 * @param {{ allowedOrigins?: string | string[], allowedHeaders?: string[], allowedMethods?: string[] }} [options]
 * @returns {Function} CORS middleware
 *
 * @example
 * // Secure: Allow specific origins (recommended)
 * const withCors = createWithCors({
 *   allowedOrigins: ['https://example.com', 'https://app.example.com']
 * })
 *
 * @example
 * // Public API: Allow all origins (only for public, read-only APIs)
 * const withCors = createWithCors({
 *   allowedOrigins: '*'  // Explicitly opt-in to wildcard
 * })
 *
 * @example
 * // Environment-based configuration
 * const withCors = createWithCors({
 *   allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
 * })
 *
 * @example
 * // Same-origin only: Don't use CORS middleware at all
 * // Just omit createWithCors from your middleware chain
 */

import { createError } from "error-causes";

const createWithCors = (
  /** @type {{ allowedOrigins?: string | string[], allowedHeaders?: string[], allowedMethods?: string[] }} */ {
    allowedOrigins,
    allowedHeaders = [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
    allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"],
  } = {},
) => {
  // Security: Require explicit origin configuration
  if (!allowedOrigins) {
    throw createError({
      code: "MISSING_ALLOWED_ORIGINS",
      message:
        "CORS configuration error: allowedOrigins is required. " +
        'Specify allowed origins array, a single origin string, or "*" for public APIs. ' +
        "For same-origin only, omit CORS middleware from your route.",
      name: "ConfigurationError",
    });
  }

  /** @param {string | undefined} requestOrigin */
  const getOrigin = (requestOrigin) => {
    // Security: Never allow null origin (can be exploited)
    if (requestOrigin === "null") {
      return null;
    }

    if (allowedOrigins === "*") return "*";
    if (typeof allowedOrigins === "string") {
      return allowedOrigins === requestOrigin ? requestOrigin : null;
    }
    if (Array.isArray(allowedOrigins)) {
      return allowedOrigins.includes(requestOrigin ?? "")
        ? requestOrigin
        : null;
    }
    return null;
  };

  /** @param {import('../index.js').ServerContext} context */
  const appendHeaders = ({ request, response }) => {
    // Node.js normalizes all incoming headers to lowercase
    const requestOrigin = /** @type {string | undefined} */ (
      request.headers?.origin
    );
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

  return async (
    /** @type {import('../index.js').ServerContext} */ { request, response },
  ) => ({
    request,
    response: appendHeaders({ request, response }),
  });
};

export { createWithCors };
