/**
 * Jiron Contract Discovery Module
 *
 * Fetches and parses Vibecodr's Jiron contract for self-discovery.
 * The Jiron format is a Pug-based hypermedia document describing
 * API endpoints, OAuth configuration, and platform properties.
 *
 * @module jiron-discovery
 */

import { errorCauses, createError } from "error-causes";

// -----------------------------------------------------------------------------
// Error Definitions
// -----------------------------------------------------------------------------

const [jironErrors] = errorCauses({
  JironFetchFailed: {
    code: "JIRON_FETCH_FAILED",
    message: "Failed to fetch Jiron contract from API",
  },
  JironParseError: {
    code: "JIRON_PARSE_ERROR",
    message: "Failed to parse Jiron contract",
  },
});

const { JironFetchFailed, JironParseError } = jironErrors;

// -----------------------------------------------------------------------------
// Cache Configuration
// -----------------------------------------------------------------------------

// In-memory cache with 1-hour TTL (as per spec)
const cacheTtlMs = 60 * 60 * 1000; // 1 hour

/**
 * Cache state container.
 * Using an object allows atomic updates and easier testing.
 * The cache is module-level by design for performance (1-hour TTL).
 */
const cacheState = {
  contract: null,
  expiry: 0,
};

// -----------------------------------------------------------------------------
// Jiron Pug Parser
// -----------------------------------------------------------------------------

/**
 * Extracts property value from Jiron Pug lines.
 * Looks for pattern: label Name \n span Value
 *
 * @param {string[]} lines - Array of Pug lines
 * @param {string} labelName - The label to search for
 * @returns {string|null} - The extracted value or null
 */
const extractProperty = (lines, labelName) => {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Match "label LabelName" or "label LabelName (extras)"
    if (line.startsWith("label") && line.includes(labelName)) {
      // Check next line for span value
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.startsWith("span")) {
          // Extract value after "span "
          return nextLine.replace(/^span\s*/, "").trim();
        }
        // Also check for input with value attribute
        if (nextLine.startsWith("input")) {
          const valueMatch = nextLine.match(/value=['"]([^'"]+)['"]/);
          if (valueMatch) {
            return valueMatch[1];
          }
        }
      }
    }
  }
  return null;
};

/**
 * Extracts all form actions from Jiron Pug content.
 * Looks for form elements with href attributes.
 *
 * @param {string[]} lines - Array of Pug lines
 * @returns {Object} - Map of action names to endpoint URLs
 */
const extractActions = (lines) => {
  const actions = {};
  let currentAction = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect action context from li.action classes
    if (trimmed.startsWith("li.action")) {
      const classMatch = trimmed.match(/li\.action\.?(\S*)/);
      currentAction = classMatch?.[1] || null;
    }

    // Extract form href
    if (trimmed.startsWith("form(")) {
      const hrefMatch = trimmed.match(/href=['"]([^'"]+)['"]/);
      const actionMatch = trimmed.match(/action=['"]([^'"]+)['"]/);

      if (hrefMatch) {
        const href = hrefMatch[1];
        const method = actionMatch?.[1] || "create";

        // Determine action name from context
        let name = currentAction;
        if (!name) {
          // Infer from URL pattern
          if (href.includes("/capsules/empty")) name = "createCapsule";
          else if (href.includes("/capsules/") && href.includes("/files/"))
            name = "uploadFile";
          else if (href.includes("/capsules/") && href.includes("/publish"))
            name = "publish";
          else if (href.includes("/auth/cli/exchange")) name = "tokenExchange";
          else if (href.includes("/oauth/authorize")) name = "oauthAuthorize";
          else if (href.includes("/oauth/token")) name = "oauthToken";
          else if (href.includes("/me/drafts")) name = "listDrafts";
          else if (href.includes("/drafts/")) name = "getDraft";
        }

        if (name) {
          actions[name] = { href, method };
        }
      }
    }
  }

  return actions;
};

/**
 * Parses Jiron Pug format to extract configuration.
 * The Jiron format uses Pug-like syntax with semantic classes
 * to describe API structure and OAuth configuration.
 *
 * @param {string} pugContent - Raw Jiron Pug content
 * @returns {Object} - Parsed configuration object
 * @throws {Error} JIRON_PARSE_ERROR if pugContent is invalid (null, empty, or not a string) or parsing fails
 */
export const parseJironPug = (pugContent) => {
  if (!pugContent || typeof pugContent !== "string") {
    throw createError({
      ...JironParseError,
      message: "Invalid Jiron content: expected non-empty string",
    });
  }

  try {
    const lines = pugContent.split("\n");

    // Extract OAuth configuration from section.oauth
    const oauthStartIdx = lines.findIndex((l) => l.includes("section.oauth"));
    const actionsStartIdx = lines.findIndex((l) => l.includes("ul.actions"));

    // Get OAuth section lines (between section.oauth and ul.actions)
    const oauthLines =
      oauthStartIdx >= 0
        ? lines.slice(
            oauthStartIdx,
            actionsStartIdx > oauthStartIdx ? actionsStartIdx : undefined,
          )
        : [];

    // Get properties section
    const propertiesStartIdx = lines.findIndex((l) =>
      l.includes("ul.properties"),
    );
    const propertiesEndIdx = lines.findIndex(
      (l, idx) => idx > propertiesStartIdx && l.includes("section.oauth"),
    );
    const propertiesLines =
      propertiesStartIdx >= 0
        ? lines.slice(
            propertiesStartIdx,
            propertiesEndIdx > propertiesStartIdx
              ? propertiesEndIdx
              : undefined,
          )
        : [];

    // Extract OAuth values
    const oauth = {
      issuer: extractProperty(oauthLines, "Issuer") || null,
      oidcDiscovery: extractProperty(oauthLines, "OIDC Discovery") || null,
      clientId: extractProperty(oauthLines, "Client ID") || null,
      redirectUri: extractProperty(oauthLines, "Redirect URI") || null,
      scopes: extractProperty(oauthLines, "Scopes") || null,
      codeChallengeMethod:
        extractProperty(oauthLines, "Code Challenge Method") || "S256",
    };

    // Extract base properties
    const apiBase = extractProperty(propertiesLines, "API Base") || null;
    const playerUrlTemplate =
      extractProperty(propertiesLines, "Canonical player URL") || null;

    // Extract actions/endpoints
    const actions = extractActions(lines);

    // Build endpoints object from actions
    const endpoints = {
      createCapsule: actions.createCapsule?.href || null,
      uploadFile: actions.uploadFile?.href || null,
      publish: actions.publish?.href || null,
      tokenExchange: actions.tokenExchange?.href || null,
      listDrafts: actions.listDrafts?.href || null,
    };

    return {
      oauth,
      endpoints,
      apiBase,
      playerBase: playerUrlTemplate
        ? playerUrlTemplate.replace("/{postId}", "")
        : null,
      playerUrlTemplate,
      raw: {
        actions,
        propertiesCount: propertiesLines.length,
        hasOAuthSection: oauthStartIdx >= 0,
      },
    };
  } catch (error) {
    // Re-throw if already a structured error
    if (error.cause?.code === "JIRON_PARSE_ERROR") {
      throw error;
    }

    throw createError({
      ...JironParseError,
      message: `Jiron parsing failed: ${error.message}`,
      cause: error,
    });
  }
};

// -----------------------------------------------------------------------------
// Jiron Contract Fetcher
// -----------------------------------------------------------------------------

/**
 * Fetches the Jiron contract from Vibecodr API.
 * Implements caching with configurable TTL to reduce API calls.
 *
 * @param {Object} options - Fetch options
 * @param {string} options.apiBase - Base URL for the API (e.g., https://api.vibecodr.space)
 * @param {boolean} [options.forceRefresh=false] - Skip cache and fetch fresh
 * @param {Function} [options.fetchFn=fetch] - Fetch implementation (for testing)
 * @returns {Promise<Object>} - Parsed Jiron configuration
 * @throws {Error} JIRON_FETCH_FAILED if apiBase is missing, HTTP request fails, or network error occurs
 * @throws {Error} JIRON_PARSE_ERROR if the fetched content cannot be parsed as valid Jiron Pug
 */
export const fetchJironContract = async ({
  apiBase,
  forceRefresh = false,
  fetchFn = fetch,
}) => {
  // Validate apiBase
  if (!apiBase || typeof apiBase !== "string") {
    throw createError({
      ...JironFetchFailed,
      message: "apiBase is required and must be a string",
    });
  }

  // Check cache (unless force refresh requested)
  const now = Date.now();
  if (!forceRefresh && cacheState.contract && now < cacheState.expiry) {
    return cacheState.contract;
  }

  // Build request URL and headers
  const url = `${apiBase.replace(/\/$/, "")}/agent/vibe`;
  const headers = {
    Accept: "application/vnd.jiron+pug",
  };

  try {
    const response = await fetchFn(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw createError({
        ...JironFetchFailed,
        message: `HTTP ${response.status}: ${response.statusText}`,
      });
    }

    const pugContent = await response.text();
    const parsed = parseJironPug(pugContent);

    // Update cache (immutable update pattern)
    cacheState.contract = parsed;
    cacheState.expiry = now + cacheTtlMs;

    return parsed;
  } catch (error) {
    // Re-throw structured errors
    if (
      error.cause?.code === "JIRON_FETCH_FAILED" ||
      error.cause?.code === "JIRON_PARSE_ERROR"
    ) {
      throw error;
    }

    // Wrap network/unexpected errors
    throw createError({
      ...JironFetchFailed,
      message: `Network error fetching Jiron contract: ${error.message}`,
      cause: error,
    });
  }
};

// -----------------------------------------------------------------------------
// Cache Management
// -----------------------------------------------------------------------------

/**
 * Clears the Jiron contract cache.
 * Useful for testing or when forcing a refresh is needed.
 */
export const clearJironCache = () => {
  cacheState.contract = null;
  cacheState.expiry = 0;
};

/**
 * Returns current cache state for debugging/testing.
 *
 * @returns {Object} - Cache state info
 */
export const getJironCacheState = () => ({
  hasCache: cacheState.contract !== null,
  expiresAt:
    cacheState.expiry > 0 ? new Date(cacheState.expiry).toISOString() : null,
  ttlRemaining: Math.max(0, cacheState.expiry - Date.now()),
});

// -----------------------------------------------------------------------------
// Default Configuration (fallback when Jiron unavailable)
// -----------------------------------------------------------------------------

/**
 * Returns hardcoded default configuration as fallback.
 * Used when Jiron contract cannot be fetched.
 *
 * @returns {Object} - Default Vibecodr configuration
 */
export const getDefaultConfig = () => ({
  oauth: {
    issuer: "https://clerk.vibecodr.space",
    oidcDiscovery:
      "https://clerk.vibecodr.space/.well-known/openid-configuration",
    clientId: "g3NwTqUg7nRzHeHo",
    redirectUri: "http://localhost:3000/oauth_callback",
    scopes: "openid profile email",
    codeChallengeMethod: "S256",
  },
  endpoints: {
    createCapsule: "https://api.vibecodr.space/capsules/empty",
    uploadFile: "https://api.vibecodr.space/capsules/{capsuleId}/files/{path}",
    publish: "https://api.vibecodr.space/capsules/{capsuleId}/publish",
    tokenExchange: "https://api.vibecodr.space/auth/cli/exchange",
    listDrafts: "https://api.vibecodr.space/me/drafts",
  },
  apiBase: "https://api.vibecodr.space",
  playerBase: "https://vibecodr.space/player",
  playerUrlTemplate: "https://vibecodr.space/player/{postId}",
});
