import { assert } from "riteway/vitest";
import { describe, test, beforeEach } from "vitest";

import {
  parseJironPug,
  fetchJironContract,
  clearJironCache,
  getJironCacheState,
  getDefaultConfig,
} from "./jiron-discovery.js";

// -----------------------------------------------------------------------------
// Sample Jiron Pug Content for Testing
// -----------------------------------------------------------------------------

const SAMPLE_JIRON_PUG = `head(profile='https://vibecodr.space/profiles/vibe-publish')
  title Vibecodr - Publish Vibe
body.vibecodr.vibePublish
  h1 Publish a vibe to Vibecodr

  ul.links
    li.link
      a(rel='self', href='https://api.vibecodr.space/agent/vibe', headers='Accept:application/vnd.jiron+pug')

  ul.properties
    li.property
      label API Base
        span https://api.vibecodr.space
    li.property
      label Canonical player URL
        span https://vibecodr.space/player/{postId}

  section.oauth
    h2 OAuth Configuration (PKCE)
    ul.properties
      li.property
        label Issuer
          span https://clerk.vibecodr.space
      li.property
        label OIDC Discovery
          span https://clerk.vibecodr.space/.well-known/openid-configuration
      li.property
        label Client ID
          span g3NwTqUg7nRzHeHo
      li.property
        label Redirect URI
          span http://localhost:3000/oauth_callback
      li.property
        label Scopes
          span openid profile email
      li.property
        label Code Challenge Method
          span S256

  ul.actions
    li.action
      form(action='create', href='https://api.vibecodr.space/capsules/empty', type='application/json')
        fieldset
          legend Step 4: Create empty capsule (draft)
    li.action
      form(action='put', href='https://api.vibecodr.space/capsules/{capsuleId}/files/{path}', type='application/octet-stream')
        fieldset
          legend Step 5: Upload file bytes
    li.action
      form(action='create', href='https://api.vibecodr.space/capsules/{capsuleId}/publish', type='application/json')
        fieldset
          legend Step 6: Publish
    li.action
      form(action='create', href='https://api.vibecodr.space/auth/cli/exchange', type='application/json')
        fieldset
          legend Step 3: Exchange token
`;

// -----------------------------------------------------------------------------
// parseJironPug Tests
// -----------------------------------------------------------------------------

describe("parseJironPug", () => {
  test("extracts OAuth configuration", () => {
    const result = parseJironPug(SAMPLE_JIRON_PUG);

    assert({
      given: "valid Jiron Pug content",
      should: "extract OAuth issuer",
      actual: result.oauth.issuer,
      expected: "https://clerk.vibecodr.space",
    });

    assert({
      given: "valid Jiron Pug content",
      should: "extract OAuth client ID",
      actual: result.oauth.clientId,
      expected: "g3NwTqUg7nRzHeHo",
    });

    assert({
      given: "valid Jiron Pug content",
      should: "extract OAuth redirect URI",
      actual: result.oauth.redirectUri,
      expected: "http://localhost:3000/oauth_callback",
    });

    assert({
      given: "valid Jiron Pug content",
      should: "extract OAuth scopes",
      actual: result.oauth.scopes,
      expected: "openid profile email",
    });
  });

  test("extracts API properties", () => {
    const result = parseJironPug(SAMPLE_JIRON_PUG);

    assert({
      given: "valid Jiron Pug content",
      should: "extract API base URL",
      actual: result.apiBase,
      expected: "https://api.vibecodr.space",
    });

    assert({
      given: "valid Jiron Pug content",
      should: "extract player URL template",
      actual: result.playerUrlTemplate,
      expected: "https://vibecodr.space/player/{postId}",
    });
  });

  test("extracts action endpoints", () => {
    const result = parseJironPug(SAMPLE_JIRON_PUG);

    assert({
      given: "valid Jiron Pug content",
      should: "extract createCapsule endpoint",
      actual: result.endpoints.createCapsule,
      expected: "https://api.vibecodr.space/capsules/empty",
    });

    assert({
      given: "valid Jiron Pug content",
      should: "extract uploadFile endpoint pattern",
      actual: result.endpoints.uploadFile,
      expected: "https://api.vibecodr.space/capsules/{capsuleId}/files/{path}",
    });

    assert({
      given: "valid Jiron Pug content",
      should: "extract publish endpoint pattern",
      actual: result.endpoints.publish,
      expected: "https://api.vibecodr.space/capsules/{capsuleId}/publish",
    });
  });

  test("handles empty content", () => {
    let error = null;
    try {
      parseJironPug("");
    } catch (e) {
      error = e;
    }

    assert({
      given: "empty content",
      should: "throw JIRON_PARSE_ERROR",
      actual: error?.cause?.code,
      expected: "JIRON_PARSE_ERROR",
    });
  });

  test("handles null content", () => {
    let error = null;
    try {
      parseJironPug(null);
    } catch (e) {
      error = e;
    }

    assert({
      given: "null content",
      should: "throw JIRON_PARSE_ERROR",
      actual: error?.cause?.code,
      expected: "JIRON_PARSE_ERROR",
    });
  });

  test("returns raw metadata", () => {
    const result = parseJironPug(SAMPLE_JIRON_PUG);

    assert({
      given: "valid Jiron Pug content",
      should: "indicate OAuth section was found",
      actual: result.raw.hasOAuthSection,
      expected: true,
    });

    assert({
      given: "valid Jiron Pug content",
      should: "include extracted actions",
      actual: Object.keys(result.raw.actions).length > 0,
      expected: true,
    });
  });
});

// -----------------------------------------------------------------------------
// fetchJironContract Tests
// -----------------------------------------------------------------------------

describe("fetchJironContract", () => {
  beforeEach(() => {
    clearJironCache();
  });

  test("requires apiBase parameter", async () => {
    let error = null;
    try {
      await fetchJironContract({});
    } catch (e) {
      error = e;
    }

    assert({
      given: "missing apiBase",
      should: "throw JIRON_FETCH_FAILED",
      actual: error?.cause?.code,
      expected: "JIRON_FETCH_FAILED",
    });
  });

  test("constructs correct URL", async () => {
    let requestedUrl = null;

    const mockFetch = async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        text: async () => SAMPLE_JIRON_PUG,
      };
    };

    await fetchJironContract({
      apiBase: "https://api.vibecodr.space",
      fetchFn: mockFetch,
    });

    assert({
      given: "apiBase URL",
      should: "request /agent/vibe endpoint",
      actual: requestedUrl,
      expected: "https://api.vibecodr.space/agent/vibe",
    });
  });

  test("handles trailing slash in apiBase", async () => {
    let requestedUrl = null;

    const mockFetch = async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        text: async () => SAMPLE_JIRON_PUG,
      };
    };

    await fetchJironContract({
      apiBase: "https://api.vibecodr.space/",
      fetchFn: mockFetch,
    });

    assert({
      given: "apiBase with trailing slash",
      should: "not double the slash",
      actual: requestedUrl,
      expected: "https://api.vibecodr.space/agent/vibe",
    });
  });

  test("caches successful response", async () => {
    let fetchCount = 0;

    const mockFetch = async () => {
      fetchCount++;
      return {
        ok: true,
        text: async () => SAMPLE_JIRON_PUG,
      };
    };

    await fetchJironContract({
      apiBase: "https://api.vibecodr.space",
      fetchFn: mockFetch,
    });

    await fetchJironContract({
      apiBase: "https://api.vibecodr.space",
      fetchFn: mockFetch,
    });

    assert({
      given: "two consecutive calls",
      should: "only fetch once (cache hit)",
      actual: fetchCount,
      expected: 1,
    });
  });

  test("forceRefresh bypasses cache", async () => {
    let fetchCount = 0;

    const mockFetch = async () => {
      fetchCount++;
      return {
        ok: true,
        text: async () => SAMPLE_JIRON_PUG,
      };
    };

    await fetchJironContract({
      apiBase: "https://api.vibecodr.space",
      fetchFn: mockFetch,
    });

    await fetchJironContract({
      apiBase: "https://api.vibecodr.space",
      fetchFn: mockFetch,
      forceRefresh: true,
    });

    assert({
      given: "forceRefresh flag",
      should: "fetch twice (cache bypass)",
      actual: fetchCount,
      expected: 2,
    });
  });

  test("handles HTTP errors", async () => {
    const mockFetch = async () => ({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    let error = null;
    try {
      await fetchJironContract({
        apiBase: "https://api.vibecodr.space",
        fetchFn: mockFetch,
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "HTTP 500 response",
      should: "throw JIRON_FETCH_FAILED",
      actual: error?.cause?.code,
      expected: "JIRON_FETCH_FAILED",
    });

    assert({
      given: "HTTP 500 response",
      should: "include status in message",
      actual: error?.message?.includes("500"),
      expected: true,
    });
  });

  test("handles network errors", async () => {
    const mockFetch = async () => {
      throw new Error("Network error");
    };

    let error = null;
    try {
      await fetchJironContract({
        apiBase: "https://api.vibecodr.space",
        fetchFn: mockFetch,
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "network failure",
      should: "throw JIRON_FETCH_FAILED",
      actual: error?.cause?.code,
      expected: "JIRON_FETCH_FAILED",
    });
  });
});

// -----------------------------------------------------------------------------
// Malformed Content Tests
// -----------------------------------------------------------------------------

describe("parseJironPug with malformed content", () => {
  test("handles garbage/random string content", () => {
    // Content that is a string but has no valid Pug structure
    const garbageContent =
      "asdf1234!@#$%^&*()_+{}|:<>?`~[]\\;',./\n\nrandom garbage text";

    // parseJironPug should not throw for malformed content that is still a string
    // It will just return empty/null values for the fields it can't find
    const result = parseJironPug(garbageContent);

    assert({
      given: "garbage/malformed Pug content",
      should: "return object with null oauth values",
      actual: result.oauth.issuer,
      expected: null,
    });

    assert({
      given: "garbage/malformed Pug content",
      should: "return object with null apiBase",
      actual: result.apiBase,
      expected: null,
    });

    assert({
      given: "garbage/malformed Pug content",
      should: "return object with empty endpoints",
      actual: result.endpoints.createCapsule,
      expected: null,
    });
  });

  test("handles content with only whitespace and newlines", () => {
    const whitespaceContent = "   \n\n\t\t\n   \n";

    const result = parseJironPug(whitespaceContent);

    assert({
      given: "whitespace-only content",
      should: "return object with null values (not throw)",
      actual: result.oauth.clientId,
      expected: null,
    });
  });

  test("handles content with malformed section markers", () => {
    // Content with partial/broken Pug syntax that looks like it might be Pug
    const malformedContent = `
      section.incomplete
        ul.properties
          li.property
            label broken
      body.missing-close
        form(action='incomplete' href='not-closed
    `;

    // Should not throw, just return what it can extract
    const result = parseJironPug(malformedContent);

    assert({
      given: "malformed Pug with broken syntax",
      should: "return object without throwing",
      actual: typeof result === "object" && result !== null,
      expected: true,
    });

    assert({
      given: "malformed Pug with broken href",
      should: "not extract broken href values",
      actual: Object.keys(result.raw.actions).length,
      expected: 0,
    });
  });

  test("handles content with HTML instead of Pug", () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head><title>Not Pug</title></head>
        <body>
          <h1>This is HTML, not Pug</h1>
          <form action="/submit" method="POST">
            <input type="text" name="field" />
          </form>
        </body>
      </html>
    `;

    const result = parseJironPug(htmlContent);

    assert({
      given: "HTML content instead of Pug",
      should: "return object with null/empty values",
      actual: result.oauth.issuer,
      expected: null,
    });
  });
});

// -----------------------------------------------------------------------------
// Cache Management Tests
// -----------------------------------------------------------------------------

describe("cache management", () => {
  beforeEach(() => {
    clearJironCache();
  });

  test("clearJironCache resets cache", () => {
    const stateBefore = getJironCacheState();

    assert({
      given: "freshly cleared cache",
      should: "report no cache",
      actual: stateBefore.hasCache,
      expected: false,
    });
  });

  test("getJironCacheState reports cache info", async () => {
    const mockFetch = async () => ({
      ok: true,
      text: async () => SAMPLE_JIRON_PUG,
    });

    await fetchJironContract({
      apiBase: "https://api.vibecodr.space",
      fetchFn: mockFetch,
    });

    const state = getJironCacheState();

    assert({
      given: "populated cache",
      should: "report cache exists",
      actual: state.hasCache,
      expected: true,
    });

    assert({
      given: "populated cache",
      should: "have expiry timestamp",
      actual: state.expiresAt !== null,
      expected: true,
    });

    assert({
      given: "populated cache",
      should: "have positive TTL remaining",
      actual: state.ttlRemaining > 0,
      expected: true,
    });
  });
});

// -----------------------------------------------------------------------------
// Default Config Tests
// -----------------------------------------------------------------------------

describe("getDefaultConfig", () => {
  test("returns complete OAuth configuration", () => {
    const config = getDefaultConfig();

    assert({
      given: "default config request",
      should: "include OAuth issuer",
      actual: config.oauth.issuer,
      expected: "https://clerk.vibecodr.space",
    });

    assert({
      given: "default config request",
      should: "include OAuth client ID",
      actual: config.oauth.clientId,
      expected: "g3NwTqUg7nRzHeHo",
    });
  });

  test("returns complete endpoints", () => {
    const config = getDefaultConfig();

    assert({
      given: "default config request",
      should: "include createCapsule endpoint",
      actual: config.endpoints.createCapsule,
      expected: "https://api.vibecodr.space/capsules/empty",
    });

    assert({
      given: "default config request",
      should: "include apiBase",
      actual: config.apiBase,
      expected: "https://api.vibecodr.space",
    });
  });
});
