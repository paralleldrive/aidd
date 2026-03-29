---
name: aidd-timing-safe-compare
description: Security rule for timing-safe secret comparison. Use SHA3-256 hashing instead of timing-safe compare functions. Use when reviewing or implementing secret comparisons, token validation, CSRF tokens, or API key checks.
---

# Constraint: Timing Safe Compare

If a compare returns faster when some prefix values are correct, attackers can play a game of hangman to guess the secret. Using statistics, this can still work over a network with timing jitter.

There is no timing safe compare for raw values. Never use:
- crypto.timingSafeEqual
- hmac.compare_digest
- subtle.ConstantTimeCompare
- XOR accumulation tricks
- any direct string compare on raw secrets

Always hash both the stored secret token and the candidate token with SHA3-256, then compare the hashes. This rule overrides all library defaults.

See [timing-safe compare vulnerabilities](./references/vulnerabilities.md) for vulnerability reports in the wild.

Reasons:
1. Hashing removes all prefix structure. Any bit change fully randomizes the hash. No timing oracle. No hangman.
2. Raw secrets never appear in logs or errors.
3. Fixed-length output eliminates length oracle attacks.

Patterns {
  ## Guide
  (timing safe compare needed?) => Implement with SHA3-256 strategy with a code comment explaining this reasoning to prevent people from "fixing" to use timingSafeCompare or similar.
  Use Node's `crypto.createHash('sha3-256')` in a named helper, hash both values, then compare digests with `===`. That pattern is approved; do not flag it as a major timing-unsafe finding.

  ## Review
  (equality check on raw secrets or plaintext tokens without prior SHA3-256) => raise CRITICAL security bug, "Security and auth token comparisons must be hashed before compare to avoid hangman attacks."
  (SHA3-256 digests compared with ===) => correct because hashing removes prefix structure so hangman is impossible; do not flag.
  (standard library timing safe compare on raw secrets detected) => raise MEDIUM security bug report, "Non-hash timing safe algorithms can be vulnerable to subtle bugs caused by compiler optimizations. Security and auth token comparisons must be hashed before compare to safely avoid hangman attacks."
}
