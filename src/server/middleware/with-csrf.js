/**
 * CSRF protection middleware using double-submit cookie pattern
 *
 * @param {Object} options
 * @param {number} [options.maxAge=10800] - Cookie max age in seconds (default: 3 hours)
 * @returns {Function} CSRF middleware
 *
 * @example
 * // Use default 3-hour cookie lifetime
 * const withCSRF = createWithCSRF();
 *
 * @example
 * // Custom cookie lifetime (1 hour)
 * const withCSRF = createWithCSRF({ maxAge: 60 * 60 });
 */

import { createId } from "@paralleldrive/cuid2";
import { sha3_256 } from "js-sha3";

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
const COOKIE_NAME = "csrf_token";
const DEFAULT_MAX_AGE = 3 * 60 * 60; // 3 hours in seconds

const parseCookies = (cookieHeader) => {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split("=");
    cookies[name] = value;
    return cookies;
  }, {});
};

const hashToken = (token) => sha3_256(token || "");

const tokensMatch = (token1, token2) => hashToken(token1) === hashToken(token2);

const log = (response, data) => {
  const logger = response.locals?.log || console.log;
  logger(data);
};

const rejectRequest = (
  response,
  { requestId, method, url, hasCookie, hasHeader, hasBody },
) => {
  log(response, {
    message: "CSRF validation failed",
    requestId,
    method,
    url,
    hasCookie,
    hasHeader,
    hasBody,
  });
  response.status(403);
  response.json({
    error: "CSRF validation failed",
    requestId,
  });
};

const createWithCSRF = ({ maxAge = DEFAULT_MAX_AGE } = {}) => {
  const buildCookieString = (token) => {
    const parts = [
      `${COOKIE_NAME}=${token}`,
      "SameSite=Strict",
      "Path=/",
      `Max-Age=${maxAge}`,
    ];
    if (process.env.NODE_ENV === "production") {
      parts.push("Secure");
    }
    return parts.join("; ");
  };

  return async ({ request, response }) => {
    if (!response.locals) response.locals = {};

    if (SAFE_METHODS.includes(request.method)) {
      // Reuse existing token if present, otherwise generate new one
      const cookies = parseCookies(request.headers?.cookie);
      const existingToken = cookies[COOKIE_NAME];
      const token = existingToken || createId();

      response.locals.csrfToken = token;
      // Always set cookie to refresh expiry
      response.setHeader("Set-Cookie", buildCookieString(token));
      return { request, response };
    }

    // Unsafe method - validate CSRF token
    const cookies = parseCookies(request.headers?.cookie);
    const cookieToken = cookies[COOKIE_NAME];
    const headerToken = request.headers?.["x-csrf-token"];
    const bodyToken = request.body?._csrf;
    const submittedToken = headerToken || bodyToken;

    if (
      !cookieToken ||
      !submittedToken ||
      !tokensMatch(cookieToken, submittedToken)
    ) {
      rejectRequest(response, {
        requestId: response.locals?.requestId,
        method: request.method,
        url: request.url,
        hasCookie: Boolean(cookieToken),
        hasHeader: Boolean(headerToken),
        hasBody: Boolean(bodyToken),
      });
      return { request, response };
    }

    return { request, response };
  };
};

// Default export with 3-hour cookie lifetime
const withCSRF = createWithCSRF();

export { createWithCSRF, withCSRF };
