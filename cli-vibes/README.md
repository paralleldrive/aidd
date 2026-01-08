# cli-vibes

Phase 1 (MVP) implements a CLI-friendly auth flow for publishing vibes:

- Clerk OAuth (Authorization Code + PKCE) with a localhost callback
- Exchange Clerk OAuth access token for a short-lived Vibecodr CLI token
- Publish using the draft pipeline (no multipart)

Jiron discovery (publish contract):

- Live: `GET https://api.vibecodr.space/agent/vibe` (or `GET https://api.vibecodr.space/jiron/vibe`)
- Offline mock: `cli-vibes/vibe-publish.jiron.pug`

## Server setup (Vibecodr API)

The API worker needs:

- `CLERK_SECRET_KEY` (Clerk Backend API secret; used to verify OAuth access tokens)
- `CLERK_CLI_OAUTH_CLIENT_ID` (required allowlist; only tokens from this OAuth app can exchange)
- `CLI_GRANT_SECRET` (32-byte base64; used to sign Vibecodr CLI tokens)

Set `CLERK_SECRET_KEY` + `CLI_GRANT_SECRET` as Worker secrets. `CLERK_CLI_OAUTH_CLIENT_ID` is not sensitive (var or secret is fine), but it must be set.

## Clerk setup (OAuth application)

Production Vibecodr uses a preconfigured Clerk OAuth application (the CLI defaults to its `client_id`).

For staging/self-hosted environments, create an OAuth application in Clerk for the CLI:

- Redirect URI: `http://localhost:3000/oauth_callback`
- PKCE: enabled (public client; no client secret required)
- Scopes: standard OIDC scopes (`openid profile email`) (no custom scopes required)

Copy the OAuth application **Client ID** and pass it via `VIBECODR_CLERK_OAUTH_CLIENT_ID` (or `--client-id`).

## CLI login (interactive)

From the repo root:

```powershell
node cli-vibes/vibecodr-auth.js login
```

If you need to override the default OAuth app (staging/self-host), set `VIBECODR_CLERK_OAUTH_CLIENT_ID` or pass `--client-id`.

This:

1. Opens a browser to Clerk's authorization page
2. Receives the callback on `http://localhost:3000/oauth_callback`
3. Exchanges the auth code for a Clerk OAuth access token
4. Calls `POST https://api.vibecodr.space/auth/cli/exchange` (the Worker also accepts an optional `/api` prefix in some deployments)
5. Writes credentials to `~/.config/vibecodr/cli.json` (or `%APPDATA%\\vibecodr\\cli.json` on Windows)

## Refresh (no browser)

```powershell
node cli-vibes/vibecodr-auth.js refresh
```

This uses the stored Clerk `refresh_token` to mint a new OAuth access token and re-exchanges it for a fresh Vibecodr CLI token.

## Getting the token (for scripts/agents)

To print a JSON receipt with the Vibecodr token:

```powershell
node cli-vibes/vibecodr-auth.js login --json --print-token
```

## Publish (smoke)

Publishes a directory of project files (manifest is server-owned). Requires `--title` (and usually `--entry`):

```powershell
node cli-vibes/vibecodr-publish.js --dir . --title "My vibe" --entry "index.html" --json
```

If `manifest.json` exists, the script uses it only to infer `title`/`entry`/`runner` (it is not uploaded).

Output contract:

`{ postId, capsuleId, url }`

## Phase 6 checks (staging-ready)

See `cli-vibes/PHASE6_TESTING.md` and run:

```powershell
node cli-vibes/vibecodr-e2e.js
```

## Security notes

- Treat `cli.json` like a password (it can contain a `refresh_token`).
- Do not paste tokens into logs, bug reports, or screenshots.
- Tokens are never exposed to published vibe code; they only exist on your machine and in Worker secrets.
