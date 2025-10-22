/**
 * Token utilities for Email Authentication
 * Provides cryptographically secure token generation and magic link URL creation
 *
 * Security Specifications:
 * - Uses CSPRNG (crypto.randomBytes) for unpredictable token generation
 * - 256 bits of entropy (32 bytes = 64 hex characters)
 * - Tokens should be hashed before storage (like passwords)
 * - Tokens should be single-use (marked as used after verification)
 * - Recommended expiry: 1 hour (balances security with email delivery delays)
 *
 * Storage Pattern:
 * Store in database: { hashedToken, email, expiresAt, used: false }
 * Use SHA-256 or better for hashing tokens
 *
 * Security References:
 * - OWASP Authentication Cheat Sheet
 * - Security Stack Exchange consensus: Random tokens > JWT for magic links
 * - NIST: Minimum 112 bits entropy, recommend 256 bits
 */

import { randomBytes, createHash, timingSafeEqual } from "crypto";

/**
 * Generates a cryptographically secure random token
 * Uses Node.js crypto.randomBytes (CSPRNG) for maximum security
 *
 * @returns {string} 64-character hexadecimal token (256 bits of entropy)
 *
 * @example
 * const token = generateSecureToken()
 * // => "a1b2c3d4e5f6..." (64 characters)
 *
 * Security Note:
 * Hash this token before storing in database using hashToken()
 */
const generateSecureToken = () => randomBytes(32).toString("hex");

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

export { generateSecureToken, hashToken, verifyToken, createMagicLinkUrl };
