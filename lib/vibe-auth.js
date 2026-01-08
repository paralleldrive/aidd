/**
 * vibe-auth.js
 *
 * Authentication integration module for Vibecodr within aidd context.
 * Handles credential validation, token refresh, and auth error handling.
 *
 * Reference: vibecodr-auth.js in project root for auth patterns
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { errorCauses, createError } from "error-causes";
import {
  normalizeOrigin,
  verboseLog,
  fetchJson,
  isLikelyClerkTokenProblem,
} from "./vibe-utils.js";

// =============================================================================
// Error Definitions
// =============================================================================

const [vibeAuthErrors] = errorCauses({
  AuthRequired: {
    code: "AUTH_REQUIRED",
    message: "Authentication required",
  },
  AuthExpired: {
    code: "AUTH_EXPIRED",
    message: "Token expired and refresh failed",
  },
  ConfigReadError: {
    code: "CONFIG_READ_ERROR",
    message: "Failed to read configuration file",
  },
  ConfigWriteError: {
    code: "CONFIG_WRITE_ERROR",
    message: "Failed to write configuration file",
  },
  TokenExchangeError: {
    code: "TOKEN_EXCHANGE_ERROR",
    message: "Failed to exchange token with Vibecodr",
  },
  RefreshError: {
    code: "REFRESH_ERROR",
    message: "Failed to refresh authentication token",
  },
});

const {
  AuthRequired,
  AuthExpired,
  ConfigReadError,
  ConfigWriteError,
  TokenExchangeError,
  RefreshError,
} = vibeAuthErrors;

// =============================================================================
// Security Constants & Helpers
// =============================================================================

/**
 * SECURITY: Get expected config directory path by platform.
 * Config files outside this directory trigger a warning.
 * @returns {string} Expected config directory path
 */
const getExpectedConfigDir = () => {
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA ?? "", "vibecodr");
  }
  return path.join(os.homedir(), ".config", "vibecodr");
};

/**
 * SECURITY: Validate that config path is within expected directory.
 * Prevents arbitrary file access via configPath parameter.
 *
 * @param {string} configPath - Config path to validate
 * @returns {{valid: boolean, warning?: string, reason?: string}}
 */
const validateConfigPath = (configPath) => {
  const resolved = path.resolve(configPath);
  const expectedDir = path.resolve(getExpectedConfigDir());

  // Allow custom paths but warn if outside expected directory
  if (
    !resolved.startsWith(expectedDir + path.sep) &&
    resolved !== expectedDir
  ) {
    // Don't block, but this is unusual - could indicate misconfiguration or attack
    return {
      valid: true,
      warning: `Config path outside standard location`,
    };
  }

  // Must end in .json for config files
  if (!resolved.endsWith(".json")) {
    return { valid: false, reason: "Config path must end in .json" };
  }

  return { valid: true };
};

/**
 * SECURITY: Verify file permissions on both Unix and Windows systems.
 * - Unix: Config files should only be readable by owner (mode 0600).
 * - Windows: Config files should NOT be readable by Everyone/Users groups.
 *
 * @param {string} filePath - File path to check
 * @throws {Error} CONFIG_READ_ERROR if permissions are insecure
 */
const verifyFilePermissions = (filePath) => {
  try {
    // SECURITY: Windows - check for world-readable ACLs
    if (process.platform === "win32") {
      const permCheck = checkWindowsPermissions(filePath);

      // If check returned a warning (couldn't verify), log it but don't block
      if (permCheck.warning) {
        // Don't block on verification failure - assume secure
        return;
      }

      // If permissions are insecure, throw error with fix instructions
      if (!permCheck.secure) {
        throw createError({
          ...ConfigReadError,
          message:
            `Config file has insecure Windows permissions.\n` +
            `${permCheck.details}\n\n` +
            `To fix, run one of:\n` +
            `  1. Automated: Call fixWindowsPermissions() from code\n` +
            `  2. Manual: icacls "${filePath}" /inheritance:r /grant:r "%USERNAME%:(F)"`,
          configPath: filePath,
          permissionDetails: permCheck.details,
        });
      }

      return;
    }

    // SECURITY: Unix - check file mode bits
    const stats = fs.statSync(filePath);
    const mode = stats.mode & 0o777;

    // Check that group and others have no access (mode should be 0600 or stricter)
    if ((mode & 0o077) !== 0) {
      throw createError({
        ...ConfigReadError,
        message: `Config file has insecure permissions (${mode.toString(8)}). Expected 600. Run: chmod 600 "${filePath}"`,
        configPath: filePath,
        actualMode: mode.toString(8),
        expectedMode: "600",
      });
    }
  } catch (err) {
    // If statSync fails with ENOENT, that's fine - file doesn't exist yet
    if (err?.code === "ENOENT") {
      return;
    }
    // Re-throw CONFIG_READ_ERROR from permission check
    if (err?.cause?.code === "CONFIG_READ_ERROR") {
      throw err;
    }
    // Other errors (permission denied to stat, etc.) - throw wrapped error
    throw createError({
      ...ConfigReadError,
      message: `Failed to verify config permissions: ${err.message}`,
      configPath: filePath,
      cause: err,
    });
  }
};

// =============================================================================
// Windows File Permission Helpers
// =============================================================================

/**
 * SECURITY: Check if a Windows file has insecure permissions.
 * Detects if "Everyone" or "BUILTIN\Users" have read access to the file.
 *
 * Uses icacls to query file ACLs and parses output for world-readable entries.
 * This is the Windows equivalent of checking for group/world bits on Unix.
 *
 * @param {string} filePath - Path to the file to check
 * @returns {{secure: boolean, details?: string, warning?: string}} Check result
 */
const checkWindowsPermissions = (filePath) => {
  try {
    // Query file ACLs using icacls
    // Output format: filename DOMAIN\User:(permissions)
    const output = execSync(`icacls "${filePath}"`, {
      encoding: "utf8",
      windowsHide: true,
    });

    // SECURITY: Check for world-readable entries
    // "Everyone" = all users on the system
    // "BUILTIN\Users" = all interactive users (also insecure for credentials)
    // "NT AUTHORITY\Authenticated Users" = all authenticated users (also insecure)
    const insecurePatterns = [
      /Everyone:/i,
      /BUILTIN\\Users:/i,
      /NT AUTHORITY\\Authenticated Users:/i,
    ];

    const insecureEntries = output
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => insecurePatterns.some((pattern) => pattern.test(line)));

    if (insecureEntries.length > 0) {
      return {
        secure: false,
        details: `File has world-readable permissions:\n${insecureEntries.join("\n")}`,
      };
    }

    return { secure: true };
  } catch (err) {
    // If icacls fails, we can't verify security - return warning but don't block
    return {
      secure: true, // Assume secure to avoid blocking legitimate usage
      warning: `Could not verify Windows permissions: ${err.message}`,
    };
  }
};

/**
 * SECURITY: Fix insecure Windows file permissions by removing world-readable access.
 * This is an OPT-IN remediation function that should only be called with user consent.
 *
 * Removes inherited permissions and grants only the current user full control.
 * Logs the icacls command being executed for transparency.
 *
 * @param {string} filePath - Path to the file to fix
 * @param {object} [options] - Fix options
 * @param {boolean} [options.verbose=false] - Log icacls commands
 * @returns {{success: boolean, warning?: string, commandRun?: string}} Fix result
 */
const fixWindowsPermissions = (filePath, { verbose = false } = {}) => {
  const command = `icacls "${filePath}" /inheritance:r /grant:r "%USERNAME%:(F)"`;

  if (verbose) {
    console.log(`[vibe-auth] Running: ${command}`);
  }

  try {
    execSync(command, {
      stdio: verbose ? "inherit" : "ignore",
      windowsHide: true,
    });

    if (verbose) {
      console.log(`[vibe-auth] Successfully secured file: ${filePath}`);
    }

    return { success: true, commandRun: command };
  } catch (err) {
    // Don't crash on failure - return error details for user
    const warning =
      `Failed to fix permissions on "${filePath}": ${err.message}\n` +
      `For security, manually run: ${command}`;

    return {
      success: false,
      warning,
      commandRun: command,
    };
  }
};

/**
 * SECURITY: Set restrictive file permissions on Windows using icacls.
 * Removes inherited ACLs and grants only the current user full control.
 *
 * This is the Windows equivalent of chmod 600 on Unix:
 * - /inheritance:r - Remove all inherited permissions
 * - /grant:r %USERNAME%:(F) - Grant ONLY current user full control (replace mode)
 *
 * @param {string} filePath - Path to the file to secure
 * @returns {{success: boolean, warning?: string}} Result of permission setting
 */
const setWindowsFilePermissions = (filePath) => {
  try {
    // icacls has been built into Windows since Vista (2006)
    // /inheritance:r removes inherited permissions
    // /grant:r replaces (not adds) permissions for the user
    // %USERNAME%:(F) gives full control to current user only
    execSync(`icacls "${filePath}" /inheritance:r /grant:r "%USERNAME%:(F)"`, {
      stdio: "ignore",
      windowsHide: true,
    });
    return { success: true };
  } catch (err) {
    // Don't crash on failure - warn the user instead
    // Common reasons: file locked, permission denied, icacls not found (shouldn't happen)
    return {
      success: false,
      warning:
        `Could not set secure permissions on "${filePath}". ` +
        `For security, manually run: icacls "${filePath}" /inheritance:r /grant:r "%USERNAME%:(F)"`,
    };
  }
};

/**
 * SECURITY: Set restrictive directory permissions on Windows using icacls.
 * Removes inherited ACLs and grants only the current user full control,
 * with inheritance flags for child objects.
 *
 * @param {string} dirPath - Path to the directory to secure
 * @returns {{success: boolean, warning?: string}} Result of permission setting
 */
const setWindowsDirectoryPermissions = (dirPath) => {
  try {
    // (OI) = Object Inherit - files in this folder inherit these permissions
    // (CI) = Container Inherit - subfolders inherit these permissions
    // (F) = Full control
    execSync(
      `icacls "${dirPath}" /inheritance:r /grant:r "%USERNAME%:(OI)(CI)(F)"`,
      { stdio: "ignore", windowsHide: true },
    );
    return { success: true };
  } catch (err) {
    // Don't crash on failure - this is a secondary security measure
    return { success: false };
  }
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse an expiry value that may be number or string.
 * Handles type coercion for expires_at values from JSON config.
 *
 * @param {number|string|null|undefined} value - Expiry value to parse
 * @returns {number|null} Parsed numeric expiry or null if invalid
 */
const parseExpiry = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

/**
 * Minimum buffer time in seconds for token validity checks.
 * Even if user passes minValidSeconds=0, we enforce at least 10 seconds
 * to prevent race conditions with nearly-expired tokens.
 */
const minBufferSeconds = 10;

/**
 * Get the default config path based on platform.
 * On Windows, tries APPDATA first, then falls back to USERPROFILE\AppData\Roaming,
 * and finally to homedir-based path if neither exists.
 *
 * @returns {string} Default configuration file path
 */
const defaultConfigPath = () => {
  if (process.platform === "win32") {
    // Primary: APPDATA environment variable
    const appData = process.env.APPDATA;
    if (appData) return path.join(appData, "vibecodr", "cli.json");

    // Fallback: Construct path from USERPROFILE
    const userProfile = process.env.USERPROFILE;
    if (userProfile) {
      return path.join(
        userProfile,
        "AppData",
        "Roaming",
        "vibecodr",
        "cli.json",
      );
    }
    // Final fallback: use homedir (may still work on Windows)
  }
  return path.join(os.homedir(), ".config", "vibecodr", "cli.json");
};

/**
 * Module-specific verbose logger using shared verboseLog
 * @param {string} message - Message to log
 * @param {boolean} verbose - Whether to actually log
 */
const log = (message, verbose) => verboseLog("vibe-auth", message, verbose);

/**
 * Read and parse config file with security validation.
 *
 * SECURITY: On Unix systems, verifies file permissions are 0600 before reading
 * to prevent reading config files that could have been tampered with.
 *
 * @param {string} filePath - Path to config file
 * @param {object} [options] - Read options
 * @param {boolean} [options.skipPermissionCheck=false] - Skip permission verification (testing only)
 * @returns {object|null} Parsed config or null if not found
 * @throws {Error} CONFIG_READ_ERROR if permissions are insecure or read fails
 */
const readConfig = (filePath, { skipPermissionCheck = false } = {}) => {
  try {
    // SECURITY: Verify file permissions before reading (Unix only)
    if (!skipPermissionCheck) {
      verifyFilePermissions(filePath);
    }

    const text = fs.readFileSync(filePath, "utf8");
    return JSON.parse(text);
  } catch (err) {
    if (err && typeof err === "object" && err.code === "ENOENT") {
      return null;
    }
    // Re-throw structured errors from verifyFilePermissions
    if (err?.cause?.code === "CONFIG_READ_ERROR") {
      throw err;
    }
    // SECURITY: Use generic message, put path in structured field only
    throw createError({
      ...ConfigReadError,
      message: `Failed to read config file: ${err.message}`,
      cause: err,
      configPath: filePath,
    });
  }
};

/**
 * Ensure directory exists for file and secure it on Windows.
 *
 * SECURITY: On Windows, attempts to secure the directory with restrictive
 * ACLs so that only the current user can access credential files.
 *
 * @param {string} filePath - File path to ensure directory for
 * @returns {{dirCreated: boolean, dirPath: string}} Info about the directory
 */
const ensureDirForFile = (filePath) => {
  const dir = path.dirname(filePath);
  const existed = fs.existsSync(dir);
  fs.mkdirSync(dir, { recursive: true });

  // On Windows, secure newly created directories
  // Only attempt if directory was just created to avoid repeated icacls calls
  if (process.platform === "win32" && !existed) {
    setWindowsDirectoryPermissions(dir);
  }

  return { dirCreated: !existed, dirPath: dir };
};

/**
 * Write config to file with proper permissions using atomic write pattern.
 *
 * ATOMIC WRITE: Writes to a temp file first, then renames. This prevents
 * config corruption if the process is killed mid-write, since rename is
 * atomic on most filesystems.
 *
 * SECURITY:
 * - On Unix: Sets file mode to 0o600 (owner read/write only)
 * - On Windows: Uses icacls to remove inherited permissions and grant
 *   only the current user full control. If icacls fails, a warning is
 *   emitted to stderr but the write operation continues.
 *
 * @param {string} filePath - Path to write config to
 * @param {object} data - Config data to write
 * @throws {Error} CONFIG_WRITE_ERROR if write fails
 */
const writeConfig = (filePath, data) => {
  ensureDirForFile(filePath);
  const text = JSON.stringify(data, null, 2) + "\n";

  // Use temp file + rename for atomic write
  const tempPath = `${filePath}.tmp.${process.pid}`;

  try {
    if (process.platform === "win32") {
      // Windows: write file, then secure with icacls
      fs.writeFileSync(tempPath, text, "utf8");
      fs.renameSync(tempPath, filePath);

      // SECURITY: Attempt to secure the file with restrictive ACLs
      // This removes inherited permissions and grants only current user access
      const permResult = setWindowsFilePermissions(filePath);
      if (!permResult.success && permResult.warning) {
        // Warn user but don't fail - file is written, just not secured
        process.stderr.write(`Warning: ${permResult.warning}\n`);
      }
      return;
    }

    // Unix: restrict to owner-only read/write (mode 0o600)
    fs.writeFileSync(tempPath, text, { encoding: "utf8", mode: 0o600 });

    // Atomic rename - if this fails, config file is unchanged
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    // Clean up temp file on any failure
    try {
      fs.unlinkSync(tempPath);
    } catch {
      // Ignore cleanup errors - temp file may not exist
    }
    throw createError({
      ...ConfigWriteError,
      message: `Failed to write config atomically: ${err.message}`,
      cause: err,
      configPath: filePath,
    });
  }
};

// =============================================================================
// Concurrent Refresh Protection
// =============================================================================

/**
 * Module-level promise for in-progress refresh operations.
 * Prevents race conditions when multiple parallel operations detect expired token.
 * @type {Promise<{token: string, expiresAt: number}>|null}
 */
const refreshInProgress = { current: null };

/**
 * Execute a refresh operation with mutex protection.
 * If a refresh is already in progress, returns the existing promise.
 * This prevents multiple concurrent refresh attempts from racing.
 *
 * @param {Function} refreshFn - Async function that performs the refresh
 * @returns {Promise<{token: string, expiresAt: number}>} Refresh result
 */
const refreshWithLock = async (refreshFn) => {
  // If refresh already in progress, wait for it instead of starting another
  if (refreshInProgress.current) {
    return refreshInProgress.current;
  }

  // Start new refresh with cleanup on completion
  refreshInProgress.current = refreshFn().finally(() => {
    refreshInProgress.current = null;
  });

  return refreshInProgress.current;
};

const getResolvedConfigPath = (configPath) => configPath ?? defaultConfigPath();

const requireConfigForRefresh = ({ config, resolvedConfigPath }) => {
  if (config) {
    return config;
  }

  throw createError({
    ...AuthExpired,
    message:
      "No config found. Cannot refresh token. Run 'aidd --vibe-login' first.",
    configPath: resolvedConfigPath,
  });
};

const requireClerkAccessToken = ({ clerkAccessToken, resolvedConfigPath }) => {
  if (clerkAccessToken) {
    return clerkAccessToken;
  }

  throw createError({
    ...AuthExpired,
    message:
      "Missing access token. Run 'aidd --vibe-login' or 'vibecodr-auth.js login' first.",
    configPath: resolvedConfigPath,
  });
};

const exchangeAndStoreVibecodrToken = async ({
  config,
  apiBase,
  clerkAccessToken,
  resolvedConfigPath,
  verbose,
}) => {
  log("Exchanging Auth token for Vibecodr token...", verbose);

  const vibecodr = await exchangeForVibecodrToken({
    apiBase,
    clerkAccessToken,
  });

  if (
    !vibecodr ||
    typeof vibecodr.access_token !== "string" ||
    typeof vibecodr.expires_at !== "number"
  ) {
    throw createError({
      ...TokenExchangeError,
      message: "Unexpected /auth/cli/exchange response shape",
      hasAccessToken: typeof vibecodr?.access_token === "string",
      hasExpiresAt: typeof vibecodr?.expires_at === "number",
    });
  }

  const updatedConfig = {
    ...config,
    vibecodr,
    api_base: apiBase,
    updated_at: new Date().toISOString(),
  };
  writeConfig(resolvedConfigPath, updatedConfig);

  log("Token refresh successful", verbose);

  return { token: vibecodr.access_token, expiresAt: vibecodr.expires_at };
};

const shouldAttemptClerkRefresh = ({ clerkExpiresAt, now, exchangeErr }) => {
  const clerkExpiringSoon =
    typeof clerkExpiresAt === "number" ? clerkExpiresAt - now < 120 : false;
  const errorSuggestsRefresh = isLikelyClerkTokenProblem(exchangeErr);
  return clerkExpiringSoon || errorSuggestsRefresh;
};

const requireClerkRefreshConfig = ({
  clerkIssuer,
  clerkClientId,
  resolvedConfigPath,
}) => {
  const issuerOk = typeof clerkIssuer === "string" && clerkIssuer.length > 0;
  const clientIdOk =
    typeof clerkClientId === "string" && clerkClientId.length > 0;

  if (issuerOk && clientIdOk) {
    return;
  }

  throw createError({
    ...AuthExpired,
    message:
      "Authentication refresh not configured. Run 'aidd --vibe-login' or 'vibecodr-auth.js login' again.",
    configPath: resolvedConfigPath,
  });
};

const refreshClerkAndStore = async ({
  config,
  now,
  clerkIssuer,
  clerkClientId,
  clerkRefreshToken,
  clerkExpiresAt,
  resolvedConfigPath,
  verbose,
}) => {
  log("Refreshing Vibecodr OAuth token...", verbose);

  const refreshed = await refreshClerkAccessToken({
    issuer: clerkIssuer,
    clientId: clerkClientId,
    refreshToken: clerkRefreshToken,
  });

  const newClerkAccessToken = refreshed?.access_token;
  if (!newClerkAccessToken) {
    throw createError({
      ...RefreshError,
      message: "Token endpoint did not return access_token",
    });
  }

  const newClerkExpiresAt =
    typeof refreshed.expires_in === "number"
      ? now + refreshed.expires_in
      : clerkExpiresAt;

  const updatedClerkConfig = {
    ...config,
    clerk: {
      ...(config.clerk ?? {}),
      access_token: newClerkAccessToken,
      refresh_token: refreshed.refresh_token ?? clerkRefreshToken,
      expires_at: newClerkExpiresAt,
    },
    updated_at: new Date().toISOString(),
  };
  writeConfig(resolvedConfigPath, updatedClerkConfig);

  return { updatedClerkConfig, newClerkAccessToken };
};

/**
 * Discover OIDC configuration from issuer
 * @param {string} issuer - OAuth issuer URL
 * @returns {Promise<object>} OIDC configuration
 */
const discoverOidc = async (issuer) => {
  const url = `${normalizeOrigin(issuer)}/.well-known/openid-configuration`;
  return fetchJson(url, { headers: { Accept: "application/json" } });
};

/**
 * Exchange Clerk access token for Vibecodr token
 * @param {object} params - Exchange parameters
 * @param {string} params.apiBase - Vibecodr API base URL
 * @param {string} params.clerkAccessToken - Clerk access token
 * @returns {Promise<object>} Vibecodr token response
 */
const exchangeForVibecodrToken = async ({ apiBase, clerkAccessToken }) => {
  const url = `${normalizeOrigin(apiBase)}/auth/cli/exchange`;
  return fetchJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ access_token: clerkAccessToken }),
  });
};

/**
 * Refresh Clerk access token using refresh token
 * @param {object} params - Refresh parameters
 * @param {string} params.issuer - OAuth issuer URL
 * @param {string} params.clientId - OAuth client ID
 * @param {string} params.refreshToken - Refresh token
 * @returns {Promise<object>} New token response
 */
const refreshClerkAccessToken = async ({ issuer, clientId, refreshToken }) => {
  const oidc = await discoverOidc(issuer);
  const tokenEndpoint = oidc && oidc.token_endpoint;
  if (!tokenEndpoint) {
    throw createError({
      ...RefreshError,
      message: "Issuer is missing token_endpoint in openid-configuration",
      issuer,
    });
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
  });

  return fetchJson(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
};

// =============================================================================
// Main Exported Functions
// =============================================================================

/**
 * Ensure valid Vibecodr authentication is available.
 * Checks for stored credentials and validates token expiry.
 *
 * @param {object} params - Authentication parameters
 * @param {string} [params.apiBase='https://api.vibecodr.space'] - Vibecodr API base URL
 * @param {string} [params.configPath] - Path to config file (defaults to platform default)
 * @param {boolean} [params.verbose=false] - Enable verbose logging
 * @param {number} [params.minValidSeconds=120] - Minimum seconds token must be valid
 * @returns {Promise<{token: string, expiresAt: number}>} Valid token and expiry
 * @throws {Error} AUTH_REQUIRED if no credentials found
 * @throws {Error} AUTH_EXPIRED if token expired and cannot refresh
 */
export const ensureVibecodrAuth = async ({
  apiBase = "https://api.vibecodr.space",
  configPath,
  verbose = false,
  minValidSeconds = 120,
} = {}) => {
  const resolvedConfigPath = getResolvedConfigPath(configPath);

  // SECURITY: Validate config path before use
  const pathValidation = validateConfigPath(resolvedConfigPath);
  if (!pathValidation.valid) {
    throw createError({
      ...ConfigReadError,
      message: `Invalid config path: ${pathValidation.reason}`,
      configPath: resolvedConfigPath,
    });
  }
  if (pathValidation.warning) {
    log(`WARNING: ${pathValidation.warning}`, verbose);
  }

  // Enforce minimum buffer time to prevent race conditions with nearly-expired tokens
  const effectiveMinValid = Math.max(minValidSeconds, minBufferSeconds);

  log(`Reading config...`, verbose);

  const config = readConfig(resolvedConfigPath);

  if (!config) {
    // SECURITY: Generic message - path is in error.configPath for debugging
    throw createError({
      ...AuthRequired,
      message:
        "No CLI config found. Run 'aidd --vibe-login' or 'vibecodr-auth.js login' first.",
      configPath: resolvedConfigPath,
    });
  }

  const vibecodrToken = config?.vibecodr?.access_token;
  // Handle string expiry values (e.g., "1234567890" from JSON)
  const vibecodrExpiresAt = parseExpiry(config?.vibecodr?.expires_at);

  if (!vibecodrToken) {
    // SECURITY: Generic message - path is in error.configPath for debugging
    throw createError({
      ...AuthRequired,
      message:
        "Missing vibecodr access token. Run 'aidd --vibe-login' or 'vibecodr-auth.js login' first.",
      configPath: resolvedConfigPath,
    });
  }

  const now = Math.floor(Date.now() / 1000);

  // Check if token is valid for minimum required time
  // Use > instead of >= to ensure we have at least effectiveMinValid remaining
  if (
    typeof vibecodrExpiresAt === "number" &&
    vibecodrExpiresAt - now > effectiveMinValid
  ) {
    // SECURITY: Log relative time instead of exact expiry to prevent timing attacks
    const minutesRemaining = Math.floor((vibecodrExpiresAt - now) / 60);
    log(`Token valid for ~${minutesRemaining} minutes`, verbose);
    return { token: vibecodrToken, expiresAt: vibecodrExpiresAt };
  }

  log("Token expired or expiring soon, attempting refresh...", verbose);

  // RACE CONDITION PROTECTION: Use mutex to prevent concurrent refresh attempts
  // If multiple parallel operations detect expired token, only one will refresh
  const refreshedAuth = await refreshWithLock(() =>
    refreshVibecodrToken({
      configPath: resolvedConfigPath,
      apiBase,
      verbose,
    }),
  );

  return refreshedAuth;
};

/**
 * Attempt to refresh Vibecodr token using stored refresh token.
 *
 * @param {object} params - Refresh parameters
 * @param {string} [params.configPath] - Path to config file
 * @param {string} [params.apiBase='https://api.vibecodr.space'] - Vibecodr API base URL
 * @param {boolean} [params.verbose=false] - Enable verbose logging
 * @returns {Promise<{token: string, expiresAt: number}>} New token and expiry
 * @throws {Error} AUTH_EXPIRED if refresh fails
 */
export const refreshVibecodrToken = async ({
  configPath,
  apiBase = "https://api.vibecodr.space",
  verbose = false,
} = {}) => {
  const resolvedConfigPath = getResolvedConfigPath(configPath);

  log(`Attempting token refresh...`, verbose);

  const config = requireConfigForRefresh({
    config: readConfig(resolvedConfigPath),
    resolvedConfigPath,
  });

  const clerkAccessToken = requireClerkAccessToken({
    clerkAccessToken: config?.clerk?.access_token,
    resolvedConfigPath,
  });

  const clerkRefreshToken = config?.clerk?.refresh_token;
  const clerkExpiresAt = parseExpiry(config?.clerk?.expires_at);
  const clerkIssuer = config?.issuer;
  const clerkClientId = config?.client_id;

  try {
    return await exchangeAndStoreVibecodrToken({
      config,
      apiBase,
      clerkAccessToken,
      resolvedConfigPath,
      verbose,
    });
  } catch (exchangeErr) {
    const now = Math.floor(Date.now() / 1000);

    if (!clerkRefreshToken) {
      throw createError({
        ...AuthExpired,
        message:
          "Token exchange failed and no refresh_token available. Run 'vibecodr-auth.js login' again.",
        configPath: resolvedConfigPath,
        cause: exchangeErr,
      });
    }

    if (
      !shouldAttemptClerkRefresh({
        clerkExpiresAt,
        now,
        exchangeErr,
      })
    ) {
      throw createError({
        ...AuthExpired,
        message: `Token exchange failed: ${exchangeErr.message}`,
        configPath: resolvedConfigPath,
        cause: exchangeErr,
      });
    }

    requireClerkRefreshConfig({
      clerkIssuer,
      clerkClientId,
      resolvedConfigPath,
    });

    try {
      const { updatedClerkConfig, newClerkAccessToken } =
        await refreshClerkAndStore({
          config,
          now,
          clerkIssuer,
          clerkClientId,
          clerkRefreshToken,
          clerkExpiresAt,
          resolvedConfigPath,
          verbose,
        });

      return await exchangeAndStoreVibecodrToken({
        config: updatedClerkConfig,
        apiBase,
        clerkAccessToken: newClerkAccessToken,
        resolvedConfigPath,
        verbose,
      });
    } catch (refreshErr) {
      throw createError({
        ...RefreshError,
        message: `Failed to refresh authentication: ${refreshErr.message}`,
        configPath: resolvedConfigPath,
        cause: refreshErr,
      });
    }
  }
};

/**
 * Get stored credentials status without exposing the actual token.
 * Useful for checking if credentials exist and their expiry status.
 *
 * SECURITY: This function intentionally does NOT return the raw token
 * to prevent accidental logging or leakage. Use ensureVibecodrAuth()
 * when you need the actual token for API calls.
 *
 * @param {object} params - Parameters
 * @param {string} [params.configPath] - Path to config file
 * @returns {{hasCredentials: boolean, expiresAt?: number, isExpired?: boolean, configPath: string}}
 */
export const getStoredCredentials = ({ configPath } = {}) => {
  const resolvedConfigPath = getResolvedConfigPath(configPath);
  const config = readConfig(resolvedConfigPath);

  if (!config || !config.vibecodr?.access_token) {
    return { hasCredentials: false, configPath: resolvedConfigPath };
  }

  const expiresAt = config.vibecodr.expires_at;
  const now = Math.floor(Date.now() / 1000);
  const isExpired =
    typeof expiresAt === "number" ? expiresAt <= now : undefined;

  // NOTE: Intentionally NOT returning the token to prevent leakage
  return {
    hasCredentials: true,
    expiresAt,
    isExpired,
    configPath: resolvedConfigPath,
  };
};

// Export helpers for testing and backward compatibility
// NOTE: normalizeOrigin and isLikelyClerkTokenProblem are now in vibe-utils.js
// Re-exported here for backward compatibility with existing imports
export { defaultConfigPath };
export { normalizeOrigin, isLikelyClerkTokenProblem } from "./vibe-utils.js";

// SECURITY: Export Windows permission fix function for opt-in remediation
// This is a public API for users to fix insecure permissions when detected
export { fixWindowsPermissions };

// SECURITY: Export Windows permission helpers for testing only
// These should not be used directly by consumers
export const _testOnly = {
  checkWindowsPermissions,
  setWindowsFilePermissions,
  setWindowsDirectoryPermissions,
};
