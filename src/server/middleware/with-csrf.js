/**
 * CSRF protection middleware using double-submit cookie pattern
 */

import { createId } from "@paralleldrive/cuid2";
import { sha3_256 } from "js-sha3";

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
const COOKIE_NAME = "csrf_token";

const parseCookies = (cookieHeader) => {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split("=");
    cookies[name] = value;
    return cookies;
  }, {});
};

const hashToken = (token) => sha3_256(token || "");

const tokensMatch = (token1, token2) => {
  return hashToken(token1) === hashToken(token2);
};

const buildCookieString = (token) => {
  const parts = [`${COOKIE_NAME}=${token}`, "SameSite=Strict"];
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  return parts.join("; ");
};

const rejectRequest = (response, requestId) => {
  console.log({
    message: "CSRF validation failed",
    requestId,
  });
  response.status(403);
  response.json({
    error: "CSRF validation failed",
    requestId,
  });
};

const withCSRF = async ({ request, response }) => {
  if (!response.locals) response.locals = {};

  if (SAFE_METHODS.includes(request.method)) {
    const token = createId();
    response.locals.csrfToken = token;
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
    rejectRequest(response, response.locals?.requestId);
    return { request, response };
  }

  return { request, response };
};

export { withCSRF };
