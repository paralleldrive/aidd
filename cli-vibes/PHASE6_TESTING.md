# Phase 6: CLI publish workflow testing (staging)

This folder contains a staging-ready E2E harness for the CLI publish pipeline and its failure modes.

## Preconditions

- A Clerk OAuth application for the CLI (PKCE + localhost callback). Use standard OIDC scopes (`openid profile email`) (no custom scopes required).
- Vibecodr API secrets configured in the Worker:
  - `CLERK_SECRET_KEY`
  - `CLI_GRANT_SECRET`
  - `CLERK_CLI_OAUTH_CLIENT_ID` (must match the OAuth app `client_id` so only the CLI app can exchange)

## Configure staging targets

Set these in your shell (examples):

```powershell
$env:VIBECODR_API_BASE="https://api-staging.vibecodr.space"
$env:VIBECODR_PLAYER_BASE="https://staging.vibecodr.space"
```

If your environment uses different staging domains, adjust accordingly.

## 1) Authenticate

```powershell
node cli-vibes/vibecodr-auth.js login
```

If you need to override the default OAuth app (staging/self-host), set `VIBECODR_CLERK_OAUTH_CLIENT_ID` or pass `--client-id`.

This writes `cli.json` (see `cli-vibes/README.md`) with a Vibecodr CLI token to use for publish calls.

## 2) Run failure-mode checks (non-destructive)

```powershell
node cli-vibes/vibecodr-e2e.js
```

This verifies:

- Auth failure: missing token -> `401`
- Auth failure: invalid token -> `401`
- Auth failure: expired-like CLI token -> `401`
- Payload failure: missing title rejected by `POST /capsules/empty` -> `400`
- Payload failure: invalid runner rejected by `POST /capsules/empty` -> `400`
- Security: CLI token cannot `PATCH /capsules/:id/manifest` -> `401`
- Large project safety: the harness uses the draft pipeline only (no multipart `POST /capsules/publish`)


## 3) Run a real publish + player URL check (creates a post)

```powershell
node cli-vibes/vibecodr-e2e.js --publish
```

This:

1. Creates a capsule
2. Uploads files via incremental `PUT /capsules/:id/files/:path`
3. Publishes (auto-compiles) and verifies the canonical player URL `/player/{postId}` returns `2xx`

## 4) Exchange allowlist (optional)

`POST /auth/cli/exchange` is protected by an OAuth `client_id` allowlist (server-side secret `CLERK_CLI_OAUTH_CLIENT_ID`).

To test the allowlist, you need a valid Clerk OAuth access token issued for a different OAuth application (different `client_id`). Expected: `403`.
