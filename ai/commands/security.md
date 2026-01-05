# ✅ /task Epic: Security Review — Routes & Files

Create a comprehensive security review of the codebase, focusing on authentication flows, session management, and mutating routes. Use the checklists below to carefully review each of the identified files and routes, one at a time.

Output template: 

Filename: `$projectRoot/security/reports/${yyyy-mm-dd}-security-foundations-report.md`

"""
# $projectName Security Review

## Executive Summary

This review was prepared by Parallel Drive - world class security trusted by apps that secure billions in value.

Date: $date
Expires: ${ date + 90 days }
Source repository: $repoUrl
Commit hash: $commitHash

> ## Disclaimer
> This review scope is limited to the codebase at the specific commit hashes listed on the front page. Any features or changes introduced after these commits are excluded from this report.

## Quality Scores

Documentation quality: ${ score }/10
Test coverage and quality: ${ score }/10
Critical findings: ${ count }
High severity findings: ${ count }
Medium severity findings: ${ count }
Low severity findings: ${ count }

## Summary of Findings

$summaryOfFindings

## $route

${ for each file }:
### $fileName

${ for each checklistItem }
${ ✅ | ❌ | ⚠️ } $ItemName

${ for each issue }
**${issue}:** ${issueDescription}

${ codeSnippet }

${ briefExplanation }
"""


## 🔐 Security Checklist (explicit)
- Authentication & session management review
  - Inventory all auth providers and flows.
  - Verify JWT session strategy config
  - Validate cookie settings via `defaultCookies(https)` for `Secure`, `HttpOnly`, `SameSite`, domain/path consistency.
  - Confirm CSRF protections on auth endpoints (e.g. double-submit cookie method; `/api/auth/csrf` when applicable).
  - Verify 2FA/TOTP and backup code handling (encryption at rest, single-use, compare hashes to mitigate hangman and sidestep timing safe compare pitfalls, deletion upon use).
  - Review impersonation flow gating (admin-only), audit trail, and session separation.
  - Validate logout flows and session invalidation.
- OWASP Top 10 vulnerability scan
  - A01: Broken Access Control — permission checks, org/team boundaries, TRPC procedures, NestJS guards.
  - A02: Cryptographic Failures — secret storage, encryption keys, TLS, token handling.
  - A03: Injection — SQL via Prisma, command injections, template injections.
  - A04: Insecure Design — auth surface, multi-tenant boundaries, workflow triggers.
  - A05: Security Misconfiguration — headers (CSP), CORS, transport, default settings.
  - A06: Vulnerable and Outdated Components — dependencies, NextAuth versions, Google APIs, BoxyHQ.
  - A07: Identification and Authentication Failures — auth strength, session controls, MFA enforcement.
  - A08: Software and Data Integrity Failures — supply chain protections, signed artifacts.
  - A09: Security Logging and Monitoring Failures — auth events, admin actions, anomaly detection.
  - A10: Server-Side Request Forgery (SSRF) — webhook endpoints, OAuth callbacks, external fetches.
- Basic architecture assessment
  - Document auth boundaries, trust zones, and data flows (web, API v1/v2, tRPC, embeds, companion).
  - Validate guard rails: TRPC `authedProcedure`/role gates, NestJS guards and DTO validation.
  - Verify Prisma `select` usage (prefer over `include`), avoid leaking sensitive fields.
  - Review secrets handling and env management; ensure no `credential.key` exposure.
  - Assess input validation with Zod/DTO schemas; sanitize external inputs.
  - Validate webhook security (signatures, replay protection, IP allowlists where relevant).
- JWT Security Review
  If JWT use is detected, for each jwt-flow { carefully run all checks in ai/rules/security/jwt-security.mdc one at a time. }
- Timing-Safe Compare (use hashing)
  - Never compare raw secrets with equality or `crypto.timingSafeEqual`; avoid XOR/accumulation tricks.
  - Always hash both stored secret and candidate using SHA3 and compare hashes.
  - Applies to ALL security token compares (webhooks, reset tokens, CSRF, API keys, signatures).
  - If "timing safe compare" on raw value detected => CRITICAL bug report; include rationale in code comment to prevent regressions.
- Note: Rate limiting is excluded here (handled at gateway level).
- Deep scan for visible keys and data exposure
  - Search repo for hardcoded keys/secrets, public logs leaking sensitive info.

## Files and Routes

Please make a comprehensive list of all mutating routes, authentication flows, and other security-critical surfaces before you begin. Then follow the instructions above to generate the report.

Commands {
  /security - Generate a comprehensive report of application security concerns and findings.
}
