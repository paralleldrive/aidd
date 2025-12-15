# Security Review Rules Epic

**Epic Goal**: Add security checks for authentication, JWT, and token handling to the /review command

**Status**: ✅ COMPLETED
**Created**: 2025-12-14
**Completed**: 2025-12-14
**Estimated Effort**: Small

## Epic Overview

Enhance the `/review` command with security rules that flag common authentication and token handling vulnerabilities. Focus on JWT security (which has historically been riddled with implementation errors) and secure token storage.

**Context**: JWT implementations frequently contain security bugs. The review command should proactively flag insecure patterns and recommend secure alternatives like opaque tokens with server-side sessions.

**Success Criteria**:

- [x] JWT security rule created with SudoLang pattern syntax
- [x] Review command references JWT security rule
- [x] Severity levels (Critical/Warn) assigned to patterns
- [x] Code-level security hardening (path traversal, prototype pollution)

---

## Task 1: Create JWT Security Rule

**Context**: JWT has many common pitfalls that should be flagged during review

**Requirements**:

- Given authentication code, should flag insecure JWT patterns
- Given localStorage/sessionStorage token storage, should flag as Critical
- Given proper cookie-based auth, should NOT flag (like our CSRF implementation)
- Given JWT usage at all, should recommend alternatives

**Success Criteria**:

- [x] `ai/rules/security/jwt-security.mdc` created
- [x] Uses SudoLang semantic pattern matching syntax
- [x] Includes severity levels (Critical/Warn)
- [x] Recommends opaque tokens + server sessions as preferred approach

**Dependencies**: None
**Estimated Effort**: Small

**Patterns Flagged**:

```
Patterns {
  (token in localStorage or sessionStorage) => Critical: XSS vulnerable
  (JWT 'none' algorithm) => Critical: Signature bypass
  (JWT verification disabled) => Critical: Always verify
  (jwt.decode without verify) => Critical: Use jwt.verify()
  (JWT expiration ignored) => Critical: Always check expiration
  (HS256 shared across services) => Critical: Use asymmetric algorithms
  (access token lifetime >= 1 day) => Warn: Use short-lived tokens
  (JWT detected) => Warn: Consider opaque tokens
}
```

---

## Task 2: Integrate with Review Command

**Context**: Review command should automatically apply JWT security rule

**Requirements**:

- Given authentication code review, should reference jwt-security.mdc
- Given review criteria, should list JWT patterns to check
- Given existing timing-safe-compare rule, should work alongside it

**Success Criteria**:

- [x] `ai/rules/review.mdc` updated with JWT security reference
- [x] Criteria section includes JWT security guidance
- [x] Complements existing timing-safe-compare rule

**Dependencies**: Task 1
**Estimated Effort**: Small

**Review.mdc Addition**:
```
Use security/jwt-security.mdc when reviewing authentication code.
Flag localStorage/sessionStorage token storage, 'none' algorithm,
disabled verification, or long-lived tokens as CRITICAL.
Recommend opaque tokens with httpOnly cookies over JWT.
```

---

## Task 3: Code-Level Security Hardening

**Context**: Index generator handles user-provided filenames and YAML content

**Requirements**:

- Given filename with path traversal (../), should reject
- Given YAML with __proto__/prototype/constructor, should filter
- Given symlinks in directory tree, should skip to prevent infinite recursion

**Success Criteria**:

- [x] `validateFilename()` rejects path traversal attempts
- [x] `parseFrontmatter()` filters prototype pollution keys
- [x] `generateIndexRecursive()` skips symlinks
- [x] Max recursion depth (10) prevents stack overflow
- [x] Unit tests cover security scenarios

**Dependencies**: None
**Estimated Effort**: Small

---

## Security Recommendations Summary

### Avoid JWT if possible. Preferred secure approach:

1. **Token Storage**: Use opaque access tokens with server-side sessions or token introspection
2. **Token Lifecycle**: Keep access tokens short-lived, use refresh token rotation
3. **Browser Storage**: httpOnly Secure SameSite cookies, NEVER localStorage
4. **Sender Constraints**: For public clients, prefer DPoP or mTLS when feasible
5. **Additional Protections**: Cookies don't stop XSS/CSRF - enforce SameSite, add CSRF tokens, deploy tight CSP

### If JWT is required:

- Asymmetric algorithms (RS256/ES256)
- Short expiration (≤15 min for access tokens)
- httpOnly Secure SameSite cookies
- CSRF protection
- Refresh token rotation

---

## Files Created/Modified

**New Files**:
- `ai/rules/security/jwt-security.mdc` - JWT security review rule

**Modified Files**:
- `ai/rules/review.mdc` - Added JWT security reference
- `ai/rules/security/index.md` - Updated with JWT security entry
- `lib/index-generator.js` - Added validateFilename, prototype pollution protection
