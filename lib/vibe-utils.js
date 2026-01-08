/**
 * vibe-utils.js
 *
 * Shared utility functions for vibe modules.
 * Centralizes common operations like HTTP requests, URL handling,
 * logging, and security validation.
 *
 * @module vibe-utils
 */

import { errorCauses, createError } from "error-causes";

// =============================================================================
// Error Definitions
// =============================================================================

const [networkErrors] = errorCauses({
  FetchError: {
    code: "FETCH_FAILED",
    message: "Fetch operation failed",
  },
  FetchTimeout: {
    code: "FETCH_TIMEOUT",
    message: "Request timed out",
  },
  FetchRetryExhausted: {
    code: "FETCH_RETRY_EXHAUSTED",
    message: "All retry attempts failed",
  },
  TestOnlyOriginsNotAllowed: {
    code: "TEST_ONLY_ORIGINS_NOT_ALLOWED",
    message: "Test-only origins are not allowed in production",
  },
  FetchJsonParseError: {
    code: "FETCH_JSON_PARSE_ERROR",
    message: "Failed to parse JSON response",
  },
  FetchJsonHttpError: {
    code: "FETCH_JSON_HTTP_ERROR",
    message: "HTTP error response",
  },
  FetchJsonEmptyResponse: {
    code: "FETCH_JSON_EMPTY_RESPONSE",
    message: "Empty response body",
  },
});

const {
  FetchError,
  FetchTimeout,
  FetchRetryExhausted,
  TestOnlyOriginsNotAllowed,
  FetchJsonParseError,
  FetchJsonHttpError,
  FetchJsonEmptyResponse,
} = networkErrors;

// =============================================================================
// Network Resilience Constants
// =============================================================================

/**
 * Default timeout for fetch requests in milliseconds.
 * 30 seconds is generous but prevents indefinite hangs.
 */
const defaultTimeoutMs = 30000;

/**
 * Default maximum retry attempts for transient failures.
 */
const defaultMaxRetries = 3;

/**
 * Default base delay for exponential backoff in milliseconds.
 */
const defaultBaseDelayMs = 1000;

/**
 * HTTP status codes that indicate transient server errors worth retrying.
 */
const retryableStatusCodes = [429, 502, 503, 504];

/**
 * Network error codes that indicate transient failures worth retrying.
 */
const retryableErrorCodes = [
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ENOTFOUND",
  "FETCH_TIMEOUT",
];

// =============================================================================
// URL Allowlist Configuration
// =============================================================================

/**
 * Allowed API base URLs for Vibecodr operations.
 * This prevents token theft via malicious apiBase values.
 *
 * SECURITY: Only send tokens to these trusted origins.
 */
const allowedApiOrigins = [
  "https://api.vibecodr.space",
  "https://api.staging.vibecodr.space",
  "http://localhost:8787", // Local development
  "http://127.0.0.1:8787", // Local development
];

/**
 * Allowed player base URLs for building vibe URLs.
 */
const allowedPlayerOrigins = [
  "https://vibecodr.space",
  "https://staging.vibecodr.space",
  "http://localhost:3000", // Local development
  "http://127.0.0.1:3000", // Local development
];

// =============================================================================
// URL Utilities
// =============================================================================

/**
 * Normalize origin URL by removing trailing slashes.
 *
 * @param {string} origin - URL origin to normalize
 * @returns {string} Normalized origin without trailing slashes
 *
 * @example
 * normalizeOrigin("https://api.vibecodr.space///") // "https://api.vibecodr.space"
 */
export const normalizeOrigin = (origin) => {
  if (!origin || typeof origin !== "string") {
    return "";
  }
  return origin.replace(/\/+$/, "");
};

/**
 * Extract origin from a URL string with security validation.
 *
 * SECURITY: Rejects URLs with embedded credentials (username/password)
 * to prevent origin confusion attacks like:
 *   https://api.vibecodr.space@evil.com
 * where the actual host is evil.com, not api.vibecodr.space.
 *
 * Also rejects backslashes which can cause parsing inconsistencies.
 *
 * @param {string} urlString - Full URL string
 * @returns {{origin: string|null, error?: string}} Origin or error
 */
const extractOrigin = (urlString) => {
  try {
    // SECURITY: Reject URLs containing backslashes (parsing inconsistencies)
    if (urlString.includes("\\")) {
      return { origin: null, error: "URL contains backslash" };
    }

    const url = new URL(urlString);

    // SECURITY: Reject URLs with embedded credentials
    // These can be used for origin confusion attacks
    if (url.username || url.password) {
      return {
        origin: null,
        error: "URL contains embedded credentials (username/password)",
      };
    }

    return { origin: url.origin };
  } catch {
    return { origin: null, error: "Invalid URL format" };
  }
};

/**
 * Validate that apiBase URL is in the allowlist.
 * Prevents token theft via malicious apiBase values.
 *
 * SECURITY: Always call this before sending tokens to any URL.
 *
 * @param {string} apiBase - API base URL to validate
 * @param {Object} [options] - Validation options
 * @param {string[]} [options._testOnlyOrigins] - Extra allowed origins (for unit tests ONLY)
 * @returns {{valid: boolean, reason?: string, origin?: string}}
 *
 * @example
 * validateApiBase("https://api.vibecodr.space") // { valid: true, origin: "https://api.vibecodr.space" }
 * validateApiBase("https://evil.com") // { valid: false, reason: "..." }
 */
export const validateApiBase = (apiBase, { _testOnlyOrigins = [] } = {}) => {
  // SECURITY: _testOnlyOrigins is for unit tests only
  // In production builds, this should never have values
  if (_testOnlyOrigins.length > 0 && process.env.NODE_ENV === "production") {
    throw createError({
      ...TestOnlyOriginsNotAllowed,
      message: "_testOnlyOrigins cannot be used in production",
    });
  }

  if (!apiBase || typeof apiBase !== "string") {
    return { valid: false, reason: "apiBase must be a non-empty string" };
  }

  const normalized = normalizeOrigin(apiBase);
  const { origin, error } = extractOrigin(normalized);

  if (!origin) {
    const reason =
      typeof error === "string" && error.length > 0
        ? error
        : `Invalid URL: ${apiBase}`;
    return { valid: false, reason };
  }

  const allAllowed = [...allowedApiOrigins, ..._testOnlyOrigins];

  if (!allAllowed.includes(origin)) {
    return {
      valid: false,
      reason:
        `API origin "${origin}" is not in the allowed list. ` +
        `Allowed: ${allowedApiOrigins.join(", ")}`,
      origin,
    };
  }

  return { valid: true, origin };
};

/**
 * Validate that playerBase URL is in the allowlist.
 *
 * @param {string} playerBase - Player base URL to validate
 * @param {Object} [options] - Validation options
 * @param {string[]} [options._testOnlyOrigins] - Extra allowed origins (for unit tests ONLY)
 * @returns {{valid: boolean, reason?: string, origin?: string}}
 */
export const validatePlayerBase = (
  playerBase,
  { _testOnlyOrigins = [] } = {},
) => {
  // SECURITY: _testOnlyOrigins is for unit tests only
  // In production builds, this should never have values
  if (_testOnlyOrigins.length > 0 && process.env.NODE_ENV === "production") {
    throw createError({
      ...TestOnlyOriginsNotAllowed,
      message: "_testOnlyOrigins cannot be used in production",
    });
  }

  if (!playerBase || typeof playerBase !== "string") {
    return { valid: false, reason: "playerBase must be a non-empty string" };
  }

  const normalized = normalizeOrigin(playerBase);
  const { origin, error } = extractOrigin(normalized);

  if (!origin) {
    const reason =
      typeof error === "string" && error.length > 0
        ? error
        : `Invalid URL: ${playerBase}`;
    return { valid: false, reason };
  }

  const allAllowed = [...allowedPlayerOrigins, ..._testOnlyOrigins];

  if (!allAllowed.includes(origin)) {
    return {
      valid: false,
      reason:
        `Player origin "${origin}" is not in the allowed list. ` +
        `Allowed: ${allowedPlayerOrigins.join(", ")}`,
      origin,
    };
  }

  return { valid: true, origin };
};

// =============================================================================
// Logging Utilities
// =============================================================================

/**
 * Create a verbose logger for a specific module.
 * Logs to stderr to avoid polluting stdout.
 *
 * @param {string} moduleName - Name of the module for log prefix
 * @returns {Function} Logger function that respects verbose flag
 *
 * @example
 * const log = createVerboseLogger("vibe-auth");
 * log("Checking credentials...", true); // outputs: [vibe-auth] Checking credentials...
 * log("Secret stuff", false); // no output
 */
export const createVerboseLogger = (moduleName) => {
  return (message, verbose) => {
    if (verbose) {
      process.stderr.write(`[${moduleName}] ${message}\n`);
    }
  };
};

/**
 * Simple verbose log function for backward compatibility.
 * Prefer createVerboseLogger for new code.
 *
 * @param {string} prefix - Log prefix (module name)
 * @param {string} message - Message to log
 * @param {boolean} verbose - Whether to actually log
 */
export const verboseLog = (prefix, message, verbose) => {
  if (verbose) {
    process.stderr.write(`[${prefix}] ${message}\n`);
  }
};

// =============================================================================
// HTTP Utilities
// =============================================================================

/**
 * Fetch with timeout support using AbortController.
 * Prevents fetch() from hanging indefinitely when server doesn't respond.
 *
 * SECURITY: Properly combines timeout signal with caller-provided signals
 * using AbortSignal.any(). This ensures external cancellation (e.g., user
 * aborting an in-flight request) is respected alongside the timeout.
 *
 * @param {string} url - URL to fetch from
 * @param {RequestInit} [init] - Fetch options (signal will be merged, not overwritten)
 * @param {number} [timeoutMs=30000] - Timeout in milliseconds
 * @returns {Promise<Response>} Fetch Response object
 * @throws {Error} FETCH_TIMEOUT if request exceeds timeout
 * @throws {Error} AbortError if caller's signal triggered abort (rethrown as-is)
 *
 * @example
 * try {
 *   const response = await fetchWithTimeout("https://api.example.com/slow", {}, 5000);
 * } catch (err) {
 *   if (err.code === 'FETCH_TIMEOUT') {
 *     console.log('Request timed out');
 *   }
 * }
 *
 * @example
 * // With external abort signal
 * const controller = new AbortController();
 * setTimeout(() => controller.abort(), 1000); // User cancels after 1s
 * try {
 *   await fetchWithTimeout("https://api.example.com/slow", { signal: controller.signal }, 30000);
 * } catch (err) {
 *   if (err.name === 'AbortError') {
 *     console.log('Request was cancelled by user');
 *   }
 * }
 */
export const fetchWithTimeout = async (
  url,
  init = {},
  timeoutMs = defaultTimeoutMs,
) => {
  // Create timeout-specific controller to track if timeout triggered the abort
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  // Combine timeout signal with any caller-provided signal
  // This ensures external cancellation is respected alongside timeout
  const signals = [timeoutController.signal];
  if (init.signal) {
    signals.push(init.signal);
  }
  const combinedSignal = AbortSignal.any(signals);

  try {
    // Check if external signal is already aborted before starting fetch
    if (init.signal?.aborted) {
      throw init.signal.reason ?? new DOMException("Aborted", "AbortError");
    }

    const response = await fetch(url, {
      ...init,
      signal: combinedSignal,
    });
    return response;
  } catch (err) {
    // AbortError is thrown when any signal aborts
    if (err.name === "AbortError") {
      // Check if OUR timeout triggered the abort
      if (timeoutController.signal.aborted) {
        throw createError({
          ...FetchTimeout,
          message: `Request timed out after ${timeoutMs}ms`,
          url,
          timeoutMs,
        });
      }
      // External signal triggered abort - rethrow as-is for caller to handle
      // This preserves the original abort reason and allows proper cancellation flow
      throw err;
    }
    const originalCode = err && typeof err.code === "string" ? err.code : null;
    const retryable =
      !!originalCode &&
      Array.isArray(retryableErrorCodes) &&
      retryableErrorCodes.includes(originalCode);

    throw createError({
      ...FetchError,
      message: `Fetch failed for ${url}: ${err.message}`,
      cause: err,
      url,
      originalCode,
      retryable,
    });
  } finally {
    // Always clean up the timeout to prevent memory leaks
    clearTimeout(timeoutId);
  }
};

/**
 * Collect error codes (and original error codes) from an error cause chain.
 * @param {Error|null} err - Error object
 * @returns {string[]} Codes found (outer-to-inner)
 */
const getErrorCodes = (err) => {
  const collect = (current) => {
    if (!current) {
      return [];
    }

    const ownCodes = [
      ...(typeof current.originalCode === "string"
        ? [current.originalCode]
        : []),
      ...(typeof current.code === "string" ? [current.code] : []),
    ];

    return [...ownCodes, ...collect(current.cause)];
  };

  return collect(err);
};

/**
 * Check if an error or HTTP status is retryable.
 *
 * @param {Error|null} err - Error object (may be null)
 * @param {Response|null} response - Fetch Response (may be null)
 * @returns {boolean} Whether the request should be retried
 */
const isRetryable = (err, response) => {
  // Check for retryable error codes (network-level failures)
  if (err) {
    const codes = getErrorCodes(err);
    if (codes.some((code) => retryableErrorCodes.includes(code))) {
      return true;
    }
  }

  // Check for retryable HTTP status codes (server-level failures)
  if (response && retryableStatusCodes.includes(response.status)) {
    return true;
  }

  return false;
};

/**
 * Parse Retry-After header value to milliseconds.
 * Handles both delta-seconds format (e.g., "120") and HTTP-date format.
 *
 * @param {string|null} retryAfter - Retry-After header value
 * @param {number} defaultMs - Default delay if header is missing/invalid
 * @returns {number} Delay in milliseconds
 */
const parseRetryAfter = (retryAfter, defaultMs) => {
  if (!retryAfter) {
    return defaultMs;
  }

  // Try parsing as number (delta-seconds)
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds) && seconds >= 0) {
    // Cap at 5 minutes to prevent excessively long waits
    return Math.min(seconds * 1000, 300000);
  }

  // Try parsing as HTTP-date (e.g., "Wed, 21 Oct 2015 07:28:00 GMT")
  const date = Date.parse(retryAfter);
  if (!isNaN(date)) {
    const delayMs = date - Date.now();
    // If date is in the past or too far in the future, use default
    if (delayMs > 0 && delayMs < 300000) {
      return delayMs;
    }
  }

  return defaultMs;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getExponentialBackoffMs = ({ baseDelayMs, attempt }) =>
  baseDelayMs * 2 ** (attempt - 1);

/**
 * Fetch with retry logic for transient failures.
 * Handles 502, 503, 504, 429 (rate limit), and network errors with exponential backoff.
 *
 * @param {string} url - URL to fetch from
 * @param {RequestInit} [init] - Fetch options
 * @param {Object} [options] - Retry options
 * @param {number} [options.maxRetries=3] - Maximum retry attempts
 * @param {number} [options.baseDelayMs=1000] - Base delay for exponential backoff
 * @param {number} [options.timeoutMs=30000] - Timeout per request in milliseconds
 * @param {boolean} [options.verbose=false] - Enable verbose logging
 * @returns {Promise<Response>} Fetch Response object
 * @throws {Error} FETCH_RETRY_EXHAUSTED if all retries fail
 *
 * @example
 * try {
 *   const response = await fetchWithRetry("https://api.example.com/data", {
 *     method: "POST",
 *     body: JSON.stringify({ data: "value" })
 *   }, { maxRetries: 5, verbose: true });
 * } catch (err) {
 *   if (err.code === 'FETCH_RETRY_EXHAUSTED') {
 *     console.log('All retry attempts failed');
 *   }
 * }
 */
export const fetchWithRetry = async (url, init = {}, options = {}) => {
  const {
    maxRetries = defaultMaxRetries,
    baseDelayMs = defaultBaseDelayMs,
    timeoutMs = defaultTimeoutMs,
    verbose = false,
  } = options;

  const throwRetryExhausted = ({ lastError, lastResponse }) => {
    throw createError({
      ...FetchRetryExhausted,
      message: `All ${maxRetries} retry attempts failed for ${url}`,
      url,
      attempts: maxRetries,
      lastStatus: lastResponse?.status,
      cause: lastError,
    });
  };

  const attemptFetch = async ({ attempt, lastError, lastResponse }) => {
    try {
      const response = await fetchWithTimeout(url, init, timeoutMs);

      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get("Retry-After");
        const delayMs = parseRetryAfter(
          retryAfterHeader,
          getExponentialBackoffMs({ baseDelayMs, attempt }),
        );

        if (verbose) {
          verboseLog(
            "vibe-utils",
            `Rate limited (429). Retry-After: ${retryAfterHeader ?? "not set"}. ` +
              `Waiting ${delayMs}ms before retry ${attempt}/${maxRetries}`,
            true,
          );
        }

        if (attempt < maxRetries) {
          await sleep(delayMs);
          return attemptFetch({
            attempt: attempt + 1,
            lastError,
            lastResponse: response,
          });
        }

        return throwRetryExhausted({ lastError, lastResponse: response });
      }

      // Handle retryable server errors (502, 503, 504)
      if (isRetryable(null, response)) {
        if (verbose) {
          verboseLog(
            "vibe-utils",
            `Server error (${response.status}). Retry ${attempt}/${maxRetries}`,
            true,
          );
        }

        if (attempt < maxRetries) {
          const delayMs = getExponentialBackoffMs({ baseDelayMs, attempt });
          await sleep(delayMs);
          return attemptFetch({
            attempt: attempt + 1,
            lastError,
            lastResponse: response,
          });
        }

        return throwRetryExhausted({ lastError, lastResponse: response });
      }

      // Success or non-retryable HTTP status - return as-is
      return response;
    } catch (err) {
      if (isRetryable(err, null)) {
        if (verbose) {
          const codes = getErrorCodes(err);
          verboseLog(
            "vibe-utils",
            `Network error (${codes[0] ?? err.name}). Retry ${attempt}/${maxRetries}`,
            true,
          );
        }

        if (attempt < maxRetries) {
          const delayMs = getExponentialBackoffMs({ baseDelayMs, attempt });
          await sleep(delayMs);
          return attemptFetch({
            attempt: attempt + 1,
            lastError: err,
            lastResponse,
          });
        }

        return throwRetryExhausted({ lastError: err, lastResponse });
      }

      // Non-retryable error - throw immediately
      throw err;
    }
  };

  return attemptFetch({ attempt: 1, lastError: null, lastResponse: null });
};

/**
 * Fetch JSON from URL with enhanced error handling, timeout, and retry support.
 * Provides consistent error structure across all vibe modules.
 *
 * RESILIENCE FEATURES:
 * - Configurable timeout to prevent indefinite hangs (default: 30s)
 * - Automatic retry with exponential backoff for transient failures
 * - Rate limit handling with Retry-After header support
 *
 * @param {string} url - URL to fetch from
 * @param {RequestInit} [init] - Fetch options
 * @param {Object} [options] - Network resilience options
 * @param {number} [options.timeoutMs=30000] - Timeout in milliseconds
 * @param {number} [options.maxRetries=3] - Maximum retry attempts (set to 1 to disable retry)
 * @param {number} [options.baseDelayMs=1000] - Base delay for exponential backoff
 * @param {boolean} [options.verbose=false] - Enable verbose logging for retries
 * @returns {Promise<object|null>} Parsed JSON response
 * @throws {Error} Enhanced error with status, body, and url properties
 * @throws {Error} FETCH_TIMEOUT if request times out
 * @throws {Error} FETCH_RETRY_EXHAUSTED if all retries fail
 *
 * @example
 * try {
 *   const data = await fetchJson("https://api.example.com/data", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ foo: "bar" })
 *   }, { timeoutMs: 10000, maxRetries: 5, verbose: true });
 * } catch (err) {
 *   console.error(err.status, err.body);
 * }
 */
export const fetchJson = async (url, init, options = {}) => {
  const {
    timeoutMs = defaultTimeoutMs,
    maxRetries = defaultMaxRetries,
    baseDelayMs = defaultBaseDelayMs,
    verbose = false,
  } = options;

  // Use retry wrapper which internally uses timeout wrapper
  const res = await fetchWithRetry(url, init, {
    timeoutMs,
    maxRetries,
    baseDelayMs,
    verbose,
  });

  const text = await res.text();

  const parseJsonText = () => {
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      const err = createError({
        ...FetchJsonParseError,
        message: `Expected JSON from ${url} (status=${res.status})`,
        status: res.status,
        url,
      });
      // Preserve commonly-consumed error properties for callers/tests
      err.status = res.status;
      err.url = url;
      err.responseText = text;
      throw err;
    }
  };

  const json = parseJsonText();

  if (!res.ok) {
    const err = createError({
      ...FetchJsonHttpError,
      message: `HTTP ${res.status} from ${url}`,
      status: res.status,
      url,
      body: json,
    });
    // Preserve commonly-consumed error properties for callers/tests
    err.status = res.status;
    err.url = url;
    err.body = json;
    throw err;
  }

  // Handle empty response body - throw explicit error rather than returning null
  // to prevent null dereference when caller accesses properties like .success
  if (json === null) {
    const err = createError({
      ...FetchJsonEmptyResponse,
      message: `Empty response body from ${url} (status=${res.status})`,
      status: res.status,
      url,
    });
    // Backward-compatible code used by tests/callers
    err.code = "EMPTY_RESPONSE";
    err.status = res.status;
    err.url = url;
    throw err;
  }

  return json;
};

// =============================================================================
// Auth Error Detection
// =============================================================================

/**
 * Check if an error indicates the token needs refreshing.
 * Used for auth retry logic across modules.
 *
 * @param {Error} err - Error to check
 * @returns {boolean} Whether error suggests auth retry is needed
 *
 * @example
 * try {
 *   await apiCall();
 * } catch (err) {
 *   if (isAuthError(err)) {
 *     await refreshToken();
 *     await apiCall(); // retry
 *   }
 * }
 */
export const isAuthError = (err) => {
  if (!err) return false;

  // Direct 401 means auth failed
  if (err.status === 401) return true;

  // Check error body for expiration hints from the API
  const body = err.body ?? err.cause;
  if (body && typeof body === "object") {
    const hint =
      typeof body.hint === "string" && body.hint.length > 0
        ? body.hint
        : typeof body.message === "string"
          ? body.message
          : "";
    if (
      typeof hint === "string" &&
      hint.toLowerCase().includes("expiring soon")
    ) {
      return true;
    }
    const code =
      typeof body.errorCode === "string" && body.errorCode.length > 0
        ? body.errorCode
        : typeof body.code === "string" && body.code.length > 0
          ? body.code
          : typeof body.error === "string"
            ? body.error
            : undefined;
    if (typeof code === "string" && code.includes("auth.")) {
      return true;
    }
  }

  return false;
};

/**
 * Check if error indicates token problem (for Clerk token refresh).
 * Alias for isAuthError with same semantics.
 *
 * @param {Error} err - Error to check
 * @returns {boolean} Whether error suggests Clerk token refresh is needed
 */
export const isLikelyClerkTokenProblem = isAuthError;

// =============================================================================
// Path Safety Validation
// =============================================================================

/**
 * Unicode characters that can normalize to ASCII dots.
 * Used to detect Unicode-based path traversal bypass attempts.
 *
 * SECURITY: Attackers may use these lookalike characters to bypass
 * simple ".." checks. For example:
 *   - \u2024 (ONE DOT LEADER) looks like "."
 *   - \uFF0E (FULLWIDTH FULL STOP) looks like "."
 *   - \u0307 (COMBINING DOT ABOVE) combined with chars
 *
 * We detect these by normalizing to NFKD and checking for resulting dots,
 * and also explicitly checking for known lookalike codepoints.
 */
const unicodeDotLookalikes = [
  "\u2024", // ONE DOT LEADER
  "\uFF0E", // FULLWIDTH FULL STOP
  "\u0701", // SYRIAC SUPRALINEAR FULL STOP
  "\u0702", // SYRIAC SUBLINEAR FULL STOP
  "\uFE52", // SMALL FULL STOP
  "\u2E3C", // STENOGRAPHIC FULL STOP
];

/**
 * Normalize a path for security comparison.
 * Applies Unicode NFKD normalization to detect bypass attempts.
 *
 * @param {string} path - Path to normalize
 * @returns {string} Normalized path
 */
const normalizePathForSecurity = (path) => {
  // Apply NFKD normalization which converts lookalike chars to their base form
  // For example, \uFF0E (FULLWIDTH FULL STOP) becomes "."
  return path.normalize("NFKD");
};

/**
 * Check if a file path is safe (no path traversal attempts).
 * Rejects paths that try to escape the working directory.
 *
 * SECURITY: Always validate user-provided paths before file operations.
 * Handles Unicode normalization attacks by checking both original
 * and NFKD-normalized paths for traversal patterns.
 *
 * @param {string} filePath - File path to validate
 * @returns {{safe: boolean, reason?: string}} Validation result
 *
 * @example
 * isPathSafe("src/App.tsx") // { safe: true }
 * isPathSafe("../../../etc/passwd") // { safe: false, reason: "..." }
 * isPathSafe("src/\uFF0E\uFF0E/etc/passwd") // { safe: false } - Unicode bypass attempt
 */
export const isPathSafe = (filePath) => {
  if (!filePath || typeof filePath !== "string") {
    return { safe: false, reason: "Path must be a non-empty string" };
  }

  // SECURITY: Check for Unicode dot lookalikes BEFORE normalization
  // These are explicit bypass attempts
  const hasDotLookalikes = unicodeDotLookalikes.some((lookalike) =>
    filePath.includes(lookalike),
  );
  if (hasDotLookalikes) {
    return {
      safe: false,
      reason: "Path contains Unicode lookalike characters",
    };
  }

  // SECURITY: Normalize Unicode before checking for traversal patterns
  // This catches bypass attempts using characters that normalize to ".."
  const normalizedPath = normalizePathForSecurity(filePath);

  // Reject absolute paths (check both original and normalized)
  // SECURITY: Includes UNC paths (\\server\share) which are absolute on Windows
  if (
    filePath.startsWith("/") ||
    normalizedPath.startsWith("/") ||
    /^[A-Za-z]:/.test(filePath) ||
    /^[A-Za-z]:/.test(normalizedPath) ||
    filePath.startsWith("\\\\") ||
    normalizedPath.startsWith("\\\\")
  ) {
    return { safe: false, reason: "Absolute paths are not allowed" };
  }

  // Reject path traversal sequences in normalized path
  const pathParts = normalizedPath.split(/[/\\]/);
  const hasTraversal = pathParts.some((part) => part === "..");
  if (hasTraversal) {
    return { safe: false, reason: "Path traversal (..) is not allowed" };
  }
  const hasNullBytes = pathParts.some((part) => part.includes("\0"));
  if (hasNullBytes) {
    return { safe: false, reason: "Null bytes in path are not allowed" };
  }

  // Reject paths starting with .. (normalized)
  if (normalizedPath.startsWith("..")) {
    return { safe: false, reason: "Path cannot start with .." };
  }

  // Reject dangerous patterns in BOTH original and normalized paths
  const dangerousPatterns = [
    /\.\./, // Any double dots
    /%2e%2e/i, // URL-encoded ..
    /%252e/i, // Double URL-encoded .
  ];

  const hasDangerousPatterns = dangerousPatterns.some(
    (pattern) => pattern.test(filePath) || pattern.test(normalizedPath),
  );
  if (hasDangerousPatterns) {
    return { safe: false, reason: "Path contains forbidden pattern" };
  }

  // SECURITY: Final check - if normalized path differs significantly from original,
  // and normalized version contains dots where original didn't, reject it
  const originalDotCount = (filePath.match(/\./g) ?? []).length;
  const normalizedDotCount = (normalizedPath.match(/\./g) ?? []).length;
  if (normalizedDotCount > originalDotCount) {
    return {
      safe: false,
      reason: "Path contains characters that normalize to dots",
    };
  }

  return { safe: true };
};

// =============================================================================
// Config Utilities
// =============================================================================

/**
 * Deep clone an object to avoid mutation.
 * Simple implementation for config objects (no circular refs, no functions).
 *
 * @param {object} obj - Object to clone
 * @returns {object} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Merge objects immutably (shallow merge with spread pattern).
 *
 * @param {object} target - Base object
 * @param {object} source - Object to merge in
 * @returns {object} New merged object
 */
export const mergeConfig = (target, source) => ({
  ...target,
  ...source,
});

// =============================================================================
// Exports - Constants for Testing
// =============================================================================

export const allowedOrigins = {
  api: allowedApiOrigins,
  player: allowedPlayerOrigins,
};
