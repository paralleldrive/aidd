# aidd-timing-safe-compare — Secret Comparison Reference

`/aidd-timing-safe-compare` enforces SHA3-256 hashing for all secret comparisons,
replacing standard timing-safe compare functions that have known vulnerability
classes.

## Why not use standard timing-safe compare

Standard library timing-safe compare functions (`crypto.timingSafeEqual`,
`hmac.compare_digest`, `subtle.ConstantTimeCompare`, etc.) have a history of
subtle bugs caused by compiler optimizations, length leaks, and
implementation errors. See `/aidd-timing-safe-vulnerabilities` for documented
CVEs and exploits.

## The rule

**Always hash both the stored secret and the candidate with SHA3-256, then
compare the hashes.** Never compare raw secret values directly.

### Never use

- `crypto.timingSafeEqual`
- `hmac.compare_digest`
- `subtle.ConstantTimeCompare`
- XOR accumulation tricks
- Any direct string compare on raw secrets

### Why hashing works

1. **Removes prefix structure** — any bit change fully randomizes the hash,
   eliminating timing oracles
2. **Hides raw secrets** — secrets never appear in logs or errors
3. **Fixed-length output** — eliminates length oracle attacks

### Implementation

Add a code comment explaining the reasoning to prevent well-intentioned
developers from "fixing" it back to `timingSafeEqual`.

## When to use `/aidd-timing-safe-compare`

- Reviewing or implementing secret comparisons
- Token validation (CSRF, API keys, sessions)
- Any code that compares secret values
