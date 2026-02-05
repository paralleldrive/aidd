/**
 * Auth middleware factories for session validation
 * Wraps better-auth to validate sessions and attach user to response.locals
 */

import { createError } from "error-causes";

const defaultOnUnauthenticated = ({ response }) => {
  response.status(401).json({ error: "Unauthorized" });
};

const ensureLocals = (response) => {
  if (!response.locals) response.locals = {};
  return response;
};

const getSession = async ({ auth, request }) => {
  const result = await auth.api.getSession({ headers: request.headers });
  return result;
};

/**
 * Creates auth middleware that requires authentication
 * Returns 401 if no valid session
 *
 * @param {Object} options
 * @param {Object} options.auth - better-auth instance
 * @param {Function} [options.onUnauthenticated] - Custom handler for 401 responses
 * @returns {Function} Middleware function
 *
 * @example
 * const withAuth = createWithAuth({ auth });
 *
 * // Protected route - 401 if not logged in
 * export default createRoute(withAuth, async ({ response }) => {
 *   const { user } = response.locals.auth;
 *   response.json({ email: user.email });
 * });
 */
const createWithAuth = ({
  auth,
  onUnauthenticated = defaultOnUnauthenticated,
} = {}) => {
  if (!auth) {
    throw createError({
      code: "MISSING_AUTH_INSTANCE",
      message: "auth is required. Pass your better-auth instance.",
      name: "ValidationError",
    });
  }

  return async ({ request, response }) => {
    ensureLocals(response);

    const result = await getSession({ auth, request });

    if (!result) {
      onUnauthenticated({ request, response });
      return { request, response };
    }

    response.locals.auth = {
      session: result.session,
      user: result.user,
    };

    return { request, response };
  };
};

/**
 * Creates auth middleware that allows anonymous requests
 * Attaches user if session exists, otherwise sets auth to null
 *
 * @param {Object} options
 * @param {Object} options.auth - better-auth instance
 * @returns {Function} Middleware function
 *
 * @example
 * const withOptionalAuth = createWithOptionalAuth({ auth });
 *
 * // Public route with optional user context
 * export default createRoute(withOptionalAuth, async ({ response }) => {
 *   const user = response.locals.auth?.user;
 *   response.json({
 *     greeting: user ? `Hello, ${user.name}` : 'Hello, guest'
 *   });
 * });
 */
const createWithOptionalAuth = ({ auth } = {}) => {
  if (!auth) {
    throw createError({
      code: "MISSING_AUTH_INSTANCE",
      message: "auth is required. Pass your better-auth instance.",
      name: "ValidationError",
    });
  }

  return async ({ request, response }) => {
    ensureLocals(response);

    const result = await getSession({ auth, request });

    if (!result) {
      response.locals.auth = null;
      return { request, response };
    }

    response.locals.auth = {
      session: result.session,
      user: result.user,
    };

    return { request, response };
  };
};

export { createWithAuth, createWithOptionalAuth };
