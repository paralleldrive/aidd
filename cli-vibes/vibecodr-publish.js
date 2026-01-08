#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { parseArgs } = require("node:util");

function normalizeOrigin(origin) {
  return origin.replace(/\/+$/, "");
}

function defaultConfigPath() {
  if (process.platform === "win32") {
    const appData = process.env.APPDATA;
    if (appData) return path.join(appData, "vibecodr", "cli.json");
  }
  return path.join(os.homedir(), ".config", "vibecodr", "cli.json");
}

function readJsonFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  return JSON.parse(text);
}

function readConfig(filePath) {
  try {
    return readJsonFile(filePath);
  } catch (err) {
    if (err && typeof err === "object" && err.code === "ENOENT") return null;
    throw err;
  }
}

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function writeConfig(filePath, data) {
  ensureDirForFile(filePath);
  const text = JSON.stringify(data, null, 2) + "\n";
  if (process.platform === "win32") {
    fs.writeFileSync(filePath, text, "utf8");
    return;
  }
  fs.writeFileSync(filePath, text, { encoding: "utf8", mode: 0o600 });
}

/**
 * Fetch JSON with enhanced error handling.
 * Errors include: status, body (parsed JSON if possible), and url for debugging.
 */
async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    const err = new Error(`Expected JSON from ${url} (status=${res.status})`);
    err.cause = text;
    err.status = res.status;
    err.url = url;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} from ${url}`);
    err.cause = json;
    err.status = res.status;
    err.body = json;
    err.url = url;
    throw err;
  }
  return json;
}

/**
 * Check if an error indicates the Clerk token needs refreshing.
 * This can happen when:
 * - HTTP 401 (Unauthorized)
 * - HTTP 400 with hint about "expiring soon"
 * - Error message mentions token expiration
 */
function isLikelyClerkTokenProblem(err) {
  if (!err) return false;

  // Direct 401 means auth failed
  if (err.status === 401) return true;

  // Check error body for expiration hints from the API
  const body = err.body || err.cause;
  if (body && typeof body === "object") {
    // VibeError format: { error: "...", hint: "..." }
    const hint = body.hint || body.message || "";
    if (
      typeof hint === "string" &&
      hint.toLowerCase().includes("expiring soon")
    ) {
      return true;
    }
    // Check errorCode for auth-related errors
    const code = body.errorCode || body.code || body.error;
    if (typeof code === "string" && code.includes("auth.")) {
      return true;
    }
  }

  return false;
}

async function exchangeForVibecodrToken({ apiBase, clerkAccessToken }) {
  const url = `${normalizeOrigin(apiBase)}/auth/cli/exchange`;
  return fetchJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ access_token: clerkAccessToken }),
  });
}

async function discoverOidc(issuer) {
  const url = `${normalizeOrigin(issuer)}/.well-known/openid-configuration`;
  return fetchJson(url, { headers: { Accept: "application/json" } });
}

async function refreshClerkAccessToken({ issuer, clientId, refreshToken }) {
  const oidc = await discoverOidc(issuer);
  const tokenEndpoint = oidc && oidc.token_endpoint;
  if (!tokenEndpoint) {
    throw new Error("Issuer is missing token_endpoint in openid-configuration");
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
}

function usage() {
  const lines = [
    "Vibecodr publish smoke CLI (draft pipeline)",
    "",
    "Publishes a directory of project files (manifest is server-owned):",
    "  1) POST /capsules/empty",
    "  2) PUT /capsules/:id/files/:path (repeat)",
    "  3) POST /capsules/:id/publish",
    "",
    "Options:",
    "  --dir (default: .)",
    "  --title (required unless --manifest provides one)",
    "  --entry (optional; defaults to server default)",
    "  --runner client-static|webcontainer (optional)",
    "  --manifest (optional; used only to infer title/entry/runner)",
    "  --visibility public|unlisted|private (default: public)",
    "  --api-base / VIBECODR_API_BASE (default: from cli.json or https://api.vibecodr.space)",
    "  --player-base / VIBECODR_PLAYER_BASE (default: https://vibecodr.space)",
    "  --config-path / VIBECODR_CLI_CONFIG_PATH (default: platform config path)",
    "  --json (prints JSON receipt)",
    "",
  ];
  process.stderr.write(lines.join("\n") + "\n");
}

function collectFiles(rootDir) {
  const ignoreDirs = new Set([
    ".git",
    "node_modules",
    ".next",
    ".turbo",
    "dist",
    "build",
    "coverage",
    ".cache",
    ".pnpm-store",
  ]);
  const ignoreFiles = new Set(["manifest.json", ".DS_Store"]);

  /** @type {Array<{ absPath: string, relPath: string }>} */
  const files = [];

  /** @param {string} dir */
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (ignoreDirs.has(entry.name)) continue;
        walk(absPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (ignoreFiles.has(entry.name)) continue;

      const relPath = path.relative(rootDir, absPath).replace(/\\/g, "/");
      files.push({ absPath, relPath });
    }
  }

  walk(rootDir);
  files.sort((a, b) => a.relPath.localeCompare(b.relPath));
  return files;
}

async function createEmptyCapsule({ apiBase, token, title, entry, runner }) {
  const url = `${normalizeOrigin(apiBase)}/capsules/empty`;
  const bodyObj = {};
  if (title) bodyObj.title = title;
  if (entry) bodyObj.entry = entry;
  if (runner) bodyObj.runner = runner;
  const body = JSON.stringify(bodyObj);
  const res = await fetchJson(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body,
  });
  if (!res || res.success !== true || typeof res.capsuleId !== "string") {
    throw new Error("Unexpected /capsules/empty response shape");
  }
  return res.capsuleId;
}

async function uploadFile({ apiBase, token, capsuleId, relPath, absPath }) {
  const encodedPath = encodeURIComponent(relPath);
  const url = `${normalizeOrigin(apiBase)}/capsules/${capsuleId}/files/${encodedPath}`;
  const bytes = fs.readFileSync(absPath);
  return fetchJson(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      Accept: "application/json",
    },
    body: bytes,
  });
}

async function publish({ apiBase, token, capsuleId, visibility }) {
  const url = `${normalizeOrigin(apiBase)}/capsules/${capsuleId}/publish`;
  const init = {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  };
  if (visibility && visibility !== "public") {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify({ visibility });
  }
  return fetchJson(url, init);
}

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      dir: { type: "string" },
      title: { type: "string" },
      entry: { type: "string" },
      runner: { type: "string" },
      manifest: { type: "string" },
      visibility: { type: "string" },
      "api-base": { type: "string" },
      "player-base": { type: "string" },
      "config-path": { type: "string" },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });

  if (values.help) {
    usage();
    return;
  }

  const dir = path.resolve(values.dir || process.cwd());
  const manifestPath = values.manifest
    ? path.resolve(values.manifest)
    : path.join(dir, "manifest.json");
  const visibility = values.visibility || "public";
  if (!["public", "unlisted", "private"].includes(visibility)) {
    usage();
    throw new Error("Invalid --visibility (expected public|unlisted|private)");
  }

  const configPath =
    values["config-path"] ||
    process.env.VIBECODR_CLI_CONFIG_PATH ||
    defaultConfigPath();
  const config = readConfig(configPath);
  if (!config) {
    throw new Error(
      `Missing CLI config at ${configPath}; run vibecodr-auth.js login first`,
    );
  }

  const apiBase =
    values["api-base"] ||
    process.env.VIBECODR_API_BASE ||
    config?.api_base ||
    "https://api.vibecodr.space";
  const playerBase =
    values["player-base"] ||
    process.env.VIBECODR_PLAYER_BASE ||
    "https://vibecodr.space";

  let vibecodrToken = config?.vibecodr?.access_token;
  let vibecodrExpiresAt = config?.vibecodr?.expires_at;
  let clerkAccessToken = config?.clerk?.access_token;
  let clerkExpiresAt = config?.clerk?.expires_at;
  let clerkRefreshToken = config?.clerk?.refresh_token;
  const clerkIssuer = config?.issuer;
  const clerkClientId = config?.client_id;

  async function ensureVibecodrToken({ minValidSeconds }) {
    const now = Math.floor(Date.now() / 1000);
    if (
      typeof vibecodrExpiresAt === "number" &&
      vibecodrExpiresAt - now >= minValidSeconds
    ) {
      return vibecodrToken;
    }

    if (!clerkAccessToken) {
      throw new Error(
        `Missing clerk.access_token in ${configPath}; run vibecodr-auth.js login first`,
      );
    }

    const tryExchange = async () => {
      const vibecodr = await exchangeForVibecodrToken({
        apiBase,
        clerkAccessToken,
      });
      if (
        !vibecodr ||
        typeof vibecodr.access_token !== "string" ||
        typeof vibecodr.expires_at !== "number"
      ) {
        throw new Error("Unexpected /auth/cli/exchange response shape");
      }
      vibecodrToken = vibecodr.access_token;
      vibecodrExpiresAt = vibecodr.expires_at;
      config.vibecodr = vibecodr;
      config.api_base = apiBase;
      config.updated_at = new Date().toISOString();
      writeConfig(configPath, config);
      return vibecodrToken;
    };

    process.stderr.write("Renewing Vibecodr CLI token...\n");

    try {
      return await tryExchange();
    } catch (err) {
      const now2 = Math.floor(Date.now() / 1000);
      // Check if Clerk token is expiring by time OR if the error indicates auth issues
      const clerkExpiringSoon =
        typeof clerkExpiresAt === "number"
          ? clerkExpiresAt - now2 < minValidSeconds
          : false;
      const errorSuggestsRefresh = isLikelyClerkTokenProblem(err);

      // Only attempt refresh if we have a refresh token AND either timing or error suggests it's needed
      if (!clerkRefreshToken) {
        throw err;
      }
      if (!clerkExpiringSoon && !errorSuggestsRefresh) {
        throw err;
      }
      if (!clerkIssuer || !clerkClientId) {
        throw new Error(
          `Clerk access token refresh is not configured; run vibecodr-auth.js login again (${configPath})`,
        );
      }

      process.stderr.write("Refreshing Clerk OAuth token...\n");
      const refreshed = await refreshClerkAccessToken({
        issuer: clerkIssuer,
        clientId: clerkClientId,
        refreshToken: clerkRefreshToken,
      });

      const clerkNewAccessToken = refreshed && refreshed.access_token;
      if (!clerkNewAccessToken) {
        throw new Error("Token endpoint did not return access_token");
      }

      clerkAccessToken = clerkNewAccessToken;
      clerkRefreshToken = refreshed.refresh_token || clerkRefreshToken;
      clerkExpiresAt =
        typeof refreshed.expires_in === "number"
          ? now2 + refreshed.expires_in
          : clerkExpiresAt;

      config.clerk = {
        ...(config.clerk || {}),
        access_token: clerkAccessToken,
        refresh_token: clerkRefreshToken,
        expires_at: clerkExpiresAt,
      };
      config.updated_at = new Date().toISOString();
      writeConfig(configPath, config);

      return await tryExchange();
    }
  }

  /**
   * Wrapper that retries an operation once if it fails with a 401 or auth-related error.
   * This handles the case where the Vibecodr token expires mid-operation.
   */
  async function withAuthRetry(operation) {
    try {
      return await operation();
    } catch (err) {
      // If it looks like an auth problem and we might be able to fix it with a refresh
      if (err && (err.status === 401 || isLikelyClerkTokenProblem(err))) {
        process.stderr.write(
          "Auth error detected, attempting token refresh...\n",
        );
        // Force token refresh by setting expiry to now
        vibecodrExpiresAt = 0;
        vibecodrToken = await ensureVibecodrToken({ minValidSeconds: 120 });
        // Retry the operation once
        return await operation();
      }
      throw err;
    }
  }

  if (!vibecodrToken) {
    throw new Error(
      `Missing vibecodr.access_token in ${configPath}; run vibecodr-auth.js login first`,
    );
  }
  await ensureVibecodrToken({ minValidSeconds: 120 });

  let manifest = null;
  if (fs.existsSync(manifestPath)) {
    manifest = readJsonFile(manifestPath);
  }

  const title =
    values.title ||
    (manifest && typeof manifest.title === "string" && manifest.title.trim()
      ? manifest.title.trim()
      : undefined);
  const entry =
    values.entry ||
    (manifest && typeof manifest.entry === "string" && manifest.entry.trim()
      ? manifest.entry.trim()
      : undefined);
  const runner =
    values.runner ||
    (manifest && typeof manifest.runner === "string" && manifest.runner.trim()
      ? manifest.runner.trim()
      : undefined);

  if (!title) {
    usage();
    throw new Error("Missing --title (required for CLI publishing)");
  }
  if (runner && !["client-static", "webcontainer"].includes(runner)) {
    usage();
    throw new Error("Invalid --runner (expected client-static|webcontainer)");
  }

  process.stderr.write(`Creating capsule...\n`);
  vibecodrToken = await ensureVibecodrToken({ minValidSeconds: 120 });
  const capsuleId = await withAuthRetry(async () => {
    return createEmptyCapsule({
      apiBase,
      token: vibecodrToken,
      title,
      entry,
      runner,
    });
  });

  const files = collectFiles(dir);
  process.stderr.write(`Uploading ${files.length} file(s)...\n`);
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    process.stderr.write(`  [${i + 1}/${files.length}] ${f.relPath}\n`);
    vibecodrToken = await ensureVibecodrToken({ minValidSeconds: 120 });
    await withAuthRetry(async () => {
      return uploadFile({
        apiBase,
        token: vibecodrToken,
        capsuleId,
        relPath: f.relPath,
        absPath: f.absPath,
      });
    });
  }

  process.stderr.write(`Publishing...\n`);
  vibecodrToken = await ensureVibecodrToken({ minValidSeconds: 120 });
  const published = await withAuthRetry(async () => {
    return publish({ apiBase, token: vibecodrToken, capsuleId, visibility });
  });
  const postId = published?.postId;
  if (typeof postId !== "string" || !postId) {
    throw new Error(
      "Unexpected /capsules/:id/publish response shape (missing postId)",
    );
  }

  const url = `${normalizeOrigin(playerBase)}/player/${postId}`;
  const receipt = { postId, capsuleId, url };
  if (values.json) {
    process.stdout.write(JSON.stringify(receipt) + "\n");
    return;
  }
  process.stdout.write(url + "\n");
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Error: ${message}\n`);
  process.exitCode = 1;
});
