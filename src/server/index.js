/**
 * Server utilities for API route composition
 */

import { asyncPipe } from "../../lib/asyncPipe.js";
import {
  withCors,
  withRequestId,
  withConfig,
  withServerError,
} from "./middleware/index.js";

export { createRoute, convertMiddleware } from "./create-route.js";
export { createServer } from "./test-utils.js";
export {
  withCors,
  createWithCors,
  withRequestId,
  withConfig,
  createWithConfig,
  withServerError,
} from "./middleware/index.js";

/**
 * Pre-composed standard middleware stack
 * Includes: withRequestId, withCors, withServerError, withConfig
 *
 * Usage:
 *   import { createRoute, defaultMiddleware } from 'aidd/server'
 *   export default createRoute(defaultMiddleware, myHandler)
 */
export const defaultMiddleware = asyncPipe(
  withRequestId,
  withCors,
  withServerError,
  withConfig,
);
