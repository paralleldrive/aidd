TAP version 13
ok 1 - Given user-service.js builds SQL queries with string concatenation, should flag SQL injection vulnerability
  # pass rate: 4/4
  # avg score: 99.75
  # actual: The review explicitly identifies SQL injection vulnerabilities in BaseModel.save, findUser, and deleteUser, citing string interpolation of user-controlled values, providing specific examples of exploit payloads, and flagging it as A03:2021 — Injection with CRITICAL severity. It is listed as P0 finding #1 with a clear remediation recommendation.
  # expected: Detection and flagging of SQL injection vulnerability due to string concatenation in SQL query building in user-service.js
ok 2 - Given user-service.js assigns unsanitized user input to innerHTML, should flag XSS vulnerability
  # pass rate: 4/4
  # avg score: 100.00
  # actual: The review explicitly identifies XSS vulnerability in renderUserProfile() citing innerHTML usage with unsanitized user.name, user.bio, and user.website fields. It is flagged as P0-Critical under OWASP A03 Injection, with a concrete exploit example (onerror payload), and remediation advice to use textContent or a DOM sanitizer.
  # expected: Detection of XSS vulnerability from unsanitized user input assigned to innerHTML in user-service.js
not ok 3 - Given user-service.js uses class and extends keywords, should flag class usage as a best practice violation
  # pass rate: 0/4
  # avg score: 6.25
  # actual: The review extensively covers SQL injection, XSS, timing attacks, token logging, SRP violations, mutation issues, and other problems in user-service.js. It mentions 'UserService extends BaseModel: Inheritance used for code sharing of a single save() method. Composition would be more appropriate — the \"is-a\" relationship is not semantically meaningful.' However, it does not flag the use of class and extends keywords themselves as a JavaScript best practice violation.
  # expected: The review should explicitly flag the use of class and extends keywords as a best practice violation in JavaScript/Node.js context, per the aidd-javascript skill criteria.
ok 4 - Given user-service.js compares secrets with === operator, should flag timing-unsafe secret comparison
  # pass rate: 4/4
  # avg score: 99.00
  # actual: The review explicitly flags timing-unsafe secret comparison in user-service.js multiple times: under A02 Cryptographic Failures it notes 'verifyApiKey() (line 48–50): Uses === for API key comparison. This is a timing attack vulnerability.' It also appears in P0 Critical findings (#3) and the summary table marks user-service.js CRITICAL for Timing Attack.
  # expected: The review should flag that user-service.js uses === for secret comparison, identifying it as timing-unsafe
ok 5 - Given user-service.js uses imperative for loop with push and mutation, should flag imperative style and input mutation
  # pass rate: 4/4
  # avg score: 82.50
  # actual: The review explicitly flags the imperative for loop in processUsers (line 71) with a biome-ignore suppression, noting the rationale is weak and a filter+map chain would eliminate the need for the index. It also flags user.processed = true (line 75) as mutating the original object reference from the input list, recommending { ...user, processed: true } instead. Both issues appear in Step 3 (Coding Standards) and are escalated as P2 findings (#9 and #17).
  # expected: The review should flag the imperative for loop with push style and the input mutation in processUsers in user-service.js
ok 6 - Given user-service.js logs the auth token to console, should flag sensitive data exposure in logs
  # pass rate: 4/4
  # avg score: 100.00
  # actual: The review explicitly flags the console.log of the auth token in plaintext on line 63 of user-service.js. It appears under A02 Cryptographic Failures ('console.log(\"Auth successful for token:\", token) — logs the raw authorization token in plaintext. This is a serious credential exposure risk in any environment where logs are collected (SIEM, CloudWatch, Datadog, etc.)'), under A05 Security Misconfiguration ('console.log of auth token (line 63) constitutes a misconfiguration of logging'), under A09 Security Logging and Monitoring Failures, and is listed as a P0 Critical finding ('Auth token logged in plaintext — Remove line 63 console.log immediately').
  # expected: The review should flag that user-service.js logs the auth token to console, identifying it as sensitive data exposure in logs
not ok 7 - Given utils.js uses pure functions with parameter defaults, should not flag any CRITICAL or HIGH severity violations
  # pass rate: 0/4
  # avg score: 16.25
  # actual: The review flagged a MEDIUM severity cryptographic issue against utils.js: the compareSecrets function uses === for final hash string comparison instead of crypto.timingSafeEqual, described as a P1 (High) finding in item 5 of the prioritized findings. The summary table also marks utils.js with 'Medium' in the Timing Attack column.
  # expected: No CRITICAL or HIGH severity violations should be flagged for utils.js, given that it uses pure functions with parameter defaults
not ok 8 - Given utils.js hashes secrets before comparison, should recognize hash-before-compare as the correct timing-safe pattern per project standards
  # pass rate: 0/4
  # avg score: 7.50
  # actual: The review explicitly flags compareSecrets in utils.js as NOT timing-safe because the final === comparison of hash strings is not constant-time, and recommends replacing it with crypto.timingSafeEqual on Buffer values. It treats the hash-before-compare pattern as insufficient and marks it as a P1 High finding.
  # expected: The review should recognize that hashing secrets before comparison (hash-before-compare) is the correct timing-safe pattern per project standards, and acknowledge it as a valid approach rather than flagging it as a security issue.
ok 9 - Given data-fetch.js uses || for defaults instead of parameter defaults, should flag || default pattern as a style issue
  # pass rate: 4/4
  # avg score: 85.25
  # actual: The review explicitly flags the || default pattern in data-fetch.js line 3: '`userId || \"anonymous\"` uses falsy coalescing. `userId = 0` would silently become `\"anonymous\"`. Use `userId ?? \"anonymous\"` or a parameter default `userId = \"anonymous\"`.' It appears in Step 3 (Coding Standards) and is also listed as P2 finding #11.
  # expected: The review flags the || default pattern in data-fetch.js as a style/correctness issue
ok 10 - Given data-fetch.js uses an IIFE instead of a block scope, should flag IIFE usage
  # pass rate: 4/4
  # avg score: 93.00
  # actual: The review explicitly identifies the IIFE in data-fetch.js (lines 14–18) and flags it as unnecessary, stating 'The IIFE serves no purpose. It should be `const { name, email } = data; return { email, id, name };`'. It also references the self-annotated anti-pattern comment in the file ('// IIFE instead of block scope') and criticizes leaving acknowledged anti-patterns in place without fixing them.
  # expected: The review should flag IIFE usage in data-fetch.js where an IIFE is used instead of block scope
not ok 11 - Given data-fetch.js uses ALL_CAPS constant naming, should flag ALL_CAPS naming convention violation
  # pass rate: 0/4
  # avg score: 6.25
  # actual: The review flags that DEFAULT_TIMEOUT_MS is misnamed (should be RETRY_DELAY_MS) and that MAX_RETRY_COUNT and DEFAULT_TIMEOUT_MS should not be exported as implementation details. It does not flag the ALL_CAPS naming convention itself as a violation — in fact, it implicitly accepts ALL_CAPS as correct style by only critiquing the semantic mismatch of the name, not the casing convention.
  # expected: The review should flag that data-fetch.js uses ALL_CAPS constant naming (e.g., MAX_RETRY_COUNT, DEFAULT_TIMEOUT_MS) as a naming convention violation, presumably because the project style guide or JavaScript best practices prefer camelCase or another convention for constants.
ok 12 - Given the complete review, should explicitly list all current OWASP top 10 categories
  # pass rate: 4/4
  # avg score: 98.25
  # actual: The review explicitly lists all 10 OWASP Top 10 2021 categories: A01 Broken Access Control, A02 Cryptographic Failures, A03 Injection, A04 Insecure Design, A05 Security Misconfiguration, A06 Vulnerable and Outdated Components, A07 Identification and Authentication Failures, A08 Software and Data Integrity Failures, A09 Security Logging and Monitoring Failures, A10 Server-Side Request Forgery. Each category includes a pass/fail verdict and specific findings from the code under review.
  # expected: All current OWASP Top 10 categories explicitly listed and reviewed
1..12
# tests 12
# pass  8
# fail  4
