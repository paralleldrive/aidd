/**
 * Token utilities for Email Authentication
 * Provides cryptographically secure token generation and magic link URL creation
 *
 * Security Specifications:
 * - Uses cuid2 with biglength option for maximum security
 * - cuid2 combines multiple entropy sources (crypto.randomBytes + timestamp + counter + fingerprint)
 * - All sources hashed with SHA3 (trap door function, no predictable structure)
 * - Defense-in-depth: protects against potential entropy bugs in crypto APIs
 * - Tokens stored hashed in database for additional security
 * - Single-use tokens (marked as used after verification)
 * - Recommended expiry: 1 hour (balances security with email delivery delays)
 *
 * Why cuid2 over raw crypto.randomBytes:
 * - Historical crypto API bugs (Android SecureRandom, Debian OpenSSL, etc.)
 * - Multiple entropy sources provide backup if one source has weak entropy
 * - SHA3 hashing ensures no structure leakage
 * - Designed to be collision-resistant and unguessable
 *
 * Storage Pattern:
 * Store in database: { hashedToken, email, expiresAt, used: false }
 * Use SHA-256 for additional hashing layer
 *
 * Security References:
 * - OWASP Authentication Cheat Sheet
 * - cuid2 specification and security design
 * - Defense-in-depth principle against entropy failures
 */

import { createId, isCuid } from "@paralleldrive/cuid2";
import { createHash, timingSafeEqual } from "crypto";

/**
 * Generates a cryptographically secure random token using cuid2
 * Uses biglength option for maximum security (longer, more entropy)
 *
 * Security features:
 * - Multiple entropy sources (crypto.randomBytes + timestamp + counter + fingerprint)
 * - SHA3 hashing (trap door function)
 * - Defense against weak entropy in any single source
 * - Collision-resistant and unguessable
 *
 * @returns {string} Secure cuid2 token (biglength for extra security)
 *
 * @example
 * const token = generateSecureToken()
 * // => "tz4a98xxat96iws9zmbrgj3a" (biglength cuid2)
 *
 * Security Note:
 * Hash this token before storing in database using hashToken()
 */
const generateSecureToken = () => createId({ length: 32 });

/**
 * Hashes a token for secure storage
 * Use SHA-256 for one-way hashing (like passwords)
 *
 * @param {string} token - Plain text token to hash
 * @returns {string} Hashed token (hex string)
 *
 * @example
 * const plainToken = generateSecureToken()
 * const hashedToken = hashToken(plainToken)
 * // Store hashedToken in database
 * // Send plainToken in email
 */
const hashToken = (token) => {
  if (!token || typeof token !== "string") {
    throw new Error("token is required and must be a string");
  }

  return createHash("sha256").update(token).digest("hex");
};

/**
 * Validates token format (checks if it's a valid cuid2)
 * Fast pre-check before database lookup
 *
 * @param {string} token - Token to validate
 * @returns {boolean} True if token has valid cuid2 format
 *
 * @example
 * if (!isValidTokenFormat(token)) {
 *   return response.status(400).json({ error: 'Invalid token format' })
 * }
 */
const isValidTokenFormat = (token) => {
  if (!token || typeof token !== "string") {
    return false;
  }

  return isCuid(token);
};

/**
 * Compares a plain token with a hashed token using timing-safe comparison
 * Prevents timing attacks during token verification
 *
 * @param {string} plainToken - Token from magic link
 * @param {string} hashedToken - Hashed token from database
 * @returns {boolean} True if tokens match
 *
 * @example
 * const isValid = verifyToken(tokenFromUrl, hashedTokenFromDb)
 * if (isValid && !tokenRecord.used && Date.now() < tokenRecord.expiresAt) {
 *   // Token is valid, mark as used
 * }
 */
const verifyToken = (plainToken, hashedToken) => {
  if (
    !plainToken ||
    !hashedToken ||
    typeof plainToken !== "string" ||
    typeof hashedToken !== "string"
  ) {
    return false;
  }

  // Validate token format first (fast check)
  if (!isValidTokenFormat(plainToken)) {
    return false;
  }

  const plainHash = hashToken(plainToken);
  const plainBuffer = Buffer.from(plainHash);
  const hashedBuffer = Buffer.from(hashedToken);

  // Lengths must match for timingSafeEqual
  if (plainBuffer.length !== hashedBuffer.length) {
    return false;
  }

  try {
    return timingSafeEqual(plainBuffer, hashedBuffer);
  } catch {
    return false;
  }
};

/**
 * Creates a magic link URL with the provided token
 *
 * @param {Object} options
 * @param {string} options.baseUrl - Base URL of the application
 * @param {string} options.token - Secure token to include in URL (plain text)
 * @param {string} [options.path='/auth/verify'] - Path for verification endpoint
 * @returns {string} Complete magic link URL
 *
 * @example
 * const token = generateSecureToken()
 * const hashedToken = hashToken(token)
 * // Store hashedToken in database with expiresAt = Date.now() + 3600000 (1 hour)
 *
 * const url = createMagicLinkUrl({
 *   baseUrl: 'https://example.com',
 *   token // Send plain token in email
 * })
 * // => "https://example.com/auth/verify?token=abc123..."
 *
 * @example
 * const url = createMagicLinkUrl({
 *   baseUrl: 'https://example.com',
 *   token: 'abc123...',
 *   path: '/verify-email'
 * })
 * // => "https://example.com/verify-email?token=abc123..."
 */
const createMagicLinkUrl = ({ baseUrl, token, path = "/auth/verify" } = {}) => {
  if (!baseUrl || typeof baseUrl !== "string") {
    throw new Error("baseUrl is required and must be a string");
  }

  if (!token || typeof token !== "string") {
    throw new Error("token is required and must be a string");
  }

  // Remove trailing slash from baseUrl if present
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");

  // Ensure path starts with /
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${cleanBaseUrl}${cleanPath}?token=${encodeURIComponent(token)}`;
};

export {
  generateSecureToken,
  hashToken,
  isValidTokenFormat,
  verifyToken,
  createMagicLinkUrl,
};
