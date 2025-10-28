/**
 * Core route handling utilities using asyncPipe composition
 * This pattern replaces Express middleware chains with functional composition
 */

import { asyncPipe } from "../utils/asyncPipe.js";

const sanitizeHeaders = (headers = {}) => {
  const { authorization, cookie, "x-api-key": apiKey, ...safe } = headers;
  return safe;
};

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
  async ({ request, response }) => {
    await middleware(request, response, () => {});
    return { request, response };
  };

/**
 * Creates a route handler that composes middleware using asyncPipe
 * Catches all errors and returns standardized 500 response
 *
 * @param {...Function} middleware - Middleware functions to compose
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
  async (request, response) => {
    try {
      await asyncPipe(...middleware)({
        request,
        response,
      });
    } catch (e) {
      const requestId = response.locals?.requestId;
      const { url, method, headers } = request;
      console.log({
        time: new Date().toISOString(),
        body: JSON.stringify(sanitizeBody(request.body)),
        query: JSON.stringify(request.query),
        method,
        headers: JSON.stringify(sanitizeHeaders(headers)),
        error: true,
        url,
        message: e.message,
        requestId,
      });
      response.status(500);
      response.json({
        error: "Internal Server Error",
        requestId,
      });
    }
  };

export { createRoute, convertMiddleware };
