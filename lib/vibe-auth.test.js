/**
 * vibe-auth.test.js
 *
 * Unit tests for vibe-auth module
 * Uses Riteway format with Vitest
 */
import { assert } from "riteway/vitest";
import { describe, test, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// Mock child_process before importing the module
// This must be done at the top level for ESM
let mockExecSync = vi.fn();
vi.mock("node:child_process", () => ({
  execSync: (...args) => mockExecSync(...args),
}));

import {
  ensureVibecodrAuth,
  refreshVibecodrToken,
  getStoredCredentials,
  defaultConfigPath,
  normalizeOrigin,
  isLikelyClerkTokenProblem,
  fixWindowsPermissions,
  _testOnly,
} from "./vibe-auth.js";

// =============================================================================
// Helper function tests
// =============================================================================

describe("normalizeOrigin", () => {
  test("removes trailing slashes", () => {
    assert({
      given: "a URL with trailing slashes",
      should: "remove all trailing slashes",
      actual: normalizeOrigin("https://api.vibecodr.space///"),
      expected: "https://api.vibecodr.space",
    });
  });

  test("leaves clean URLs unchanged", () => {
    assert({
      given: "a URL without trailing slashes",
      should: "return the URL unchanged",
      actual: normalizeOrigin("https://api.vibecodr.space"),
      expected: "https://api.vibecodr.space",
    });
  });
});

describe("defaultConfigPath", () => {
  test("returns platform-appropriate path", () => {
    const configPath = defaultConfigPath();

    assert({
      given: "no parameters",
      should: "return a path ending with vibecodr/cli.json",
      actual: configPath.endsWith(path.join("vibecodr", "cli.json")),
      expected: true,
    });
  });

  test("uses APPDATA on Windows", () => {
    const originalPlatform = process.platform;
    const originalAppData = process.env.APPDATA;

    // Only run this test on Windows
    if (originalPlatform === "win32" && originalAppData) {
      const configPath = defaultConfigPath();
      assert({
        given: "Windows platform with APPDATA set",
        should: "return path under APPDATA",
        actual: configPath.startsWith(originalAppData),
        expected: true,
      });
    } else {
      // Skip test on non-Windows
      assert({
        given: "non-Windows platform",
        should: "skip APPDATA test",
        actual: true,
        expected: true,
      });
    }
  });
});

describe("isLikelyClerkTokenProblem", () => {
  test("returns true for 401 status", () => {
    const err = new Error("Unauthorized");
    err.status = 401;

    assert({
      given: "an error with status 401",
      should: "return true",
      actual: isLikelyClerkTokenProblem(err),
      expected: true,
    });
  });

  test("returns true for expiring soon hint", () => {
    const err = new Error("Token issue");
    err.body = { hint: "Token is expiring soon" };

    assert({
      given: "an error with expiring soon hint in body",
      should: "return true",
      actual: isLikelyClerkTokenProblem(err),
      expected: true,
    });
  });

  test("returns true for auth code in body", () => {
    const err = new Error("Auth error");
    err.body = { code: "auth.token_expired" };

    assert({
      given: "an error with auth.* code in body",
      should: "return true",
      actual: isLikelyClerkTokenProblem(err),
      expected: true,
    });
  });

  test("returns false for non-auth errors", () => {
    const err = new Error("Network error");
    err.status = 500;

    assert({
      given: "an error with non-auth status",
      should: "return false",
      actual: isLikelyClerkTokenProblem(err),
      expected: false,
    });
  });

  test("returns false for null/undefined", () => {
    assert({
      given: "null error",
      should: "return false",
      actual: isLikelyClerkTokenProblem(null),
      expected: false,
    });

    assert({
      given: "undefined error",
      should: "return false",
      actual: isLikelyClerkTokenProblem(undefined),
      expected: false,
    });
  });
});

// =============================================================================
// getStoredCredentials tests
// =============================================================================

describe("getStoredCredentials", () => {
  let tempDir;
  let tempConfigPath;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vibe-auth-test-"));
    tempConfigPath = path.join(tempDir, "vibecodr", "cli.json");
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("returns hasCredentials false when no config exists", () => {
    const result = getStoredCredentials({ configPath: tempConfigPath });

    assert({
      given: "a non-existent config path",
      should: "return hasCredentials false",
      actual: result.hasCredentials,
      expected: false,
    });
  });

  test("returns credentials when config exists", () => {
    // Create config directory and file
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const testConfig = {
      vibecodr: {
        access_token: "test-token-123",
        expires_at: expiresAt,
      },
    };
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig));

    const result = getStoredCredentials({ configPath: tempConfigPath });

    assert({
      given: "a config file with credentials",
      should: "return hasCredentials true",
      actual: result.hasCredentials,
      expected: true,
    });

    // SECURITY: getStoredCredentials no longer returns token to prevent leakage
    // It only returns metadata about credential status
    assert({
      given: "a config file with credentials",
      should: "NOT return the token (security measure)",
      actual: result.token,
      expected: undefined,
    });

    assert({
      given: "a config file with credentials",
      should: "return the expiry time",
      actual: result.expiresAt,
      expected: expiresAt,
    });

    assert({
      given: "a config file with non-expired credentials",
      should: "return isExpired false",
      actual: result.isExpired,
      expected: false,
    });
  });

  test("returns hasCredentials false when config exists but no token", () => {
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });
    const testConfig = { vibecodr: {} };
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig));

    const result = getStoredCredentials({ configPath: tempConfigPath });

    assert({
      given: "a config file without access_token",
      should: "return hasCredentials false",
      actual: result.hasCredentials,
      expected: false,
    });
  });
});

// =============================================================================
// ensureVibecodrAuth tests
// =============================================================================

describe("ensureVibecodrAuth", () => {
  let tempDir;
  let tempConfigPath;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vibe-auth-test-"));
    tempConfigPath = path.join(tempDir, "vibecodr", "cli.json");
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("throws AUTH_REQUIRED when no config exists", async () => {
    let error;
    try {
      await ensureVibecodrAuth({ configPath: tempConfigPath });
    } catch (e) {
      error = e;
    }

    assert({
      given: "no config file",
      should: "throw error with AUTH_REQUIRED code",
      actual: error?.cause?.code,
      expected: "AUTH_REQUIRED",
    });
  });

  test("throws AUTH_REQUIRED when no access_token in config", async () => {
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });
    const testConfig = { vibecodr: {} };
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig));

    let error;
    try {
      await ensureVibecodrAuth({ configPath: tempConfigPath });
    } catch (e) {
      error = e;
    }

    assert({
      given: "config without access_token",
      should: "throw error with AUTH_REQUIRED code",
      actual: error?.cause?.code,
      expected: "AUTH_REQUIRED",
    });
  });

  test("returns token when valid and not expiring", async () => {
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });
    const futureExpiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const testConfig = {
      vibecodr: {
        access_token: "valid-token-123",
        expires_at: futureExpiry,
      },
    };
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig));

    const result = await ensureVibecodrAuth({ configPath: tempConfigPath });

    assert({
      given: "valid non-expiring token in config",
      should: "return the token",
      actual: result.token,
      expected: "valid-token-123",
    });

    assert({
      given: "valid non-expiring token in config",
      should: "return the expiresAt",
      actual: result.expiresAt,
      expected: futureExpiry,
    });
  });
});

// =============================================================================
// refreshVibecodrToken tests
// =============================================================================

describe("refreshVibecodrToken", () => {
  let tempDir;
  let tempConfigPath;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vibe-auth-test-"));
    tempConfigPath = path.join(tempDir, "vibecodr", "cli.json");
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("throws AUTH_EXPIRED when no config exists", async () => {
    let error;
    try {
      await refreshVibecodrToken({ configPath: tempConfigPath });
    } catch (e) {
      error = e;
    }

    assert({
      given: "no config file",
      should: "throw error with AUTH_EXPIRED code",
      actual: error?.cause?.code,
      expected: "AUTH_EXPIRED",
    });
  });

  test("throws AUTH_EXPIRED when no clerk access_token", async () => {
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });
    const testConfig = { clerk: {} };
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig));

    let error;
    try {
      await refreshVibecodrToken({ configPath: tempConfigPath });
    } catch (e) {
      error = e;
    }

    assert({
      given: "config without clerk access_token",
      should: "throw error with AUTH_EXPIRED code",
      actual: error?.cause?.code,
      expected: "AUTH_EXPIRED",
    });
  });
});

// =============================================================================
// Additional Coverage Tests
// =============================================================================

describe("getStoredCredentials - string expires_at", () => {
  let tempDir;
  let tempConfigPath;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vibe-auth-test-"));
    tempConfigPath = path.join(tempDir, "vibecodr", "cli.json");
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("handles string expires_at value gracefully", () => {
    // Some systems might store expires_at as string instead of number
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });
    const expiresAtString = String(Math.floor(Date.now() / 1000) + 3600);
    const testConfig = {
      vibecodr: {
        access_token: "test-token-123",
        expires_at: expiresAtString, // String instead of number
      },
    };
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig));

    const result = getStoredCredentials({ configPath: tempConfigPath });

    assert({
      given: "a config file with string expires_at",
      should: "return hasCredentials true",
      actual: result.hasCredentials,
      expected: true,
    });

    // isExpired should be undefined when expires_at is not a number
    assert({
      given: "a config file with string expires_at",
      should: "return undefined isExpired (type mismatch)",
      actual: result.isExpired,
      expected: undefined,
    });
  });
});

// =============================================================================
// minValidSeconds edge case tests
// =============================================================================

describe("ensureVibecodrAuth - minValidSeconds edge cases", () => {
  let tempDir;
  let tempConfigPath;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vibe-auth-test-"));
    tempConfigPath = path.join(tempDir, "vibecodr", "cli.json");
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("enforces minimum buffer even when minValidSeconds=0", async () => {
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });
    // Token expires in 5 seconds - less than the enforced minimum buffer (10s)
    const nearExpiry = Math.floor(Date.now() / 1000) + 5;
    const testConfig = {
      vibecodr: {
        access_token: "nearly-expired-token",
        expires_at: nearExpiry,
      },
      clerk: {
        access_token: "clerk-token",
      },
    };
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig));

    // Even with minValidSeconds=0, the 10s minimum buffer should trigger refresh
    let error;
    try {
      await ensureVibecodrAuth({
        configPath: tempConfigPath,
        minValidSeconds: 0,
      });
    } catch (e) {
      error = e;
    }

    // Should attempt refresh (and fail because no refresh mechanism is mocked)
    // The key is that it doesn't return the near-expiry token
    assert({
      given: "token expiring in 5s with minValidSeconds=0",
      should: "attempt refresh due to enforced minimum buffer",
      actual: error !== undefined, // Should error because refresh would be attempted
      expected: true,
    });
  });

  test("accepts token valid for more than minimum buffer", async () => {
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });
    // Token expires in 200 seconds - more than default minValidSeconds (120)
    const futureExpiry = Math.floor(Date.now() / 1000) + 200;
    const testConfig = {
      vibecodr: {
        access_token: "valid-token",
        expires_at: futureExpiry,
      },
    };
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig));

    const result = await ensureVibecodrAuth({ configPath: tempConfigPath });

    assert({
      given: "token valid for 200 seconds",
      should: "return the token without refresh",
      actual: result.token,
      expected: "valid-token",
    });
  });
});

// =============================================================================
// Token expiry type coercion tests
// =============================================================================

describe("ensureVibecodrAuth - expires_at type coercion", () => {
  let tempDir;
  let tempConfigPath;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vibe-auth-test-"));
    tempConfigPath = path.join(tempDir, "vibecodr", "cli.json");
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("handles string expires_at correctly", async () => {
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });
    const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
    const testConfig = {
      vibecodr: {
        access_token: "string-expiry-token",
        expires_at: String(futureExpiry), // String instead of number
      },
    };
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig));

    const result = await ensureVibecodrAuth({ configPath: tempConfigPath });

    assert({
      given: "config with string expires_at",
      should: "parse and return the token",
      actual: result.token,
      expected: "string-expiry-token",
    });
  });
});

// =============================================================================
// File Permissions Verification Tests (Security)
// =============================================================================

describe("file permissions verification", () => {
  // Save original platform for restoration
  const originalPlatform = process.platform;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Restore platform after each test
    Object.defineProperty(process, "platform", { value: originalPlatform });
  });

  test("allows reading config with secure permissions (0600)", async () => {
    // Skip this test on Windows - permissions work differently
    if (originalPlatform === "win32") {
      assert({
        given: "Windows platform",
        should: "skip Unix permission test",
        actual: true,
        expected: true,
      });
      return;
    }

    // Mock Unix platform
    Object.defineProperty(process, "platform", { value: "linux" });

    // Mock fs.statSync to return mode 0o100600 (regular file + 0600 permissions)
    // 0o100000 = regular file type bit, 0o600 = owner read/write only
    vi.spyOn(fs, "statSync").mockReturnValue({ mode: 0o100600 });

    const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
    vi.spyOn(fs, "readFileSync").mockReturnValue(
      JSON.stringify({
        vibecodr: { access_token: "secure-token", expires_at: futureExpiry },
      }),
    );

    const result = await ensureVibecodrAuth({
      configPath: "/home/user/.config/vibecodr/cli.json",
    });

    assert({
      given: "config file with 0600 permissions",
      should: "read successfully and return token",
      actual: result.token,
      expected: "secure-token",
    });
  });

  test("rejects config with group-readable permissions (0640)", async () => {
    // Skip this test on Windows - permissions work differently
    if (originalPlatform === "win32") {
      assert({
        given: "Windows platform",
        should: "skip Unix permission test",
        actual: true,
        expected: true,
      });
      return;
    }

    // Mock Unix platform
    Object.defineProperty(process, "platform", { value: "linux" });

    // Mock fs.statSync to return insecure mode 0o100640 (group readable)
    vi.spyOn(fs, "statSync").mockReturnValue({ mode: 0o100640 });

    let error = null;
    try {
      await ensureVibecodrAuth({
        configPath: "/home/user/.config/vibecodr/cli.json",
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "config file with 0640 permissions",
      should: "throw CONFIG_READ_ERROR",
      actual: error?.cause?.code,
      expected: "CONFIG_READ_ERROR",
    });

    assert({
      given: "config file with insecure permissions",
      should: "include actual mode in error message",
      actual: error?.message?.includes("640"),
      expected: true,
    });
  });

  test("rejects config with world-readable permissions (0644)", async () => {
    // Skip this test on Windows - permissions work differently
    if (originalPlatform === "win32") {
      assert({
        given: "Windows platform",
        should: "skip Unix permission test",
        actual: true,
        expected: true,
      });
      return;
    }

    // Mock Unix platform
    Object.defineProperty(process, "platform", { value: "linux" });

    // Mock fs.statSync to return insecure mode 0o100644 (world readable)
    vi.spyOn(fs, "statSync").mockReturnValue({ mode: 0o100644 });

    let error = null;
    try {
      await ensureVibecodrAuth({
        configPath: "/home/user/.config/vibecodr/cli.json",
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "config file with 0644 permissions",
      should: "throw CONFIG_READ_ERROR",
      actual: error?.cause?.code,
      expected: "CONFIG_READ_ERROR",
    });

    assert({
      given: "config file with world-readable permissions",
      should: "include actual mode in error message",
      actual: error?.message?.includes("644"),
      expected: true,
    });
  });

  test("rejects config with world-writable permissions (0666)", async () => {
    // Skip this test on Windows - permissions work differently
    if (originalPlatform === "win32") {
      assert({
        given: "Windows platform",
        should: "skip Unix permission test",
        actual: true,
        expected: true,
      });
      return;
    }

    // Mock Unix platform
    Object.defineProperty(process, "platform", { value: "linux" });

    // Mock fs.statSync to return insecure mode 0o100666 (world readable/writable)
    vi.spyOn(fs, "statSync").mockReturnValue({ mode: 0o100666 });

    let error = null;
    try {
      await ensureVibecodrAuth({
        configPath: "/home/user/.config/vibecodr/cli.json",
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "config file with 0666 permissions",
      should: "throw CONFIG_READ_ERROR",
      actual: error?.cause?.code,
      expected: "CONFIG_READ_ERROR",
    });

    assert({
      given: "config file with world-writable permissions",
      should: "include actual mode in error message",
      actual: error?.message?.includes("666"),
      expected: true,
    });
  });

  test("allows owner-execute permission (0700)", async () => {
    // Skip this test on Windows - permissions work differently
    if (originalPlatform === "win32") {
      assert({
        given: "Windows platform",
        should: "skip Unix permission test",
        actual: true,
        expected: true,
      });
      return;
    }

    // Mock Unix platform
    Object.defineProperty(process, "platform", { value: "linux" });

    // Mock fs.statSync to return mode 0o100700 (owner rwx, no group/world)
    // This is unusual for a config file but should be allowed since
    // group and others have no access
    vi.spyOn(fs, "statSync").mockReturnValue({ mode: 0o100700 });

    const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
    vi.spyOn(fs, "readFileSync").mockReturnValue(
      JSON.stringify({
        vibecodr: { access_token: "exec-token", expires_at: futureExpiry },
      }),
    );

    const result = await ensureVibecodrAuth({
      configPath: "/home/user/.config/vibecodr/cli.json",
    });

    assert({
      given: "config file with 0700 permissions (owner execute)",
      should: "read successfully since group/world have no access",
      actual: result.token,
      expected: "exec-token",
    });
  });

  test("skips permission check on Windows", async () => {
    // Mock Windows platform
    Object.defineProperty(process, "platform", { value: "win32" });

    // Spy on statSync - it should NOT be called on Windows for permission check
    const statSpy = vi.spyOn(fs, "statSync");

    const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
    vi.spyOn(fs, "readFileSync").mockReturnValue(
      JSON.stringify({
        vibecodr: { access_token: "windows-token", expires_at: futureExpiry },
      }),
    );

    const result = await ensureVibecodrAuth({
      configPath: "C:\\Users\\test\\AppData\\Roaming\\vibecodr\\cli.json",
    });

    assert({
      given: "Windows platform",
      should: "not call statSync for permission check",
      actual: statSpy.mock.calls.length,
      expected: 0,
    });

    assert({
      given: "Windows platform",
      should: "read config successfully without permission check",
      actual: result.token,
      expected: "windows-token",
    });
  });

  test("handles non-existent file gracefully (ENOENT)", async () => {
    // Skip this test on Windows - permissions work differently
    if (originalPlatform === "win32") {
      assert({
        given: "Windows platform",
        should: "skip Unix permission test",
        actual: true,
        expected: true,
      });
      return;
    }

    // Mock Unix platform
    Object.defineProperty(process, "platform", { value: "linux" });

    // Mock fs.statSync to throw ENOENT (file doesn't exist)
    const enoentError = new Error("ENOENT: no such file or directory");
    enoentError.code = "ENOENT";
    vi.spyOn(fs, "statSync").mockImplementation(() => {
      throw enoentError;
    });

    // readFileSync should also throw ENOENT
    vi.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw enoentError;
    });

    let error = null;
    try {
      await ensureVibecodrAuth({
        configPath: "/home/user/.config/vibecodr/cli.json",
      });
    } catch (e) {
      error = e;
    }

    // Should throw AUTH_REQUIRED (no config), not CONFIG_READ_ERROR
    assert({
      given: "non-existent config file",
      should: "throw AUTH_REQUIRED (not CONFIG_READ_ERROR)",
      actual: error?.cause?.code,
      expected: "AUTH_REQUIRED",
    });
  });

  test("rejects group-writable permissions (0620)", async () => {
    // Skip this test on Windows - permissions work differently
    if (originalPlatform === "win32") {
      assert({
        given: "Windows platform",
        should: "skip Unix permission test",
        actual: true,
        expected: true,
      });
      return;
    }

    // Mock Unix platform
    Object.defineProperty(process, "platform", { value: "linux" });

    // Mock fs.statSync to return mode 0o100620 (owner rw, group w)
    vi.spyOn(fs, "statSync").mockReturnValue({ mode: 0o100620 });

    let error = null;
    try {
      await ensureVibecodrAuth({
        configPath: "/home/user/.config/vibecodr/cli.json",
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "config file with group-writable permissions (0620)",
      should: "throw CONFIG_READ_ERROR",
      actual: error?.cause?.code,
      expected: "CONFIG_READ_ERROR",
    });
  });

  test("includes chmod instruction in error message", async () => {
    // Skip this test on Windows - permissions work differently
    if (originalPlatform === "win32") {
      assert({
        given: "Windows platform",
        should: "skip Unix permission test",
        actual: true,
        expected: true,
      });
      return;
    }

    // Mock Unix platform
    Object.defineProperty(process, "platform", { value: "linux" });

    // Mock fs.statSync to return insecure mode
    vi.spyOn(fs, "statSync").mockReturnValue({ mode: 0o100644 });

    let error = null;
    try {
      await ensureVibecodrAuth({
        configPath: "/home/user/.config/vibecodr/cli.json",
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "insecure file permissions",
      should: "include chmod 600 instruction in error",
      actual: error?.message?.includes("chmod 600"),
      expected: true,
    });
  });
});

// =============================================================================
// Concurrent Token Refresh (Mutex) Tests
// =============================================================================

describe("refreshWithLock - concurrent token refresh protection", () => {
  let tempDir;
  let tempConfigPath;
  let mockFetch;
  let originalFetch;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vibe-auth-test-"));
    tempConfigPath = path.join(tempDir, "vibecodr", "cli.json");

    // Save original fetch and replace with mock
    originalFetch = global.fetch;
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    // Restore original fetch
    global.fetch = originalFetch;
    mockFetch.mockReset();
  });

  test("only performs one refresh when multiple operations detect expiry simultaneously", async () => {
    // Setup: Create config with expired vibecodr token but valid clerk token
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });
    const expiredAt = Math.floor(Date.now() / 1000) - 100; // Expired 100 seconds ago
    const testConfig = {
      vibecodr: {
        access_token: "expired-vibecodr-token",
        expires_at: expiredAt,
      },
      clerk: {
        access_token: "valid-clerk-token",
        expires_at: Math.floor(Date.now() / 1000) + 3600, // Valid for 1 hour
      },
    };
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig));

    // Track how many times the exchange endpoint is called
    let exchangeCallCount = 0;
    const newExpiresAt = Math.floor(Date.now() / 1000) + 3600;

    // Mock fetch to handle the token exchange endpoint
    // The exchange endpoint is called when refreshing vibecodr token
    mockFetch.mockImplementation(async (url) => {
      if (url.includes("/auth/cli/exchange")) {
        exchangeCallCount++;
        // Simulate network delay to ensure both calls overlap
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {
          ok: true,
          status: 200,
          headers: new Map(),
          text: async () =>
            JSON.stringify({
              access_token: "new-vibecodr-token",
              expires_at: newExpiresAt,
            }),
        };
      }
      // Unexpected endpoint
      return {
        ok: false,
        status: 404,
        headers: new Map(),
        text: async () => JSON.stringify({ error: "Not found" }),
      };
    });

    // Trigger two concurrent operations that both detect expired token
    const operation1 = ensureVibecodrAuth({ configPath: tempConfigPath });
    const operation2 = ensureVibecodrAuth({ configPath: tempConfigPath });

    // Both should complete successfully
    const [result1, result2] = await Promise.all([operation1, operation2]);

    // Assert: refresh (exchange) was only called ONCE due to mutex
    assert({
      given: "two concurrent operations detecting expired token",
      should: "only call token exchange once (mutex working)",
      actual: exchangeCallCount,
      expected: 1,
    });

    // Assert: both operations got the same refreshed token
    assert({
      given: "two concurrent operations",
      should: "both return the same refreshed token",
      actual: result1.token,
      expected: "new-vibecodr-token",
    });

    assert({
      given: "two concurrent operations",
      should: "both return the same token (second caller)",
      actual: result2.token,
      expected: "new-vibecodr-token",
    });

    // Assert: both got the same expiry
    assert({
      given: "two concurrent operations",
      should: "both return the same expiresAt",
      actual: result1.expiresAt === result2.expiresAt,
      expected: true,
    });
  });

  test("releases lock after refresh completes allowing subsequent refreshes", async () => {
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });

    // Track exchange calls
    let exchangeCallCount = 0;

    // Mock fetch for token exchange
    mockFetch.mockImplementation(async (url) => {
      if (url.includes("/auth/cli/exchange")) {
        exchangeCallCount++;
        const newExpiresAt = Math.floor(Date.now() / 1000) + 3600;
        return {
          ok: true,
          status: 200,
          headers: new Map(),
          text: async () =>
            JSON.stringify({
              access_token: `refreshed-token-${exchangeCallCount}`,
              expires_at: newExpiresAt,
            }),
        };
      }
      return {
        ok: false,
        status: 404,
        headers: new Map(),
        text: async () => JSON.stringify({ error: "Not found" }),
      };
    });

    // First refresh cycle: expired token triggers refresh
    const expiredAt = Math.floor(Date.now() / 1000) - 100;
    const config1 = {
      vibecodr: {
        access_token: "expired-token-1",
        expires_at: expiredAt,
      },
      clerk: {
        access_token: "clerk-token",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      },
    };
    fs.writeFileSync(tempConfigPath, JSON.stringify(config1));

    const result1 = await ensureVibecodrAuth({ configPath: tempConfigPath });

    assert({
      given: "first expired token",
      should: "trigger first refresh",
      actual: exchangeCallCount,
      expected: 1,
    });

    assert({
      given: "first refresh",
      should: "return first refreshed token",
      actual: result1.token,
      expected: "refreshed-token-1",
    });

    // Simulate token expiring again by updating config with expired token
    const config2 = {
      vibecodr: {
        access_token: "expired-token-2",
        expires_at: expiredAt,
      },
      clerk: {
        access_token: "clerk-token",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      },
    };
    fs.writeFileSync(tempConfigPath, JSON.stringify(config2));

    // Second refresh cycle should work (lock was released)
    const result2 = await ensureVibecodrAuth({ configPath: tempConfigPath });

    assert({
      given: "second expired token after first refresh completed",
      should: "trigger second refresh (lock released)",
      actual: exchangeCallCount,
      expected: 2,
    });

    assert({
      given: "second refresh",
      should: "return second refreshed token",
      actual: result2.token,
      expected: "refreshed-token-2",
    });
  });

  test("releases lock even if refresh fails", async () => {
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });

    let exchangeCallCount = 0;

    // Mock fetch to fail first, succeed second
    mockFetch.mockImplementation(async (url) => {
      if (url.includes("/auth/cli/exchange")) {
        exchangeCallCount++;
        if (exchangeCallCount === 1) {
          // First call fails
          return {
            ok: false,
            status: 500,
            headers: new Map(),
            text: async () => JSON.stringify({ error: "Server error" }),
          };
        }
        // Second call succeeds
        return {
          ok: true,
          status: 200,
          headers: new Map(),
          text: async () =>
            JSON.stringify({
              access_token: "success-after-failure",
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            }),
        };
      }
      return {
        ok: false,
        status: 404,
        headers: new Map(),
        text: async () => JSON.stringify({ error: "Not found" }),
      };
    });

    // Config with expired vibecodr token, valid clerk token, but no refresh token
    // This ensures only the exchange is attempted (not clerk refresh)
    const expiredAt = Math.floor(Date.now() / 1000) - 100;
    const config = {
      vibecodr: {
        access_token: "expired-token",
        expires_at: expiredAt,
      },
      clerk: {
        access_token: "clerk-token",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      },
      // No refresh_token means it will fail without attempting clerk refresh
    };
    fs.writeFileSync(tempConfigPath, JSON.stringify(config));

    // First call should fail
    let error1;
    try {
      await ensureVibecodrAuth({ configPath: tempConfigPath });
    } catch (e) {
      error1 = e;
    }

    assert({
      given: "first refresh attempt that fails",
      should: "throw an error",
      actual: error1 !== undefined,
      expected: true,
    });

    assert({
      given: "first refresh attempt",
      should: "have called exchange once",
      actual: exchangeCallCount,
      expected: 1,
    });

    // Second call should be able to try again (lock released on failure)
    const result2 = await ensureVibecodrAuth({ configPath: tempConfigPath });

    assert({
      given: "second refresh attempt after first failure",
      should: "be able to try again (lock released)",
      actual: exchangeCallCount,
      expected: 2,
    });

    assert({
      given: "second successful refresh",
      should: "return the token",
      actual: result2.token,
      expected: "success-after-failure",
    });
  });

  test("all concurrent callers receive same error when refresh fails", async () => {
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });

    let exchangeCallCount = 0;

    // Mock fetch to fail with delay
    mockFetch.mockImplementation(async (url) => {
      if (url.includes("/auth/cli/exchange")) {
        exchangeCallCount++;
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {
          ok: false,
          status: 500,
          headers: new Map(),
          text: async () => JSON.stringify({ error: "Server error" }),
        };
      }
      return {
        ok: false,
        status: 404,
        headers: new Map(),
        text: async () => JSON.stringify({ error: "Not found" }),
      };
    });

    const expiredAt = Math.floor(Date.now() / 1000) - 100;
    const config = {
      vibecodr: {
        access_token: "expired-token",
        expires_at: expiredAt,
      },
      clerk: {
        access_token: "clerk-token",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      },
    };
    fs.writeFileSync(tempConfigPath, JSON.stringify(config));

    // Trigger two concurrent operations
    const operation1 = ensureVibecodrAuth({ configPath: tempConfigPath }).catch(
      (e) => e,
    );
    const operation2 = ensureVibecodrAuth({ configPath: tempConfigPath }).catch(
      (e) => e,
    );

    const [error1, error2] = await Promise.all([operation1, operation2]);

    // Both should receive errors (same rejection)
    assert({
      given: "two concurrent operations when refresh fails",
      should: "only call exchange once (mutex working)",
      actual: exchangeCallCount,
      expected: 1,
    });

    assert({
      given: "two concurrent operations when refresh fails",
      should: "both receive errors",
      actual: error1 instanceof Error && error2 instanceof Error,
      expected: true,
    });

    // Both should receive the same error (same promise rejection)
    assert({
      given: "two concurrent operations receiving same rejection",
      should: "have same error message",
      actual: error1.message === error2.message,
      expected: true,
    });
  });
});

// =============================================================================
// Windows File Permission Tests (Security)
// =============================================================================

describe("Windows file permissions - setWindowsFilePermissions", () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    mockExecSync.mockReset();
    mockExecSync.mockImplementation(() => {});
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
  });

  test("calls icacls with correct arguments for file permissions", () => {
    const result = _testOnly.setWindowsFilePermissions(
      "C:\\Users\\test\\vibecodr\\cli.json",
    );

    assert({
      given: "a file path",
      should: "return success true",
      actual: result.success,
      expected: true,
    });

    assert({
      given: "a file path",
      should: "call execSync with icacls command",
      actual: mockExecSync.mock.calls.length,
      expected: 1,
    });

    const command = mockExecSync.mock.calls[0][0];
    assert({
      given: "a file path",
      should: "include /inheritance:r to remove inherited permissions",
      actual: command.includes("/inheritance:r"),
      expected: true,
    });

    assert({
      given: "a file path",
      should: "include /grant:r to replace permissions",
      actual: command.includes("/grant:r"),
      expected: true,
    });

    assert({
      given: "a file path",
      should: "include %USERNAME%:(F) for full control",
      actual: command.includes('"%USERNAME%:(F)"'),
      expected: true,
    });

    assert({
      given: "a file path",
      should: "include the file path in the command",
      actual: command.includes("C:\\Users\\test\\vibecodr\\cli.json"),
      expected: true,
    });
  });

  test("returns warning when icacls fails", () => {
    // Mock execSync to throw an error
    mockExecSync.mockImplementation(() => {
      throw new Error("Access denied");
    });

    const result = _testOnly.setWindowsFilePermissions(
      "C:\\Users\\test\\vibecodr\\cli.json",
    );

    assert({
      given: "icacls command that fails",
      should: "return success false",
      actual: result.success,
      expected: false,
    });

    assert({
      given: "icacls command that fails",
      should: "return a warning message",
      actual: typeof result.warning === "string" && result.warning.length > 0,
      expected: true,
    });

    assert({
      given: "icacls command that fails",
      should: "include manual instructions in warning",
      actual: result.warning.includes("icacls"),
      expected: true,
    });
  });

  test("uses windowsHide option to suppress command window", () => {
    _testOnly.setWindowsFilePermissions("C:\\test\\file.json");

    const options = mockExecSync.mock.calls[0][1];
    assert({
      given: "icacls execution",
      should: "use windowsHide: true to prevent command window popup",
      actual: options.windowsHide,
      expected: true,
    });

    assert({
      given: "icacls execution",
      should: "use stdio: ignore to suppress output",
      actual: options.stdio,
      expected: "ignore",
    });
  });
});

describe("Windows directory permissions - setWindowsDirectoryPermissions", () => {
  beforeEach(() => {
    mockExecSync.mockReset();
    mockExecSync.mockImplementation(() => {});
  });

  test("calls icacls with inheritance flags for directory", () => {
    const result = _testOnly.setWindowsDirectoryPermissions(
      "C:\\Users\\test\\vibecodr",
    );

    assert({
      given: "a directory path",
      should: "return success true",
      actual: result.success,
      expected: true,
    });

    const command = mockExecSync.mock.calls[0][0];
    assert({
      given: "a directory path",
      should: "include (OI) for object inherit",
      actual: command.includes("(OI)"),
      expected: true,
    });

    assert({
      given: "a directory path",
      should: "include (CI) for container inherit",
      actual: command.includes("(CI)"),
      expected: true,
    });

    assert({
      given: "a directory path",
      should: "include (F) for full control",
      actual: command.includes("(F)"),
      expected: true,
    });
  });

  test("returns success false when icacls fails", () => {
    mockExecSync.mockImplementation(() => {
      throw new Error("Permission denied");
    });

    const result = _testOnly.setWindowsDirectoryPermissions(
      "C:\\Users\\test\\vibecodr",
    );

    assert({
      given: "icacls command that fails on directory",
      should: "return success false",
      actual: result.success,
      expected: false,
    });

    // Directory permissions don't return a warning (secondary security measure)
    assert({
      given: "icacls command that fails on directory",
      should: "not include a warning (fails silently)",
      actual: result.warning,
      expected: undefined,
    });
  });
});

describe("Windows permissions integration - writeConfig flow", () => {
  let tempDir;
  let tempConfigPath;
  const originalPlatform = process.platform;
  let mockFetch;
  let originalFetch;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vibe-auth-win-test-"));
    tempConfigPath = path.join(tempDir, "vibecodr", "cli.json");
    mockExecSync.mockReset();
    mockExecSync.mockImplementation(() => {});

    originalFetch = global.fetch;
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    Object.defineProperty(process, "platform", { value: originalPlatform });
    global.fetch = originalFetch;
  });

  test("icacls is called when refreshVibecodrToken writes config on Windows", async () => {
    // Mock Windows platform
    Object.defineProperty(process, "platform", { value: "win32" });

    // Setup config with valid clerk token
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });
    const testConfig = {
      clerk: {
        access_token: "clerk-token",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      },
    };
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig));

    // Mock successful token exchange
    const newExpiresAt = Math.floor(Date.now() / 1000) + 3600;
    mockFetch.mockImplementation(async (url) => {
      if (url.includes("/auth/cli/exchange")) {
        return {
          ok: true,
          status: 200,
          headers: new Map(),
          text: async () =>
            JSON.stringify({
              access_token: "new-vibecodr-token",
              expires_at: newExpiresAt,
            }),
        };
      }
      return {
        ok: false,
        status: 404,
        headers: new Map(),
        text: async () => JSON.stringify({ error: "Not found" }),
      };
    });

    await refreshVibecodrToken({ configPath: tempConfigPath });

    // Verify icacls was called for the config file
    const icaclsCalls = mockExecSync.mock.calls.filter((call) =>
      call[0].includes("icacls"),
    );

    assert({
      given: "refreshVibecodrToken on Windows",
      should: "call icacls to secure the config file",
      actual: icaclsCalls.length >= 1,
      expected: true,
    });

    // Verify the command targets the config file
    const filePermissionCall = icaclsCalls.find(
      (call) => call[0].includes("cli.json") && !call[0].includes("(OI)"),
    );
    assert({
      given: "refreshVibecodrToken on Windows",
      should: "call icacls for the config file specifically",
      actual: filePermissionCall !== undefined,
      expected: true,
    });
  });

  test("config is written successfully even if icacls fails", async () => {
    // Mock Windows platform
    Object.defineProperty(process, "platform", { value: "win32" });

    // Mock execSync to fail
    mockExecSync.mockImplementation(() => {
      throw new Error("Access denied");
    });

    // Capture stderr warnings
    const stderrWrites = [];
    const originalStderrWrite = process.stderr.write;
    process.stderr.write = (msg) => {
      stderrWrites.push(msg);
      return true;
    };

    // Setup config
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });
    const testConfig = {
      clerk: {
        access_token: "clerk-token",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      },
    };
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig));

    // Mock successful token exchange
    mockFetch.mockImplementation(async (url) => {
      if (url.includes("/auth/cli/exchange")) {
        return {
          ok: true,
          status: 200,
          headers: new Map(),
          text: async () =>
            JSON.stringify({
              access_token: "new-token",
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            }),
        };
      }
      return {
        ok: false,
        status: 404,
        headers: new Map(),
        text: async () => JSON.stringify({ error: "Not found" }),
      };
    });

    try {
      const result = await refreshVibecodrToken({ configPath: tempConfigPath });

      // Should succeed despite icacls failure
      assert({
        given: "icacls failure on Windows",
        should: "still return the token (write succeeded)",
        actual: result.token,
        expected: "new-token",
      });

      // Config file should exist
      assert({
        given: "icacls failure on Windows",
        should: "still write the config file",
        actual: fs.existsSync(tempConfigPath),
        expected: true,
      });

      // Should emit warning
      const hasWarning = stderrWrites.some(
        (msg) => msg.includes("Warning") && msg.includes("icacls"),
      );
      assert({
        given: "icacls failure on Windows",
        should: "emit a warning to stderr",
        actual: hasWarning,
        expected: true,
      });
    } finally {
      process.stderr.write = originalStderrWrite;
    }
  });

  test("icacls is NOT called on Unix platforms", async () => {
    // Mock Unix platform
    Object.defineProperty(process, "platform", { value: "linux" });

    // Setup config
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });
    const testConfig = {
      clerk: {
        access_token: "clerk-token",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      },
    };
    // Write config with proper permissions for Unix mode check
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig), {
      mode: 0o600,
    });

    // Mock fs.statSync to return Unix-like mode for permission check
    // This is needed because we're simulating Unix on Windows
    const originalStatSync = fs.statSync;
    vi.spyOn(fs, "statSync").mockImplementation((filePath) => {
      // For our test config file, return Unix-style secure permissions
      if (filePath === tempConfigPath) {
        return { mode: 0o100600 }; // regular file + 0600 permissions
      }
      // For other files, use real implementation
      return originalStatSync(filePath);
    });

    // Mock successful token exchange
    mockFetch.mockImplementation(async (url) => {
      if (url.includes("/auth/cli/exchange")) {
        return {
          ok: true,
          status: 200,
          headers: new Map(),
          text: async () =>
            JSON.stringify({
              access_token: "new-token",
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            }),
        };
      }
      return {
        ok: false,
        status: 404,
        headers: new Map(),
        text: async () => JSON.stringify({ error: "Not found" }),
      };
    });

    await refreshVibecodrToken({ configPath: tempConfigPath });

    // Verify icacls was NOT called
    const icaclsCalls = mockExecSync.mock.calls.filter((call) =>
      call[0].includes("icacls"),
    );

    assert({
      given: "refreshVibecodrToken on Unix",
      should: "NOT call icacls",
      actual: icaclsCalls.length,
      expected: 0,
    });
  });
});

// =============================================================================
// Windows Permission Detection Tests (checkWindowsPermissions)
// =============================================================================

describe("Windows permission detection - checkWindowsPermissions", () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    mockExecSync.mockReset();
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
  });

  test("detects Everyone group with read access", () => {
    // Mock icacls output with Everyone having read permissions
    mockExecSync.mockReturnValue(
      "C:\\Users\\test\\vibecodr\\cli.json NT AUTHORITY\\SYSTEM:(F)\n" +
        "                                   BUILTIN\\Administrators:(F)\n" +
        "                                   Everyone:(R)\n" +
        "                                   TEST-PC\\testuser:(F)\n",
    );

    const result = _testOnly.checkWindowsPermissions(
      "C:\\Users\\test\\vibecodr\\cli.json",
    );

    assert({
      given: "icacls output with Everyone read access",
      should: "return secure false",
      actual: result.secure,
      expected: false,
    });

    assert({
      given: "icacls output with Everyone read access",
      should: "include details about insecure entry",
      actual: result.details?.includes("Everyone:"),
      expected: true,
    });
  });

  test("detects BUILTIN\\Users group with read access", () => {
    mockExecSync.mockReturnValue(
      "C:\\Users\\test\\vibecodr\\cli.json NT AUTHORITY\\SYSTEM:(F)\n" +
        "                                   BUILTIN\\Administrators:(F)\n" +
        "                                   BUILTIN\\Users:(R)\n" +
        "                                   TEST-PC\\testuser:(F)\n",
    );

    const result = _testOnly.checkWindowsPermissions(
      "C:\\Users\\test\\vibecodr\\cli.json",
    );

    assert({
      given: "icacls output with BUILTIN\\Users read access",
      should: "return secure false",
      actual: result.secure,
      expected: false,
    });

    assert({
      given: "icacls output with BUILTIN\\Users",
      should: "include details about insecure entry",
      actual: result.details?.includes("BUILTIN\\Users:"),
      expected: true,
    });
  });

  test("detects NT AUTHORITY\\Authenticated Users with access", () => {
    mockExecSync.mockReturnValue(
      "C:\\Users\\test\\vibecodr\\cli.json NT AUTHORITY\\SYSTEM:(F)\n" +
        "                                   NT AUTHORITY\\Authenticated Users:(R)\n" +
        "                                   TEST-PC\\testuser:(F)\n",
    );

    const result = _testOnly.checkWindowsPermissions(
      "C:\\Users\\test\\vibecodr\\cli.json",
    );

    assert({
      given: "icacls output with Authenticated Users",
      should: "return secure false",
      actual: result.secure,
      expected: false,
    });

    assert({
      given: "icacls output with Authenticated Users",
      should: "include details about insecure entry",
      actual: result.details?.includes("NT AUTHORITY\\Authenticated Users:"),
      expected: true,
    });
  });

  test("returns secure true for properly restricted file", () => {
    // Mock icacls output with only owner access
    mockExecSync.mockReturnValue(
      "C:\\Users\\test\\vibecodr\\cli.json NT AUTHORITY\\SYSTEM:(F)\n" +
        "                                   BUILTIN\\Administrators:(F)\n" +
        "                                   TEST-PC\\testuser:(F)\n",
    );

    const result = _testOnly.checkWindowsPermissions(
      "C:\\Users\\test\\vibecodr\\cli.json",
    );

    assert({
      given: "icacls output with only owner/system access",
      should: "return secure true",
      actual: result.secure,
      expected: true,
    });

    assert({
      given: "secure file",
      should: "not include details field",
      actual: result.details,
      expected: undefined,
    });
  });

  test("handles icacls failure gracefully", () => {
    // Mock execSync to throw error
    mockExecSync.mockImplementation(() => {
      throw new Error("Access denied");
    });

    const result = _testOnly.checkWindowsPermissions(
      "C:\\Users\\test\\vibecodr\\cli.json",
    );

    // Should assume secure to avoid blocking legitimate usage
    assert({
      given: "icacls command that fails",
      should: "return secure true (assume secure on verification failure)",
      actual: result.secure,
      expected: true,
    });

    assert({
      given: "icacls command that fails",
      should: "return a warning message",
      actual: typeof result.warning === "string" && result.warning.length > 0,
      expected: true,
    });
  });

  test("is case-insensitive when detecting Everyone", () => {
    mockExecSync.mockReturnValue(
      "C:\\Users\\test\\vibecodr\\cli.json everyone:(R)\n" +
        "                                   TEST-PC\\testuser:(F)\n",
    );

    const result = _testOnly.checkWindowsPermissions(
      "C:\\Users\\test\\vibecodr\\cli.json",
    );

    assert({
      given: "icacls output with lowercase 'everyone'",
      should: "detect insecure permissions (case-insensitive)",
      actual: result.secure,
      expected: false,
    });
  });

  test("detects multiple insecure entries", () => {
    mockExecSync.mockReturnValue(
      "C:\\Users\\test\\vibecodr\\cli.json Everyone:(R)\n" +
        "                                   BUILTIN\\Users:(R)\n" +
        "                                   NT AUTHORITY\\Authenticated Users:(R)\n" +
        "                                   TEST-PC\\testuser:(F)\n",
    );

    const result = _testOnly.checkWindowsPermissions(
      "C:\\Users\\test\\vibecodr\\cli.json",
    );

    assert({
      given: "icacls output with multiple insecure entries",
      should: "return secure false",
      actual: result.secure,
      expected: false,
    });

    // Should include all three insecure entries
    assert({
      given: "multiple insecure entries",
      should: "include Everyone in details",
      actual: result.details?.includes("Everyone:"),
      expected: true,
    });

    assert({
      given: "multiple insecure entries",
      should: "include BUILTIN\\Users in details",
      actual: result.details?.includes("BUILTIN\\Users:"),
      expected: true,
    });

    assert({
      given: "multiple insecure entries",
      should: "include Authenticated Users in details",
      actual: result.details?.includes("NT AUTHORITY\\Authenticated Users:"),
      expected: true,
    });
  });
});

// =============================================================================
// Windows Permission Remediation Tests (fixWindowsPermissions)
// =============================================================================

describe("Windows permission remediation - fixWindowsPermissions", () => {
  beforeEach(() => {
    mockExecSync.mockReset();
    mockExecSync.mockImplementation(() => {});
  });

  test("calls icacls with correct command", () => {
    const result = fixWindowsPermissions("C:\\Users\\test\\vibecodr\\cli.json");

    assert({
      given: "a file path",
      should: "return success true",
      actual: result.success,
      expected: true,
    });

    assert({
      given: "a file path",
      should: "call execSync once",
      actual: mockExecSync.mock.calls.length,
      expected: 1,
    });

    const command = mockExecSync.mock.calls[0][0];
    assert({
      given: "fixWindowsPermissions call",
      should: "include /inheritance:r to remove inherited permissions",
      actual: command.includes("/inheritance:r"),
      expected: true,
    });

    assert({
      given: "fixWindowsPermissions call",
      should: "include /grant:r to replace permissions",
      actual: command.includes("/grant:r"),
      expected: true,
    });

    assert({
      given: "fixWindowsPermissions call",
      should: "include %USERNAME%:(F) for full control",
      actual: command.includes('"%USERNAME%:(F)"'),
      expected: true,
    });
  });

  test("returns command that was run", () => {
    const result = fixWindowsPermissions("C:\\test\\file.json");

    assert({
      given: "successful fix",
      should: "return the command that was run",
      actual: result.commandRun?.includes("icacls"),
      expected: true,
    });

    assert({
      given: "successful fix",
      should: "include the file path in command",
      actual: result.commandRun?.includes("C:\\test\\file.json"),
      expected: true,
    });
  });

  test("handles icacls failure gracefully", () => {
    mockExecSync.mockImplementation(() => {
      throw new Error("Access denied");
    });

    const result = fixWindowsPermissions("C:\\test\\file.json");

    assert({
      given: "icacls command that fails",
      should: "return success false",
      actual: result.success,
      expected: false,
    });

    assert({
      given: "icacls command that fails",
      should: "return a warning message",
      actual: typeof result.warning === "string" && result.warning.length > 0,
      expected: true,
    });

    assert({
      given: "icacls failure",
      should: "include manual fix instructions in warning",
      actual: result.warning?.includes("icacls"),
      expected: true,
    });

    assert({
      given: "icacls failure",
      should: "still return the command that was attempted",
      actual: result.commandRun?.includes("icacls"),
      expected: true,
    });
  });

  test("logs command when verbose=true", () => {
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(" "));

    try {
      fixWindowsPermissions("C:\\test\\file.json", { verbose: true });

      assert({
        given: "verbose=true option",
        should: "log the icacls command being run",
        actual: logs.some(
          (log) => log.includes("Running:") && log.includes("icacls"),
        ),
        expected: true,
      });

      assert({
        given: "successful fix with verbose=true",
        should: "log success message",
        actual: logs.some((log) => log.includes("Successfully secured")),
        expected: true,
      });
    } finally {
      console.log = originalLog;
    }
  });

  test("does not log when verbose=false (default)", () => {
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(" "));

    try {
      fixWindowsPermissions("C:\\test\\file.json");

      assert({
        given: "default verbose=false",
        should: "not log any messages",
        actual: logs.length,
        expected: 0,
      });
    } finally {
      console.log = originalLog;
    }
  });

  test("uses windowsHide option to suppress command window", () => {
    fixWindowsPermissions("C:\\test\\file.json");

    const options = mockExecSync.mock.calls[0][1];
    assert({
      given: "fixWindowsPermissions execution",
      should: "use windowsHide: true to prevent command window popup",
      actual: options.windowsHide,
      expected: true,
    });
  });

  test("uses inherit stdio when verbose=true", () => {
    fixWindowsPermissions("C:\\test\\file.json", { verbose: true });

    const options = mockExecSync.mock.calls[0][1];
    assert({
      given: "verbose=true option",
      should: "use stdio: inherit to show command output",
      actual: options.stdio,
      expected: "inherit",
    });
  });

  test("uses ignore stdio when verbose=false", () => {
    fixWindowsPermissions("C:\\test\\file.json", { verbose: false });

    const options = mockExecSync.mock.calls[0][1];
    assert({
      given: "verbose=false option",
      should: "use stdio: ignore to suppress output",
      actual: options.stdio,
      expected: "ignore",
    });
  });
});

// =============================================================================
// Windows Permission Detection Integration Tests
// =============================================================================

describe("Windows permission detection - integration with verifyFilePermissions", () => {
  let tempDir;
  let tempConfigPath;
  const originalPlatform = process.platform;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vibe-win-perm-test-"));
    tempConfigPath = path.join(tempDir, "vibecodr", "cli.json");
    mockExecSync.mockReset();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    Object.defineProperty(process, "platform", { value: originalPlatform });
  });

  test("throws CONFIG_READ_ERROR when Windows file has Everyone access", async () => {
    // Mock Windows platform
    Object.defineProperty(process, "platform", { value: "win32" });

    // Create config file
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });
    const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
    const testConfig = {
      vibecodr: {
        access_token: "test-token",
        expires_at: futureExpiry,
      },
    };
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig));

    // Mock icacls to report Everyone has access
    mockExecSync.mockReturnValue(
      `${tempConfigPath} Everyone:(R)\n` +
        `                  TEST-PC\\testuser:(F)\n`,
    );

    let error;
    try {
      await ensureVibecodrAuth({ configPath: tempConfigPath });
    } catch (e) {
      error = e;
    }

    assert({
      given: "Windows config file with Everyone read access",
      should: "throw CONFIG_READ_ERROR",
      actual: error?.cause?.code,
      expected: "CONFIG_READ_ERROR",
    });

    assert({
      given: "Windows config with insecure permissions",
      should: "include 'insecure Windows permissions' in message",
      actual: error?.message?.includes("insecure Windows permissions"),
      expected: true,
    });

    assert({
      given: "Windows config with insecure permissions",
      should: "include Everyone in error message",
      actual: error?.message?.includes("Everyone:"),
      expected: true,
    });

    assert({
      given: "Windows config with insecure permissions",
      should: "include fix instructions in message",
      actual: error?.message?.includes("To fix"),
      expected: true,
    });

    assert({
      given: "Windows config with insecure permissions",
      should: "mention fixWindowsPermissions in message",
      actual: error?.message?.includes("fixWindowsPermissions"),
      expected: true,
    });
  });

  test("allows reading config when Windows permissions are secure", async () => {
    // Mock Windows platform
    Object.defineProperty(process, "platform", { value: "win32" });

    // Create config file
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });
    const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
    const testConfig = {
      vibecodr: {
        access_token: "secure-token",
        expires_at: futureExpiry,
      },
    };
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig));

    // Mock icacls to report secure permissions (no Everyone/Users)
    mockExecSync.mockReturnValue(
      `${tempConfigPath} NT AUTHORITY\\SYSTEM:(F)\n` +
        `                  TEST-PC\\testuser:(F)\n`,
    );

    const result = await ensureVibecodrAuth({ configPath: tempConfigPath });

    assert({
      given: "Windows config with secure permissions",
      should: "read successfully and return token",
      actual: result.token,
      expected: "secure-token",
    });
  });

  test("does not block when icacls verification fails", async () => {
    // Mock Windows platform
    Object.defineProperty(process, "platform", { value: "win32" });

    // Create config file
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });
    const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
    const testConfig = {
      vibecodr: {
        access_token: "test-token",
        expires_at: futureExpiry,
      },
    };
    fs.writeFileSync(tempConfigPath, JSON.stringify(testConfig));

    // Mock icacls to fail (e.g., permission denied to query ACLs)
    mockExecSync.mockImplementation(() => {
      throw new Error("Access denied to query ACLs");
    });

    // Should not throw - assumes secure when verification fails
    const result = await ensureVibecodrAuth({ configPath: tempConfigPath });

    assert({
      given: "Windows with icacls verification failure",
      should: "assume secure and return token (graceful degradation)",
      actual: result.token,
      expected: "test-token",
    });
  });
});
