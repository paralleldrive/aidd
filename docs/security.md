# Security Guide

This guide covers security best practices enforced by the AIDD `/review` command and built into the AIDD server framework.

## Contents

- [JWT Security](#jwt-security)
- [Timing-Safe Secret Comparison](#timing-safe-secret-comparison)
- [Identifier Security](#identifier-security)

---

## JWT Security

**TL;DR: Avoid JWT if you can.** JWT has historically been riddled with implementation errors.

### Preferred Approach

Use opaque access tokens with server-side sessions or token introspection instead of JWT.

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│  Server  │────▶│ Session  │
│          │     │          │     │  Store   │
│ (cookie) │◀────│ (lookup) │◀────│ (Redis)  │
└──────────┘     └──────────┘     └──────────┘
```

### Token Storage

| Storage Method | Security | Recommendation |
|----------------|----------|----------------|
| httpOnly Secure SameSite cookie | ✅ Safe | **Use this** |
| localStorage | ❌ XSS vulnerable | Never use |
| sessionStorage | ❌ XSS vulnerable | Never use |
| JavaScript variable | ❌ XSS vulnerable | Never use |

### Critical Patterns to Avoid

```javascript
// ❌ CRITICAL: Token in localStorage - XSS vulnerable
localStorage.setItem('token', jwt);

// ❌ CRITICAL: 'none' algorithm - signature bypass
jwt.sign(payload, secret, { algorithm: 'none' });

// ❌ CRITICAL: Verification disabled
jwt.verify(token, secret, { verify: false });

// ❌ CRITICAL: Using decode without verify
const payload = jwt.decode(token); // No signature check!

// ❌ CRITICAL: Ignoring expiration
jwt.verify(token, secret, { ignoreExpiration: true });

// ⚠️ WARNING: Long-lived access tokens
jwt.sign(payload, secret, { expiresIn: '30d' });
```

### If JWT Is Required

If you must use JWT, follow these requirements:

1. **Asymmetric algorithms** (RS256/ES256) - never HS256 shared across services
2. **Short expiration** - ≤15 minutes for access tokens
3. **httpOnly Secure SameSite cookies** - never localStorage
4. **CSRF protection** - cookies don't prevent CSRF
5. **Refresh token rotation** - for longer sessions

### Further Reading

- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Auth0 JWT Vulnerabilities](https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/)

---

## Timing-Safe Secret Comparison

**TL;DR: Don't use timing-safe compare functions. Hash both values with SHA3 and compare the hashes.**

### The Problem

Timing attacks exploit the time difference in string comparison to guess secrets character by character. Traditional "fixes" like `crypto.timingSafeEqual` are insufficient because:

1. They still operate on raw values
2. Implementation bugs are common
3. Raw secrets may leak in logs or errors

### The Solution

Hash both the stored secret and the candidate with SHA3, then compare the hashes:

```javascript
import { sha3_256 } from 'js-sha3';

const verifyToken = (storedToken, candidateToken) => {
  // Hash both values - any bit change fully randomizes the hash
  const storedHash = sha3_256(storedToken);
  const candidateHash = sha3_256(candidateToken);

  // Simple comparison is now safe - no timing oracle
  return storedHash === candidateHash;
};
```

### Why This Works

1. **No timing oracle** - Hashing removes all prefix structure. Any bit change fully randomizes the hash.
2. **No raw secrets in memory** - The original values are never compared directly.
3. **No leaks** - Raw secrets never appear in logs or error messages.

### What NOT to Do

```javascript
// ❌ CRITICAL: Raw timing-safe compare still leaks info
crypto.timingSafeEqual(Buffer.from(secret), Buffer.from(candidate));

// ❌ CRITICAL: XOR accumulation tricks
let result = 0;
for (let i = 0; i < secret.length; i++) {
  result |= secret[i] ^ candidate[i];
}
return result === 0;

// ❌ CRITICAL: Direct string comparison
return storedToken === candidateToken;
```

---

## Identifier Security

**TL;DR: Use Cuid2 for all user-visible identifiers. Never use sequential IDs, UUIDs v1-v3, or predictable patterns.**

### Why Identifier Security Matters

Insecure identifiers have caused real-world breaches:

- **[Unauthorized account access via GUID prediction](https://www.intruder.io/research/in-guid-we-trust)** - GUIDs are not random enough
- **[Password reset token prediction](https://infosecwriteups.com/bugbounty-how-i-was-able-to-compromise-any-user-account-via-reset-password-functionality-a11bb5f863b3)** - Sequential IDs leaked user enumeration
- **[GitLab $20,000 bug bounty](https://infosecwriteups.com/how-this-easy-vulnerability-resulted-in-a-20-000-bug-bounty-from-gitlab-d9dc9312c10a)** - Unauthorized data access via predictable IDs
- **[2018 Strava Pentagon breach](https://www.engadget.com/2018-02-02-strava-s-fitness-heatmaps-are-a-potential-catastrophe.html)** - Location data leaked through predictable patterns
- **[PleaseRobMe](https://web.archive.org/web/20120615011625/http://pleaserobme.com/why)** - Social media check-ins revealed when homes were empty

### The AIDD Solution: Cuid2

AIDD uses [@paralleldrive/cuid2](https://github.com/paralleldrive/cuid2) for secure identifier generation:

```javascript
import { createId } from '@paralleldrive/cuid2';

const userId = createId(); // 'tz4a98xxat96iws9zmbrgj3a'
```

### Why Cuid2?

| Feature | Cuid2 | UUID v4 | Sequential ID |
|---------|-------|---------|---------------|
| Collision resistant | ✅ ~4e18 IDs to 50% collision | ⚠️ Collisions reported | ❌ Requires coordination |
| Unpredictable | ✅ SHA3 hashed | ⚠️ Browser CSPRNG bugs | ❌ Easily guessed |
| No info leakage | ✅ Hashed output | ❌ Reveals structure | ❌ Reveals count/order |
| Horizontally scalable | ✅ No coordination | ✅ No coordination | ❌ Requires central DB |
| Offline compatible | ✅ Yes | ✅ Yes | ❌ No |
| URL friendly | ✅ Lowercase alphanumeric | ❌ Dashes, long | ✅ Yes |

### What NOT to Use

```javascript
// ❌ CRITICAL: Sequential IDs - enumerable, predictable
const userId = autoIncrement++; // Attacker can guess all valid IDs

// ❌ CRITICAL: UUID v1 - leaks timestamp and MAC address
import { v1 as uuidv1 } from 'uuid';
const id = uuidv1(); // Contains creation time!

// ⚠️ WARNING: UUID v4 - browser CSPRNG bugs, collisions reported
import { v4 as uuidv4 } from 'uuid';
const id = uuidv4(); // Chrome had Math.random() bugs until 2015

// ⚠️ WARNING: NanoId/Ulid - too fast, trusts single entropy source
import { nanoid } from 'nanoid';
const id = nanoid(); // Fast = easier to brute force
```

### Entropy Comparison

Cuid2 uses multiple entropy sources hashed together:

- Current system time
- Pseudorandom values
- Session counter (randomly initialized)
- Host fingerprint
- SHA3 hashing to mix all sources

This provides stronger guarantees than trusting a single source like the Web Crypto API, which has had [known bugs](https://bugs.chromium.org/p/chromium/issues/detail?id=552749).

### Further Reading

- [Cuid2 Documentation](https://github.com/paralleldrive/cuid2) - Full security analysis
- [OWASP Identifier Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)

---

## Security Rules in /review

The AIDD `/review` command automatically checks for these security issues. Rules are located in:

- `ai/skills/aidd-jwt-security/SKILL.md` - JWT patterns
- `ai/skills/aidd-timing-safe-compare/SKILL.md` - Secret comparison

To run a security-focused review:

```
/review
```

The review command will flag any Critical or Warning patterns found in your code.
