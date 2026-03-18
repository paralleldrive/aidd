# aidd-jwt-security — JWT Security Review Reference

`/aidd-jwt-security` provides security review patterns for JWT implementations.
The primary recommendation is to **avoid JWT entirely** and prefer opaque tokens
with server-side sessions.

## Why avoid JWT

If you need refresh token rotation, reuse detection, token revocation, or
logout invalidation, you are already tracking server-side state. Opaque tokens
with server-side sessions are simpler and safer in this case.

## Critical patterns to review

### Storage and transport

| Pattern | Severity | Recommendation |
| --- | --- | --- |
| Token in localStorage/sessionStorage | Critical | Use httpOnly Secure SameSite=Strict cookies |
| Token in URL or query params | Critical | Leaks via logs, Referer, browser history |
| SameSite=None or missing CSRF protection | Critical | Use SameSite=Strict or add CSRF tokens |

### Algorithm and signature

| Pattern | Severity | Recommendation |
| --- | --- | --- |
| `alg: "none"` accepted | Critical | Reject unsigned tokens |
| `jwt.decode` without `jwt.verify` | Critical | Always verify signatures |
| Algorithm selected from token header | Critical | Use strict allowlist + key type must match |
| HS256 or symmetric algorithm | Critical | Use asymmetric (RS256/ES256) |

### Claims validation

| Pattern | Severity | Recommendation |
| --- | --- | --- |
| `iss` not validated | Critical | Verify issuer matches expected value |
| `aud` not validated | Critical | Verify audience includes this service |
| `exp` not validated | Critical | Always check expiration |
| Access token lifetime ≥ 1 day | Critical | Max 15 minutes for stateless JWT |

### Key handling

| Pattern | Severity | Recommendation |
| --- | --- | --- |
| `kid` fetches from untrusted source | Critical | Allowlist kid values |
| JWKS URL derived from `iss` without allowlist | Critical | Pin JWKS URLs |
| Shared keys across issuers | Critical | One keyset per issuer |

### Authorization

- Roles and scopes in the token are **assertions, not policy** — the server must
  enforce authorization independently.

## When to use `/aidd-jwt-security`

- Reviewing or implementing authentication code
- Token handling or session management
- Any code that mentions JWT
