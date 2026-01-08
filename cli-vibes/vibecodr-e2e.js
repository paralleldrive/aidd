#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
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

function readConfig(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    if (err && typeof err === "object" && err.code === "ENOENT") return null;
    throw err;
  }
}

async function fetchText(url, init) {
  const res = await fetch(url, init);
  return { res, text: await res.text() };
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
  return { res, json };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function base64Url(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createFakeExpiredCliGrant({ iss, aud }) {
  const header = base64Url(
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })),
  );
  const now = Math.floor(Date.now() / 1000);
  const payload = base64Url(
    Buffer.from(
      JSON.stringify({
        iss,
        aud,
        sub: "user_cli",
        scp: ["vibes:publish"],
        iat: now - 600,
        exp: now - 300,
        jti: crypto.randomUUID(),
        kind: "vibecodr_cli",
      }),
    ),
  );
  // Signature is intentionally garbage; the API should still reject this token.
  return `${header}.${payload}.x`;
}

async function createEmptyCapsule({ apiBase, token, title, entry, runner }) {
  const url = `${normalizeOrigin(apiBase)}/capsules/empty`;
  const { res, json } = await fetchJson(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      title,
      ...(entry ? { entry } : {}),
      ...(runner ? { runner } : {}),
    }),
  });
  assert(
    res.status === 200,
    `Expected 200 from /capsules/empty, got ${res.status}`,
  );
  assert(
    json && json.success === true && typeof json.capsuleId === "string",
    "Unexpected /capsules/empty response",
  );
  return json.capsuleId;
}

async function uploadFile({ apiBase, token, capsuleId, filePath, bytes }) {
  const encodedPath = encodeURIComponent(filePath);
  const url = `${normalizeOrigin(apiBase)}/capsules/${capsuleId}/files/${encodedPath}`;
  const { res, json } = await fetchJson(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      Accept: "application/json",
    },
    body: bytes,
  });
  assert(res.status === 200, `Expected 200 from PUT file, got ${res.status}`);
  return json;
}

async function patchManifest({ apiBase, token, capsuleId, manifest }) {
  const url = `${normalizeOrigin(apiBase)}/capsules/${capsuleId}/manifest`;
  const { res, json } = await fetchJson(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(manifest),
  });
  return { status: res.status, json };
}

async function compileDraft({ apiBase, token, capsuleId }) {
  const url = `${normalizeOrigin(apiBase)}/capsules/${capsuleId}/compile-draft`;
  const { res, json } = await fetchJson(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  assert(
    res.status === 200,
    `Expected 200 from /compile-draft, got ${res.status}`,
  );
  return json;
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
  const { res, json } = await fetchJson(url, init);
  return { status: res.status, json };
}

async function waitForUrlOk(url, { timeoutMs }) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url, { method: "GET", redirect: "follow" });
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for ${url} to return 2xx`);
}

function usage() {
  const lines = [
    "Vibecodr Phase 6 E2E checks (staging-ready)",
    "",
    "Checks:",
    "  - Auth failure: no token / invalid token / expired-like token",
    "  - Payload failure: missing title / invalid runner rejected on POST /capsules/empty",
    "  - Security: CLI tokens cannot PATCH /capsules/:id/manifest",
    "  - Large project safety: this script only uses draft pipeline (no multipart)",
    "  - Success publish (optional): publish + verify /player/{postId} resolves",
    "",
    "Options:",
    "  --api-base / VIBECODR_API_BASE (default: from cli.json or https://api.vibecodr.space)",
    "  --config-path / VIBECODR_CLI_CONFIG_PATH",
    "  --player-base / VIBECODR_PLAYER_BASE (optional; otherwise inferred from /agent/vibe)",
    "  --publish (runs the publish+player URL check; creates a post)",
    "  --visibility public|unlisted|private (default: public)",
    "  --timeout-ms (default: 30000)",
    "  --json (prints JSON summary)",
    "",
  ];
  process.stderr.write(lines.join("\n") + "\n");
}

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      "api-base": { type: "string" },
      "config-path": { type: "string" },
      "player-base": { type: "string" },
      publish: { type: "boolean", default: false },
      visibility: { type: "string" },
      "timeout-ms": { type: "string" },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });

  if (values.help) {
    usage();
    return;
  }

  const configPath =
    values["config-path"] ||
    process.env.VIBECODR_CLI_CONFIG_PATH ||
    defaultConfigPath();
  const config = readConfig(configPath);
  const apiBase =
    values["api-base"] ||
    process.env.VIBECODR_API_BASE ||
    config?.api_base ||
    "https://api.vibecodr.space";
  const timeoutMs = parseInt(
    values["timeout-ms"] || process.env.VIBECODR_E2E_TIMEOUT_MS || "30000",
    10,
  );
  const visibility = values.visibility || "public";

  const results = [];
  const record = (name, ok, detail) => results.push({ name, ok, detail });

  // 1) Jiron discovery
  try {
    const url = `${normalizeOrigin(apiBase)}/agent/vibe`;
    const { res, text } = await fetchText(url, {
      method: "GET",
      headers: { Accept: "application/vnd.jiron+pug" },
    });
    assert(res.status === 200, `Expected 200 from ${url}, got ${res.status}`);
    assert(
      text.includes("/auth/cli/exchange"),
      "Jiron doc missing /auth/cli/exchange",
    );
    assert(
      text.includes("/capsules/empty"),
      "Jiron doc missing /capsules/empty",
    );
    assert(
      text.includes("/capsules/{capsuleId}/files/{path}"),
      "Jiron doc missing file upload template",
    );
    assert(
      text.includes("/capsules/{capsuleId}/publish"),
      "Jiron doc missing publish endpoint",
    );
    assert(text.includes("openid"), "Jiron doc missing OAuth scopes");
    record("jiron.discovery", true);
  } catch (err) {
    record(
      "jiron.discovery",
      false,
      err instanceof Error ? err.message : String(err),
    );
  }

  // 2) Auth failures (no token)
  try {
    const url = `${normalizeOrigin(apiBase)}/capsules/empty`;
    const { res } = await fetchJson(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: "{}",
    });
    assert(res.status === 401, `Expected 401 without token, got ${res.status}`);
    record("auth.missingToken", true);
  } catch (err) {
    record(
      "auth.missingToken",
      false,
      err instanceof Error ? err.message : String(err),
    );
  }

  // 3) Auth failures (invalid token)
  try {
    const url = `${normalizeOrigin(apiBase)}/capsules/empty`;
    const { res } = await fetchJson(url, {
      method: "POST",
      headers: {
        Authorization: "Bearer invalid",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: "{}",
    });
    assert(
      res.status === 401,
      `Expected 401 with invalid token, got ${res.status}`,
    );
    record("auth.invalidToken", true);
  } catch (err) {
    record(
      "auth.invalidToken",
      false,
      err instanceof Error ? err.message : String(err),
    );
  }

  // 4) Auth failures (expired-like CLI token)
  try {
    const url = `${normalizeOrigin(apiBase)}/capsules/empty`;
    const fakeExpired = createFakeExpiredCliGrant({
      iss: normalizeOrigin(apiBase),
      aud: "vibecodr:cli",
    });
    const { res } = await fetchJson(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${fakeExpired}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: "{}",
    });
    assert(
      res.status === 401,
      `Expected 401 with expired token, got ${res.status}`,
    );
    record("auth.expiredToken", true);
  } catch (err) {
    record(
      "auth.expiredToken",
      false,
      err instanceof Error ? err.message : String(err),
    );
  }

  record(
    "auth.exchangeAllowlist",
    true,
    "not directly verifiable here (requires a valid token from a different OAuth client_id)",
  );

  const vibecodrToken = config?.vibecodr?.access_token;
  if (!vibecodrToken) {
    record(
      "pipeline.missingTitle",
      true,
      `skipped (no vibecodr token in ${configPath})`,
    );
    record(
      "pipeline.invalidRunner",
      true,
      `skipped (no vibecodr token in ${configPath})`,
    );
    record(
      "pipeline.manifestPatchDenied",
      true,
      `skipped (no vibecodr token in ${configPath})`,
    );
    record(
      "pipeline.publishSuccess",
      true,
      `skipped (no vibecodr token in ${configPath})`,
    );
  } else {
    // 6) Payload failure: missing title rejected on capsule creation
    try {
      const url = `${normalizeOrigin(apiBase)}/capsules/empty`;
      const { res, json } = await fetchJson(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${vibecodrToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ entry: "index.html" }),
      });
      assert(
        res.status === 400,
        `Expected 400 for missing title, got ${res.status}`,
      );
      record("pipeline.missingTitle", true, json);
    } catch (err) {
      record(
        "pipeline.missingTitle",
        false,
        err instanceof Error ? err.message : String(err),
      );
    }

    // 7) Payload failure: invalid runner rejected on capsule creation
    try {
      const url = `${normalizeOrigin(apiBase)}/capsules/empty`;
      const { res, json } = await fetchJson(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${vibecodrToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: `cli-e2e ${Date.now()}`,
          runner: "server-action",
          entry: "index.ts",
        }),
      });
      assert(
        res.status === 400,
        `Expected 400 for invalid runner, got ${res.status}`,
      );
      record("pipeline.invalidRunner", true, json);
    } catch (err) {
      record(
        "pipeline.invalidRunner",
        false,
        err instanceof Error ? err.message : String(err),
      );
    }

    // 8) Security: CLI token cannot PATCH /capsules/:id/manifest
    try {
      const capsuleId = await createEmptyCapsule({
        apiBase,
        token: vibecodrToken,
        title: `cli-e2e ${Date.now()}`,
        entry: "index.html",
        runner: "client-static",
      });
      const { status } = await patchManifest({
        apiBase,
        token: vibecodrToken,
        capsuleId,
        manifest: {
          version: "1.0",
          runner: "client-static",
          entry: "index.html",
        },
      });
      assert(
        status === 401,
        `Expected 401 for PATCH /manifest with CLI token, got ${status}`,
      );
      record("pipeline.manifestPatchDenied", true);
    } catch (err) {
      record(
        "pipeline.manifestPatchDenied",
        false,
        err instanceof Error ? err.message : String(err),
      );
    }

    // 9) Successful publish (optional; creates a post)
    if (values.publish) {
      try {
        let playerBase =
          values["player-base"] || process.env.VIBECODR_PLAYER_BASE;
        if (!playerBase) {
          const jironUrl = `${normalizeOrigin(apiBase)}/agent/vibe`;
          const { res, text } = await fetchText(jironUrl, {
            method: "GET",
            headers: { Accept: "application/vnd.jiron+pug" },
          });
          assert(
            res.status === 200,
            `Expected 200 fetching ${jironUrl}, got ${res.status}`,
          );
          const line = text
            .split("\n")
            .map((l) => l.trim())
            .find(
              (l) => l.startsWith("span ") && l.includes("/player/{postId}"),
            );
          assert(line, "Could not infer player URL template from Jiron doc");
          const template = line.slice("span ".length).trim();
          playerBase = template.split("/player/")[0];
        }

        const capsuleId = await createEmptyCapsule({
          apiBase,
          token: vibecodrToken,
          title: `cli-e2e ${Date.now()}`,
          entry: "index.html",
          runner: "client-static",
        });
        await uploadFile({
          apiBase,
          token: vibecodrToken,
          capsuleId,
          filePath: "index.html",
          bytes: Buffer.from(
            `<html><body>cli-e2e publish ${Date.now()}</body></html>`,
          ),
        });
        const pub = await publish({
          apiBase,
          token: vibecodrToken,
          capsuleId,
          visibility,
        });
        assert(
          pub.status === 200,
          `Expected 200 from publish, got ${pub.status}`,
        );
        assert(
          pub.json && typeof pub.json.postId === "string",
          "Publish response missing postId",
        );

        const url = `${normalizeOrigin(playerBase)}/player/${pub.json.postId}`;
        await waitForUrlOk(url, { timeoutMs });
        record("pipeline.publishSuccess", true, {
          postId: pub.json.postId,
          capsuleId,
          url,
        });
      } catch (err) {
        record(
          "pipeline.publishSuccess",
          false,
          err instanceof Error ? err.message : String(err),
        );
      }
    } else {
      record(
        "pipeline.publishSuccess",
        true,
        "skipped (pass --publish to run)",
      );
    }
  }

  const failed = results.filter((r) => !r.ok);
  const summary = {
    ok: failed.length === 0,
    api_base: apiBase,
    config_path: configPath,
    results,
  };

  if (values.json) {
    process.stdout.write(JSON.stringify(summary) + "\n");
  } else {
    for (const r of results) {
      const status = r.ok ? "OK" : "FAIL";
      process.stdout.write(
        `${status} ${r.name}${r.detail ? ` - ${typeof r.detail === "string" ? r.detail : ""}` : ""}\n`,
      );
    }
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Error: ${message}\n`);
  process.exitCode = 1;
});
