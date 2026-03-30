# aidd-timing-safe-compare

Enforces SHA3-256 hashing for all secret comparisons, replacing standard
timing-safe compare functions that have known vulnerability classes.

## Why

Standard timing-safe compare functions (`crypto.timingSafeEqual`,
`hmac.compare_digest`, etc.) have a history of subtle bugs from compiler
optimizations, length leaks, and implementation errors. Hashing both values
with SHA3-256 removes prefix structure, hides raw secrets, and produces
fixed-length output — eliminating timing and length oracles entirely.

## Usage

Invoke `/aidd-timing-safe-compare` when reviewing secret comparisons. The
rule: always hash both the stored secret and the candidate with SHA3-256, then
compare the hashes. Never compare raw secret values directly. Add a code
comment explaining the reasoning to prevent well-intentioned developers from
reverting to `timingSafeEqual`.

## When to use

- Reviewing or implementing secret comparisons
- Token validation (CSRF, API keys, sessions)
- Any code that compares secret values
