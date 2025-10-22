/**
 * Core route handling utilities using asyncPipe composition
 * This pattern replaces Express middleware chains with functional composition
 */

import { asyncPipe } from "../../lib/asyncPipe.js";

/**
 * Converts traditional Express middleware to functional middleware
 * @param {Function} middleware - Express-style middleware function
 * @returns {Function} Functional middleware
 */
const convertMiddleware =
  (middleware) =>
  async ({ request, response }) => {
    try {
      await middleware(request, response, () => {});
      return {
        request,
        response,
      };
    } catch (error) {
      throw new Error(error);
    }
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
        body: JSON.stringify(request.body),
        query: JSON.stringify(request.query),
        method,
        headers: JSON.stringify(headers),
        error: true,
        url,
        message: e.message,
        stack: e.stack,
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
