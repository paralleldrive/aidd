# Vibecodr CLI Publish Integration Note (MVP)

## Goal

"Publish vibe" means: create a draft capsule, upload/update files, publish it (compile is implicit), and end with a canonical player URL:

`https://vibecodr.space/player/{postId}`

The web app uses `/player/{postId}` as the canonical vibe URL (see `workers/api/src/handlers/embeds.ts`).

## Non-goals (MVP)

- Do not use the legacy multipart publish endpoint for CLI publishing.
- Do not Jiron-ify the entire API; only provide a single hypermedia "publish vibe" root.

## Publish pipeline (draft-first)

Use these existing HTTP endpoints (see `workers/api/src/routes.ts`):

Note: The API Worker strips an optional `/api` prefix for compatibility (so both `/capsules/...` and `/api/capsules/...` can work depending on routing).

1. Create an empty draft capsule:
   - `POST /capsules/empty`
   - Optional JSON body: `{ "title": "My vibe", "entry": "src/index.tsx", "runner": "client-static" }` (see `workers/api/src/handlers/capsules.ts`)
   - `title` is required for CLI grants (so vibes never publish as "New Project")
2. Upload or update files incrementally:
   - `PUT /capsules/{capsuleId}/files/{path}` (repeat for each file)
3. Publish (auto-compiles):
   - `POST /capsules/{capsuleId}/publish`
   - Returns `postId` (see `workers/api/src/handlers/studio.ts`)

Compute the final share URL as:

`{playerOrigin}/player/{postId}` where `playerOrigin` defaults to `https://vibecodr.space` (see `VXBE_PLAYER_BASE` / `VIBECODR_BASE_URL` usage in `workers/api/src/handlers/embeds.ts`).

## Do not use the legacy multipart publish endpoint

Avoid:

- `POST /capsules/publish`

This handler buffers multipart uploads in memory and enforces a 25MB safety cap (see comment near `PUBLISH_CAPSULE_MAX_BUFFER_BYTES` in `workers/api/src/handlers/capsules.ts`). A CLI publish should always use incremental draft uploads.

## Auth (today) and why CLI needs a new flow

Current API auth expects a Clerk JWT in:

`Authorization: Bearer <jwt>`

Verification is RS256 via Clerk JWKS and issuer/audience checks (see `workers/api/src/auth.ts`). This works well for browser sessions but is not a good fit for headless/agent CLIs.

### Decision (MVP): OAuth + PKCE + localhost callback (Option 1)

The CLI performs a Clerk OAuth "scoped access" flow (PKCE + localhost redirect), then exchanges the resulting OAuth access token for a short-lived Vibecodr CLI token:

- Exchange endpoint: `POST /auth/cli/exchange` with JSON `{ "access_token": "<clerk_oauth_access_token>" }`
- Server verifies the OAuth token via Clerk: `POST https://api.clerk.com/oauth_applications/access_tokens/verify` using `CLERK_SECRET_KEY`
- Server returns a Vibecodr-signed Bearer token (HS256) for the publish pipeline
- Exchange authorization is enforced by allowlisting the OAuth `client_id` via `CLERK_CLI_OAUTH_CLIENT_ID` (no custom scopes required)

The Vibecodr CLI token is intentionally restricted (defense-in-depth):

- Accepted only for the draft publish pipeline routes (`/capsules/empty`, file uploads, compile-draft, publish) via `workers/api/src/auth.ts`
- Signed/verified with `CLI_GRANT_SECRET` (32-byte base64)
