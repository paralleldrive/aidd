/**
 * Authentication service layer with CSRF protection and secure error handling
 */

import { validateEmail, validateToken } from "./validation.js";

/**
 * Retrieves CSRF token from meta tag
 * @returns {string} CSRF token or empty string
 */
export const getCsrfToken = () => {
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  return metaTag?.content || "";
};

/**
 * Returns secure error messages that prevent account enumeration
 * @param {string} errorType - Type of error (auth, network, validation)
 * @returns {string} Secure error message
 */
export const getSecureErrorMessage = (errorType) => {
  const messages = {
    auth: "If this email exists, a magic link has been sent.",
    network: "Network error. Please try again.",
    validation: "Please check your input and try again.",
  };
  return messages[errorType] || "An error occurred. Please try again.";
};

/**
 * Sign in with email (sends magic link)
 * @param {string} email - User email address
 * @returns {Promise<Object>} Response data
 * @throws {Error} Secure error message on failure
 */
export const signin = async (email) => {
  const csrfToken = getCsrfToken();

  const response = await fetch("/api/auth/signin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    // Always return generic message to prevent account enumeration
    throw new Error(getSecureErrorMessage("auth"));
  }

  return data;
};

/**
 * Sign up new user
 * @param {Object} params
 * @param {string} params.email - User email
 * @param {string} params.name - User name
 * @returns {Promise<Object>} Response data with userId
 * @throws {Error} Secure error message on failure
 */
export const signup = async ({ email, name }) => {
  const csrfToken = getCsrfToken();

  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ email, name }),
  });

  const data = await response.json();

  if (!response.ok) {
    // Always return generic message to prevent account enumeration
    throw new Error(getSecureErrorMessage("auth"));
  }

  return data;
};

/**
 * Verify magic link token
 * @param {string} token - Magic link token
 * @returns {Promise<Object>} User and session data
 * @throws {Error} Secure error message on failure
 */
export const verifyMagicLink = async (token) => {
  if (!validateToken(token)) {
    throw new Error("Invalid authentication link");
  }

  const csrfToken = getCsrfToken();

  const response = await fetch(
    `/api/auth/verify?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
      headers: {
        "X-CSRF-Token": csrfToken,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Authentication failed");
  }

  return data;
};
