/**
 * Core route handling utilities using asyncPipe composition
 * This pattern replaces Express middleware chains with functional composition
 */

import { asyncPipe } from "../../utils/async-pipe.js";

/** @param {Record<string, string | string[] | undefined>} headers */
const sanitizeHeaders = (headers = {}) => {
  const { authorization, cookie, "x-api-key": apiKey, ...safe } = headers;
  return safe;
};

/** @param {any} body */
const sanitizeBody = (body) => {
  if (!body || typeof body !== "object") return body;
  const { password, token, apiKey, secret, ...safe } = body;
  return safe;
};

/**
 * Converts traditional Express middleware to functional middleware
 * Errors bubble up to createRoute's error handler
 *
 * @param {Function} middleware - Express-style middleware function
 * @returns {Function} Functional middleware
 */
const convertMiddleware =
  (middleware) =>
  async (
    /** @type {import('./index.js').ServerContext} */ { request, response },
  ) => {
    await middleware(request, response, () => {});
    return { request, response };
  };

/**
 * Creates a route handler that composes middleware using asyncPipe
 * Catches all errors and returns standardized 500 response
 *
 * @param {...(ctx: any) => any} middleware - Middleware functions to compose
 * @returns {Function} Route handler function
 *
 * @example
 * const myRoute = createRoute(
 *   withRequestId,
 *   withCors,
 *   withAuth,
 *   async ({ request, response }) => {
 *     response.status(200).json({ message: 'Success' });
 *   }
 * );
 */
const createRoute =
  (...middleware) =>
  async (/** @type {any} */ request, /** @type {any} */ response) => {
    try {
      await asyncPipe(.../** @type {Array<(x: any) => any>} */ (middleware))({
        request,
        response,
      });
    } catch (e) {
      const err = /** @type {any} */ (e);
      const requestId = response.locals?.requestId;
      const { url, method, headers } = request;
      console.log({
        body: JSON.stringify(sanitizeBody(request.body)),
        error: true,
        headers: JSON.stringify(sanitizeHeaders(headers)),
        message: err.message,
        method,
        query: JSON.stringify(request.query),
        requestId,
        time: new Date().toISOString(),
        url,
      });
      response.status(500);
      response.json({
        error: "Internal Server Error",
        requestId,
      });
    }
  };

export { convertMiddleware, createRoute };
