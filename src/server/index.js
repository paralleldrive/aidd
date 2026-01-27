/**
 * Server utilities for API route composition
 *
 * @example
 * // Compose custom middleware stack for your app
 * import { asyncPipe } from 'aidd/utils';
 * import {
 *   createRoute,
 *   withRequestId,
 *   createWithCors,
 *   withServerError,
 *   createWithConfig,
 *   loadConfigFromEnv
 * } from 'aidd/server';
 *
 * // Create app-specific config middleware
 * const withConfig = createWithConfig(() =>
 *   loadConfigFromEnv(['DATABASE_URL', 'API_KEY'])
 * );
 *
 * // Create CORS middleware with your allowed origins
 * const withCors = createWithCors({
 *   allowedOrigins: ['https://example.com', 'https://app.example.com']
 * });
 *
 * // Compose your default middleware stack
 * const defaultMiddleware = asyncPipe(
 *   withRequestId,
 *   withCors,
 *   withServerError,
 *   withConfig
 * );
 *
 * // Use in routes
 * export default createRoute(defaultMiddleware, myHandler);
 */

export { convertMiddleware, createRoute } from "./create-route.js";
export {
  createConfigObject,
  createWithAuth,
  createWithConfig,
  createWithCors,
  createWithCSRF,
  createWithOptionalAuth,
  handleForm,
  loadConfigFromEnv,
  withCSRF,
  withRequestId,
  withServerError,
} from "./middleware/index.js";
export { createServer } from "./test-utils.js";
