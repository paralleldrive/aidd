#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { parseArgs } = require("node:util");
const { spawn } = require("node:child_process");

const DEFAULT_CLERK_OAUTH_CLIENT_ID = "g3NwTqUg7nRzHeHo";

function base64Url(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sha256Base64Url(value) {
  return base64Url(crypto.createHash("sha256").update(value).digest());
}

function normalizeOrigin(origin) {
  return origin.replace(/\/+$/, "");
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    const err = new Error(`Expected JSON from ${url} (status=${res.status})`);
    err.cause = text;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} from ${url}`);
    err.cause = json;
    throw err;
  }
  return json;
}

function openBrowser(url) {
  const platform = process.platform;
  if (platform === "win32") {
    spawn("cmd.exe", ["/c", "start", '""', url], {
      stdio: "ignore",
      detached: true,
    }).unref();
    return;
  }
  if (platform === "darwin") {
    spawn("open", [url], { stdio: "ignore", detached: true }).unref();
    return;
  }
  spawn("xdg-open", [url], { stdio: "ignore", detached: true }).unref();
}

function defaultConfigPath() {
  if (process.platform === "win32") {
    const appData = process.env.APPDATA;
    if (appData) return path.join(appData, "vibecodr", "cli.json");
  }
  return path.join(os.homedir(), ".config", "vibecodr", "cli.json");
}

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function readConfig(filePath) {
  try {
    const text = fs.readFileSync(filePath, "utf8");
    return JSON.parse(text);
  } catch (err) {
    if (err && typeof err === "object" && err.code === "ENOENT") return null;
    throw err;
  }
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

async function waitForOauthCode({
  redirectPort,
  redirectPath,
  expectedState,
  timeoutMs,
}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url || "/", `http://localhost:${redirectPort}`);
        if (url.pathname !== redirectPath) {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Not found");
          return;
        }
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");
        const errorDescription = url.searchParams.get("error_description");

        if (error) {
          res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
          res.end(
            `OAuth error: ${error}${errorDescription ? `\n${errorDescription}` : ""}`,
          );
          reject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (!code || !state) {
          res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Missing code/state");
          reject(new Error("Missing code/state"));
          return;
        }
        if (state !== expectedState) {
          res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("State mismatch");
          reject(new Error("State mismatch"));
          return;
        }

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(
          "<!doctype html><html><body><h1>Vibecodr CLI authenticated</h1><p>You can close this window.</p></body></html>",
        );
        resolve({ code });
      } catch (err) {
        reject(err);
      } finally {
        server.close();
      }
    });

    server.on("error", reject);

    server.listen(redirectPort, "127.0.0.1", () => {
      // noop
    });

    const timeout = setTimeout(() => {
      try {
        server.close();
      } finally {
        reject(new Error("Timed out waiting for OAuth callback"));
      }
    }, timeoutMs);
    timeout.unref?.();
  });
}

async function exchangeAuthorizationCode({
  tokenEndpoint,
  clientId,
  redirectUri,
  codeVerifier,
  code,
}) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
    code_verifier: codeVerifier,
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

async function refreshAccessToken({ tokenEndpoint, clientId, refreshToken }) {
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

function usage() {
  const lines = [
    "Vibecodr CLI auth (OAuth + PKCE + localhost callback)",
    "",
    "Commands:",
    "  vibecodr-auth.js login     Interactive browser login (default)",
    "  vibecodr-auth.js refresh   Refresh using stored refresh_token",
    "",
    "Optional env/args:",
    `  --client-id / VIBECODR_CLERK_OAUTH_CLIENT_ID (default: ${DEFAULT_CLERK_OAUTH_CLIENT_ID})`,
    "  --issuer / VIBECODR_CLERK_ISSUER (default: https://clerk.vibecodr.space)",
    "  --api-base / VIBECODR_API_BASE (default: https://api.vibecodr.space)",
    "  --redirect-port (default: 3000)",
    "  --redirect-path (default: /oauth_callback)",
    "  --scopes / VIBECODR_OAUTH_SCOPES (default: openid profile email)",
    "  --config-path / VIBECODR_CLI_CONFIG_PATH",
    "  --no-browser (prints URL instead of opening browser)",
    "  --json (prints JSON receipt; does NOT print tokens unless --print-token)",
    "  --print-token (prints Vibecodr access token in JSON output)",
    "",
  ];
  process.stderr.write(lines.join("\n") + "\n");
}

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      issuer: { type: "string" },
      "client-id": { type: "string" },
      "api-base": { type: "string" },
      "redirect-port": { type: "string" },
      "redirect-path": { type: "string" },
      scopes: { type: "string" },
      "config-path": { type: "string" },
      "no-browser": { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      "print-token": { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });

  if (values.help) {
    usage();
    return;
  }

  const command = positionals[0] || "login";
  const configPath =
    values["config-path"] ||
    process.env.VIBECODR_CLI_CONFIG_PATH ||
    defaultConfigPath();
  const issuer = normalizeOrigin(
    values.issuer ||
      process.env.VIBECODR_CLERK_ISSUER ||
      "https://clerk.vibecodr.space",
  );
  const apiBase =
    values["api-base"] ||
    process.env.VIBECODR_API_BASE ||
    "https://api.vibecodr.space";
  const clientId =
    values["client-id"] ||
    process.env.VIBECODR_CLERK_OAUTH_CLIENT_ID ||
    DEFAULT_CLERK_OAUTH_CLIENT_ID;
  const redirectPort = parseInt(
    values["redirect-port"] ||
      process.env.VIBECODR_OAUTH_REDIRECT_PORT ||
      "3000",
    10,
  );
  const redirectPath =
    values["redirect-path"] ||
    process.env.VIBECODR_OAUTH_REDIRECT_PATH ||
    "/oauth_callback";
  const scopes =
    values.scopes ||
    process.env.VIBECODR_OAUTH_SCOPES ||
    "openid profile email";

  if (
    !Number.isFinite(redirectPort) ||
    redirectPort <= 0 ||
    redirectPort > 65535
  ) {
    throw new Error("Invalid --redirect-port");
  }

  const redirectUri = `http://localhost:${redirectPort}${redirectPath}`;
  const oidc = await fetchJson(`${issuer}/.well-known/openid-configuration`);
  const authorizationEndpoint = oidc.authorization_endpoint;
  const tokenEndpoint = oidc.token_endpoint;
  if (!authorizationEndpoint || !tokenEndpoint) {
    throw new Error(
      "Issuer is missing OAuth endpoints in openid-configuration",
    );
  }

  if (command === "refresh") {
    const existing = readConfig(configPath);
    if (!existing?.clerk?.refresh_token) {
      throw new Error(`No refresh_token in ${configPath}; run login first`);
    }

    const refreshed = await refreshAccessToken({
      tokenEndpoint,
      clientId,
      refreshToken: existing.clerk.refresh_token,
    });

    const nowSec = Math.floor(Date.now() / 1000);
    const clerkAccessToken = refreshed.access_token;
    const clerkRefreshToken =
      refreshed.refresh_token || existing.clerk.refresh_token;
    const clerkExpiresAt =
      typeof refreshed.expires_in === "number"
        ? nowSec + refreshed.expires_in
        : undefined;

    const vibecodr = await exchangeForVibecodrToken({
      apiBase,
      clerkAccessToken,
    });

    const updated = {
      ...existing,
      issuer,
      api_base: apiBase,
      client_id: clientId,
      redirect_uri: redirectUri,
      scopes: scopes.split(/\s+/).filter(Boolean),
      clerk: {
        ...existing.clerk,
        access_token: clerkAccessToken,
        refresh_token: clerkRefreshToken,
        expires_at: clerkExpiresAt,
      },
      vibecodr: {
        token_type: vibecodr.token_type,
        access_token: vibecodr.access_token,
        expires_at: vibecodr.expires_at,
        user_id: vibecodr.user_id,
      },
      updated_at: new Date().toISOString(),
    };
    writeConfig(configPath, updated);

    const receipt = {
      ok: true,
      command: "refresh",
      user_id: vibecodr.user_id,
      expires_at: vibecodr.expires_at,
      config_path: configPath,
      ...(values["print-token"] ? { access_token: vibecodr.access_token } : {}),
    };

    if (values.json) {
      process.stdout.write(JSON.stringify(receipt) + "\n");
      return;
    }
    process.stdout.write(
      `Refreshed Vibecodr CLI token for ${vibecodr.user_id}\n`,
    );
    process.stdout.write(`Wrote credentials to ${configPath}\n`);
    return;
  }

  if (command !== "login") {
    usage();
    throw new Error(`Unknown command: ${command}`);
  }

  const codeVerifier = base64Url(crypto.randomBytes(32));
  const codeChallenge = sha256Base64Url(codeVerifier);
  const state = base64Url(crypto.randomBytes(16));

  const authUrl = new URL(authorizationEndpoint);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("state", state);

  const urlString = authUrl.toString();
  if (values["no-browser"]) {
    process.stderr.write(urlString + "\n");
  } else {
    openBrowser(urlString);
  }

  const { code } = await waitForOauthCode({
    redirectPort,
    redirectPath,
    expectedState: state,
    timeoutMs: 5 * 60 * 1000,
  });

  const tokenResponse = await exchangeAuthorizationCode({
    tokenEndpoint,
    clientId,
    redirectUri,
    codeVerifier,
    code,
  });

  const nowSec = Math.floor(Date.now() / 1000);
  const clerkAccessToken = tokenResponse.access_token;
  const clerkRefreshToken = tokenResponse.refresh_token;
  const clerkExpiresAt =
    typeof tokenResponse.expires_in === "number"
      ? nowSec + tokenResponse.expires_in
      : undefined;
  if (!clerkAccessToken) {
    throw new Error("Token endpoint did not return access_token");
  }

  const vibecodr = await exchangeForVibecodrToken({
    apiBase,
    clerkAccessToken,
  });

  const data = {
    issuer,
    api_base: apiBase,
    client_id: clientId,
    redirect_uri: redirectUri,
    scopes: scopes.split(/\s+/).filter(Boolean),
    clerk: {
      access_token: clerkAccessToken,
      refresh_token: clerkRefreshToken,
      expires_at: clerkExpiresAt,
    },
    vibecodr: {
      token_type: vibecodr.token_type,
      access_token: vibecodr.access_token,
      expires_at: vibecodr.expires_at,
      user_id: vibecodr.user_id,
    },
    updated_at: new Date().toISOString(),
  };

  writeConfig(configPath, data);

  const receipt = {
    ok: true,
    command: "login",
    user_id: vibecodr.user_id,
    expires_at: vibecodr.expires_at,
    config_path: configPath,
    ...(values["print-token"] ? { access_token: vibecodr.access_token } : {}),
  };

  if (values.json) {
    process.stdout.write(JSON.stringify(receipt) + "\n");
    return;
  }
  process.stdout.write(`Authenticated Vibecodr CLI for ${vibecodr.user_id}\n`);
  process.stdout.write(`Wrote credentials to ${configPath}\n`);
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Error: ${message}\n`);
  process.exitCode = 1;
});
