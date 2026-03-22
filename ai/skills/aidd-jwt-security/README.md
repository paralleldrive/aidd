# aidd-jwt-security

Security review patterns for JWT implementations. The primary recommendation
is to **avoid JWT entirely** and prefer opaque tokens with server-side sessions.

## Why

If you need refresh token rotation, reuse detection, token revocation, or
logout invalidation, you are already tracking server-side state. Opaque tokens
with server-side sessions are simpler and safer.

## Usage

Invoke `/aidd-jwt-security` when reviewing authentication code. The skill
checks for critical patterns including: tokens in localStorage (use httpOnly
cookies instead), `alg: "none"` acceptance, `jwt.decode` without `jwt.verify`,
symmetric algorithms (use RS256/ES256), missing claims validation (`iss`,
`aud`, `exp`), and access token lifetimes exceeding 15 minutes.

## When to use

- Reviewing or implementing authentication code
- Token handling or session management
- Any code that mentions JWT
