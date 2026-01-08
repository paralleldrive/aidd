# Vibecodr API Integration for aidd CLI

**Version:** 1.0.0  
**Last Updated:** 2026-01-07  
**Status:** Production Ready

This document describes the HTTP API surface for integrating aidd CLI with Vibecodr's publish pipeline.

## Overview

aidd integrates with Vibecodr via direct HTTP API calls. The integration supports:

1. **Authentication** - OAuth + PKCE flow with token exchange
2. **Publish** - One-shot vibe publishing (create capsule, upload files, publish)

Watch mode is deferred to v2.

---

## Self-Discovery (Jiron Contract)

Vibecodr exposes a machine-readable contract at:

```
GET https://api.vibecodr.space/agent/vibe
Accept: application/vnd.jiron+pug
```

This returns a Jiron document (Pug-based hypermedia) describing all available endpoints, their methods, content types, and parameters. aidd should fetch this on first use and cache it (1 hour TTL recommended).

**Alternate URL:** `GET /jiron/vibe`

### Example Response

```pug
head(profile='https://vibecodr.space/profiles/vibe-publish')
  title Vibecodr - Publish Vibe
body.vibecodr.vibePublish
  h1 Publish a vibe to Vibecodr

  ul.links
    li.link
      a(rel='self', href='https://api.vibecodr.space/agent/vibe', headers='Accept:application/vnd.jiron+pug')
    li.link
      a(rel='alternate', href='https://api.vibecodr.space/jiron/vibe', headers='Accept:application/vnd.jiron+pug')
    li.link
      a(rel='documentation', href='https://vibecodr.space/docs/cli-integration')

  ul.properties
    li.property
      label API Base
        span https://api.vibecodr.space
    li.property
      label Canonical player URL
        span https://vibecodr.space/player/{postId}
    li.property
      label Auth header (after exchange)
        span Authorization: Bearer {token}
    li.property
      label Manifest ownership
        span Server-owned (CLI tokens cannot PATCH /capsules/:id/manifest)

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
    li.action.oauth-authorize
      form(action='navigate', href='https://clerk.vibecodr.space/oauth/authorize', type='browser')
        fieldset
          legend Step 1: OAuth Authorization (opens browser)
          label client_id
            input(name='client_id', value='g3NwTqUg7nRzHeHo', readonly)
          label redirect_uri
            input(name='redirect_uri', value='http://localhost:3000/oauth_callback', readonly)
          label response_type
            input(name='response_type', value='code', readonly)
          label scope
            input(name='scope', value='openid profile email', readonly)
          label code_challenge
            input(name='code_challenge', placeholder='sha256_base64url(code_verifier)')
          label code_challenge_method
            input(name='code_challenge_method', value='S256', readonly)
          label state
            input(name='state', placeholder='random_state')
    li.action.oauth-token
      form(action='create', href='https://clerk.vibecodr.space/oauth/token', type='application/x-www-form-urlencoded')
        fieldset
          legend Step 2: Exchange auth code for Clerk token (POST)
          label grant_type
            input(name='grant_type', value='authorization_code', readonly)
          label client_id
            input(name='client_id', value='g3NwTqUg7nRzHeHo', readonly)
          label redirect_uri
            input(name='redirect_uri', value='http://localhost:3000/oauth_callback', readonly)
          label code
            input(name='code', placeholder='{authorization_code}')
          label code_verifier
            input(name='code_verifier', placeholder='{code_verifier}')
    li.action.oauth-refresh
      form(action='create', href='https://clerk.vibecodr.space/oauth/token', type='application/x-www-form-urlencoded')
        fieldset
          legend Refresh Clerk token (when expired)
          label grant_type
            input(name='grant_type', value='refresh_token', readonly)
          label client_id
            input(name='client_id', value='g3NwTqUg7nRzHeHo', readonly)
          label refresh_token
            input(name='refresh_token', placeholder='{clerk_refresh_token}')
    li.action
      form(action='create', href='https://api.vibecodr.space/auth/cli/exchange', type='application/json')
        fieldset
          legend Step 3: Exchange Clerk token for Vibecodr CLI token
          label access_token
            input(name='access_token', placeholder='{clerk_access_token}')
    li.action
      form(action='create', href='https://api.vibecodr.space/capsules/empty', type='application/json')
        fieldset
          legend Step 4: Create empty capsule (draft)
          label title (required)
            input(name='title', value='My vibe')
          label entry (optional)
            input(name='entry', value='index.tsx')
          label runner (optional)
            input(name='runner', value='client-static')
    li.action
      form(action='put', href='https://api.vibecodr.space/capsules/{capsuleId}/files/{path}', type='application/octet-stream')
        fieldset
          legend Step 5: Upload file bytes (repeat per file)
    li.action
      form(action='create', href='https://api.vibecodr.space/capsules/{capsuleId}/publish', type='application/json')
        fieldset
          legend Step 6: Publish (returns postId)
          label visibility
            input(name='visibility', value='public')
          label note
            span public|unlisted|private (defaults to public)

  section.drafts
    h2 Draft Management
    p Save work-in-progress vibes and resume later
    ul.actions
      li.action.drafts-list
        form(action='read', href='https://api.vibecodr.space/me/drafts', type='application/json')
          fieldset
            legend List all drafts
            label note
              span Returns array of {draftId, fileCount, totalSize, lastModified, files}
      li.action.drafts-get
        form(action='read', href='https://api.vibecodr.space/drafts/{draftId}', type='application/json')
          fieldset
            legend Get draft details
            label draftId
              input(name='draftId', placeholder='{draftId}')
      li.action.drafts-delete
        form(action='delete', href='https://api.vibecodr.space/drafts/{draftId}', type='application/json')
          fieldset
            legend Delete a draft
            label draftId
              input(name='draftId', placeholder='{draftId}')
      li.action.drafts-save
        fieldset
          legend Save to draft (workflow)
          label note
            span To save: POST /capsules/empty → PUT files → (skip publish). Draft persists as capsuleId.
```

---

## Base URLs

| Environment | API Base                     | Player Base              |
| ----------- | ---------------------------- | ------------------------ |
| Production  | `https://api.vibecodr.space` | `https://vibecodr.space` |

---

## Authentication

Vibecodr uses a two-step auth flow:

1. **OAuth + PKCE** with Clerk (opens browser, localhost callback)
2. **Token Exchange** - swap Clerk OAuth token for Vibecodr CLI token

### Step 1: OAuth Authorization (Browser)

Initiate Clerk OAuth with PKCE:

```
GET https://clerk.vibecodr.space/oauth/authorize
  ?client_id=g3NwTqUg7nRzHeHo
  &redirect_uri=http://localhost:3000/oauth_callback
  &response_type=code
  &scope=openid%20profile%20email
  &code_challenge={sha256_base64url(code_verifier)}
  &code_challenge_method=S256
  &state={random_state}
```

**OAuth Parameters:**

| Parameter               | Value                                  |
| ----------------------- | -------------------------------------- |
| `client_id`             | `g3NwTqUg7nRzHeHo` (production)        |
| `redirect_uri`          | `http://localhost:3000/oauth_callback` |
| `scope`                 | `openid profile email`                 |
| `code_challenge_method` | `S256`                                 |

### Step 2: Token Exchange (Clerk)

After receiving the auth code via localhost callback:

```http
POST https://clerk.vibecodr.space/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=g3NwTqUg7nRzHeHo
&redirect_uri=http://localhost:3000/oauth_callback
&code={authorization_code}
&code_verifier={code_verifier}
```

**Response:**

```json
{
  "access_token": "clerk_oauth_access_token",
  "refresh_token": "clerk_refresh_token",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

### Step 3: Exchange for Vibecodr Token

Exchange the Clerk OAuth token for a Vibecodr CLI token:

```http
POST /auth/cli/exchange
Content-Type: application/json
Accept: application/json

{
  "access_token": "clerk_oauth_access_token"
}
```

**Response:**

```json
{
  "token_type": "Bearer",
  "access_token": "vibecodr_cli_token",
  "expires_at": 1704672000,
  "user_id": "user_abc123"
}
```

**Error Responses:**

| Status | Meaning                          |
| ------ | -------------------------------- |
| `401`  | Invalid or expired Clerk token   |
| `403`  | OAuth client_id not in allowlist |

### Token Refresh

Use the Clerk `refresh_token` to get a new OAuth token, then re-exchange:

```http
POST https://clerk.vibecodr.space/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&client_id=g3NwTqUg7nRzHeHo
&refresh_token={clerk_refresh_token}
```

Then call `/auth/cli/exchange` again with the new access token.

### Token Storage

Store credentials at:

| Platform    | Path                          |
| ----------- | ----------------------------- |
| macOS/Linux | `~/.config/vibecodr/cli.json` |
| Windows     | `%APPDATA%\vibecodr\cli.json` |

**Example `cli.json`:**

```json
{
  "issuer": "https://clerk.vibecodr.space",
  "api_base": "https://api.vibecodr.space",
  "client_id": "g3NwTqUg7nRzHeHo",
  "clerk": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": 1704672000
  },
  "vibecodr": {
    "token_type": "Bearer",
    "access_token": "...",
    "expires_at": 1704672000,
    "user_id": "user_abc123"
  },
  "updated_at": "2026-01-07T12:00:00Z"
}
```

---

## Publish Pipeline

Publishing a vibe is a 3-step process:

### Step 1: Create Empty Capsule

```http
POST /capsules/empty
Authorization: Bearer {vibecodr_token}
Content-Type: application/json
Accept: application/json

{
  "title": "My Vibe",
  "entry": "index.html",
  "runner": "client-static"
}
```

**Request Body:**

| Field    | Type   | Required | Description                                                  |
| -------- | ------ | -------- | ------------------------------------------------------------ |
| `title`  | string | **Yes**  | Vibe title (displayed in player)                             |
| `entry`  | string | No       | Entry point file (default: auto-detected)                    |
| `runner` | string | No       | `client-static` or `webcontainer` (default: `client-static`) |

**Response:**

```json
{
  "success": true,
  "capsuleId": "cap_abc123xyz"
}
```

### Step 2: Upload Files

Repeat for each file:

```http
PUT /capsules/{capsuleId}/files/{encodedPath}
Authorization: Bearer {vibecodr_token}
Content-Type: application/octet-stream
Accept: application/json

<raw file bytes>
```

**Path Encoding:** URL-encode the relative file path. Example:

- `index.html` → `index.html`
- `src/app.tsx` → `src%2Fapp.tsx`
- `assets/logo.png` → `assets%2Flogo.png`

**Response:**

```json
{
  "ok": true,
  "path": "src/app.tsx",
  "size": 1234,
  "totalSize": 56789,
  "etag": "abc123..."
}
```

| Field       | Type   | Description                                      |
| ----------- | ------ | ------------------------------------------------ |
| `ok`        | bool   | Success indicator                                |
| `path`      | string | Normalized file path                             |
| `size`      | number | Size of uploaded file in bytes                   |
| `totalSize` | number | Total capsule size after upload                  |
| `etag`      | string | ETag for optimistic concurrency (also in header) |

### Step 3: Publish

```http
POST /capsules/{capsuleId}/publish
Authorization: Bearer {vibecodr_token}
Content-Type: application/json
Accept: application/json

{
  "visibility": "public"
}
```

**Request Body:**

| Field        | Type   | Values                          | Default  |
| ------------ | ------ | ------------------------------- | -------- |
| `visibility` | string | `public`, `unlisted`, `private` | `public` |

**Response:**

```json
{
  "ok": true,
  "postId": "post_xyz789",
  "capsuleId": "cap_abc123xyz",
  "artifactId": "art_def456",
  "runtimeVersion": "2.1.0",
  "warnings": [],
  "isRepublish": false
}
```

| Field            | Type     | Description                                        |
| ---------------- | -------- | -------------------------------------------------- |
| `ok`             | bool     | Success indicator                                  |
| `postId`         | string   | ID to construct player URL                         |
| `capsuleId`      | string   | The capsule ID (same as input)                     |
| `artifactId`     | string   | ID of the published artifact                       |
| `runtimeVersion` | string   | Version of the vibe runtime used                   |
| `warnings`       | string[] | Non-fatal issues (e.g., large files, missing meta) |
| `isRepublish`    | bool     | `true` if this capsule was already published       |

### Final URL

Construct the player URL:

```
https://vibecodr.space/player/{postId}
```

---

## Draft Management

Drafts allow users to save work-in-progress vibes and resume editing later. A draft is simply an unpublished capsule.

### Creating a Draft (Save)

To save a draft, follow the same flow as publishing but skip the final publish step:

1. `POST /capsules/empty` - Create empty capsule (returns `capsuleId`)
2. `PUT /capsules/{capsuleId}/files/{path}` - Upload files (repeat per file)
3. **Stop here** - The capsule persists as a draft

The `capsuleId` returned in step 1 is the draft identifier. Store it locally to resume later.

### List Drafts

```http
GET /me/drafts
Authorization: Bearer {vibecodr_token}
Accept: application/json
```

**Response:**

```json
{
  "drafts": [
    {
      "draftId": "cap_abc123",
      "fileCount": 5,
      "totalSize": 12345,
      "lastModified": "2026-01-07T12:00:00.000Z",
      "files": ["index.tsx", "app.css", "utils.ts"]
    }
  ]
}
```

| Field          | Type     | Description                        |
| -------------- | -------- | ---------------------------------- |
| `draftId`      | string   | Capsule ID (use for resume/delete) |
| `fileCount`    | number   | Total number of files in draft     |
| `totalSize`    | number   | Total size in bytes                |
| `lastModified` | string   | ISO timestamp of last edit         |
| `files`        | string[] | First 10 file paths (preview)      |

### Get Draft Details

```http
GET /drafts/{draftId}
Authorization: Bearer {vibecodr_token}
Accept: application/json
```

**Response:**

```json
{
  "draftId": "cap_abc123",
  "fileCount": 5,
  "totalSize": 12345,
  "lastModified": "2026-01-07T12:00:00.000Z",
  "files": [
    { "path": "index.tsx", "size": 1234, "uploaded": null },
    { "path": "app.css", "size": 567, "uploaded": null }
  ]
}
```

### Resume Editing a Draft

To continue editing an existing draft:

1. Use the stored `draftId` (which is a `capsuleId`)
2. `PUT /capsules/{draftId}/files/{path}` - Upload new/modified files
3. Either publish or save for later

### Delete a Draft

```http
DELETE /drafts/{draftId}
Authorization: Bearer {vibecodr_token}
Accept: application/json
```

**Response:**

```json
{
  "ok": true,
  "draftId": "cap_abc123",
  "filesDeleted": 1
}
```

### Publish a Draft

To publish a previously saved draft:

```http
POST /capsules/{draftId}/publish
Authorization: Bearer {vibecodr_token}
Content-Type: application/json

{
  "visibility": "public"
}
```

This converts the draft into a published vibe and returns the `postId`.

---

## File Filtering

aidd should exclude these files/directories from upload:

### Always Ignore (Hardcoded)

```
.git/
node_modules/
.next/
.turbo/
dist/
build/
coverage/
.cache/
.pnpm-store/
.venv/
__pycache__/
.pytest_cache/
.mypy_cache/
target/
.cargo/
vendor/
.bundle/
.gradle/
.idea/
.vscode/
.DS_Store
Thumbs.db
manifest.json
.env
.env.*
*.log
```

### Respect Ignore Files

Check for these files in the project root (in priority order):

1. `.vibecodrignore` (highest priority)
2. `.gitignore`
3. `.aiddignore`

Use standard gitignore syntax for pattern matching.

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Human-readable message",
  "errorCode": "E-VIBECODR-0001",
  "hint": "Optional suggestion for resolution"
}
```

### Common Errors

| Status | Error Code              | Meaning                                                |
| ------ | ----------------------- | ------------------------------------------------------ |
| `400`  | Various                 | Validation error (missing title, invalid runner, etc.) |
| `401`  | `auth.*`                | Token expired or invalid                               |
| `403`  | `auth.*`                | Not authorized (wrong OAuth client, etc.)              |
| `413`  | `capsule.*`             | File too large                                         |
| `429`  | `api.rateLimitExceeded` | Rate limited (retry with backoff)                      |

### Retry Strategy

For transient errors (5xx, 429):

1. Wait 1 second
2. Retry with exponential backoff (2s, 4s, 8s)
3. Max 3 retries

---

## Complete Flow Example

```javascript
// 1. Auth (one-time, interactive)
const clerkToken = await oauthPkceFlow();
const { access_token, expires_at, user_id } = await fetch(
  "https://api.vibecodr.space/auth/cli/exchange",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: clerkToken }),
  }
).then((r) => r.json());

// 2. Create capsule
const { capsuleId } = await fetch("https://api.vibecodr.space/capsules/empty", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${access_token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "My Vibe",
    entry: "index.html",
    runner: "client-static",
  }),
}).then((r) => r.json());

// 3. Upload files
for (const file of files) {
  await fetch(
    `https://api.vibecodr.space/capsules/${capsuleId}/files/${encodeURIComponent(file.path)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/octet-stream",
      },
      body: file.bytes,
    }
  );
}

// 4. Publish
const { postId } = await fetch(`https://api.vibecodr.space/capsules/${capsuleId}/publish`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${access_token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ visibility: "public" }),
}).then((r) => r.json());

// 5. Done!
const vibeUrl = `https://vibecodr.space/player/${postId}`;
```

---

## Reference Implementation

See `cli-vibes/vibecodr-auth.js` and `cli-vibes/vibecodr-publish.js` for working Node.js implementations of this flow.

---

## Support

For integration questions, contact the Vibecodr team.
