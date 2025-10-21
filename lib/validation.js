/**
 * Validation utilities for authentication flows
 */

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export const validateEmail = (email) => email && email.includes("@");

/**
 * Validates name length and content
 * @param {string} name - Name to validate
 * @returns {boolean} True if name has at least 2 non-whitespace characters
 */
export const validateName = (name) => name && name.trim().length >= 2;

/**
 * Validates token format for magic links and sessions
 * @param {string} token - Token to validate
 * @returns {boolean} True if token is valid format (32+ characters)
 */
export const validateToken = (token) => {
  if (!token || typeof token !== "string") return false;
  // Token should be at least 32 characters (base64 encoded 32 bytes = ~43 chars)
  return token.length >= 32;
};
