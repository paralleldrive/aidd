# Security Review Checklist

## OWASP Top 10 (2021)

### A01: Broken Access Control
- [ ] Authorization checks on all protected routes
- [ ] No direct object reference vulnerabilities
- [ ] CORS properly configured
- [ ] No privilege escalation paths

### A02: Cryptographic Failures
- [ ] Sensitive data encrypted at rest
- [ ] TLS for data in transit
- [ ] Strong hashing for passwords (bcrypt, argon2)
- [ ] No hardcoded secrets

### A03: Injection
- [ ] Parameterized queries (no string concatenation)
- [ ] Input validation and sanitization
- [ ] No eval() or similar with user input
- [ ] Command injection prevention

### A04: Insecure Design
- [ ] Threat modeling considered
- [ ] Defense in depth
- [ ] Principle of least privilege
- [ ] Secure defaults

### A05: Security Misconfiguration
- [ ] No default credentials
- [ ] Error messages don't leak info
- [ ] Security headers configured
- [ ] Unnecessary features disabled

### A06: Vulnerable Components
- [ ] Dependencies up to date
- [ ] No known vulnerabilities (npm audit)
- [ ] Components from trusted sources

### A07: Authentication Failures
- [ ] Strong password requirements
- [ ] Account lockout after failures
- [ ] Secure session management

### A08: Data Integrity Failures
- [ ] Signed updates and data
- [ ] CI/CD pipeline secured
- [ ] Serialization validated

### A09: Logging Failures
- [ ] Authentication events logged
- [ ] Access control failures logged
- [ ] No sensitive data in logs

### A10: SSRF
- [ ] URL validation for user input
- [ ] Allowlists for external requests

## Timing-Safe Comparisons

For comparing secrets (tokens, API keys, session IDs), use SHA3-256 hashing.

**Never use** direct comparison or timing-safe functions:
- `crypto.timingSafeEqual` - vulnerable to compiler optimizations
- Direct string comparison (`===`) - timing oracle attack

```javascript
// Bad - timing oracle attack
if (token === storedToken) { }

// Bad - vulnerable to subtle bugs
import { timingSafeEqual } from 'crypto'
timingSafeEqual(Buffer.from(token), Buffer.from(storedToken))

// Good - SHA3-256 hashing
import { createHash } from 'crypto'
const hash = (t) => createHash('sha3-256').update(t).digest('hex')
const isValid = hash(token) === hash(storedToken)
```

See `ai/rules/security/timing-safe-compare.mdc` for rationale.

## JWT Security
- Prefer opaque tokens over JWT for sessions
- Validate signature, expiration, issuer, audience
- Use strong algorithms (RS256, ES256)

## CSRF Protection
- Anti-CSRF tokens for state-changing operations
- SameSite cookie attribute
- Verify Origin/Referer headers
