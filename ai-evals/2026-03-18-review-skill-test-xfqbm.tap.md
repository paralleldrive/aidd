TAP version 13
ok 1 - Given user-service.js builds SQL queries with string concatenation, should flag SQL injection vulnerability
  # pass rate: 4/4
  # avg score: 100.00
  # actual: The review explicitly identified SQL injection vulnerabilities in three locations: BaseModel.save() using string interpolation for column names and values, UserService.findUser() using template literal with username, and UserService.deleteUser() using template literal with id. Classified as CRITICAL under OWASP A03:2021, with detailed exploitation examples and fix recommendations to use parameterized queries.
  # expected: Flag SQL injection vulnerability from string concatenation in user-service.js SQL queries
ok 2 - Given user-service.js assigns unsanitized user input to innerHTML, should flag XSS vulnerability
  # pass rate: 4/4
  # avg score: 99.25
  # actual: The review explicitly flags XSS vulnerability in renderUserProfile (line 39-46) as CRITICAL severity, showing the innerHTML interpolation code, explaining the attack vector (stored XSS via user.website/bio/name), mapping it to OWASP A03:2021, and recommending textContent or DOMPurify as remediation. It appears in both the detailed findings and the priority fix list.
  # expected: Detection and flagging of XSS vulnerability caused by assigning unsanitized user input to innerHTML in user-service.js
ok 3 - Given user-service.js uses class and extends keywords, should flag class usage as a best practice violation
  # pass rate: 3/4
  # avg score: 73.25
  # actual: The review covers SQL injection, XSS, timing attacks, logging failures, in-memory state drift, input mutation, architectural concerns (DOM in service class), and OWASP top 10. It does not mention class/extends usage as a best practice violation.
  # expected: The review should flag the use of class and extends keywords in user-service.js as a violation of JavaScript best practices (likely per the aidd-javascript skill which may prefer functional/compositional patterns over class-based OOP).
ok 4 - Given user-service.js compares secrets with === operator, should flag timing-unsafe secret comparison
  # pass rate: 4/4
  # avg score: 98.75
  # actual: The review explicitly identifies timing-unsafe comparison in verifyApiKey (line 48-50) using === operator, marks it as CRITICAL severity (OWASP A07:2021), explains the timing side-channel risk, notes the inconsistency with verifyToken which correctly uses crypto.timingSafeEqual, and recommends the fix. Also catches compareSecrets in utils.js using === on hashed values as HIGH severity.
  # expected: Flag that user-service.js compares secrets with === operator as timing-unsafe
ok 5 - Given user-service.js uses imperative for loop with push and mutation, should flag imperative style and input mutation
  # pass rate: 4/4
  # avg score: 96.00
  # actual: The review explicitly flags both the imperative style and input mutation in processUsers. Under '🟡 MEDIUM — Input Mutation in processUsers', it identifies that user.processed = true mutates the input array's objects (references), notes the imperative loop with mutation is unnecessary, and recommends the idiomatic filter/map pipeline as side-effect-free. It also notes the biome-ignore comment masks the issue rather than fixing it.
  # expected: Flag imperative for loop style and input mutation in processUsers in user-service.js
ok 6 - Given user-service.js logs the auth token to console, should flag sensitive data exposure in logs
  # pass rate: 4/4
  # avg score: 99.00
  # actual: The review explicitly flags sensitive data exposure in logs under a dedicated HIGH severity finding titled 'Sensitive Data in Logs (OWASP A09:2021 — Logging and Monitoring Failures)'. It identifies the exact line in authenticate() where the raw token is logged via console.log, explains the security risk (exposure to log storage, aggregators, log access), and includes it in the OWASP checklist (A09: FAIL) and the priority fix list (#4: 'Token logged in authenticate — Remove or replace with safe identifier').
  # expected: The review should flag that user-service.js logs the auth token to console, identifying this as sensitive data exposure in logs
not ok 7 - Given utils.js uses pure functions with parameter defaults, should not flag any CRITICAL or HIGH severity violations
  # pass rate: 1/4
  # avg score: 70.25
  # actual: The review flagged a HIGH severity violation in utils.js: 'compareSecrets Is Not Timing-Safe (OWASP A02:2021 — Cryptographic Failures)' with severity marked as High (and Critical if used for password storage). It also flagged LOW severity issues for hashSecret missing salt.
  # expected: No CRITICAL or HIGH severity violations should be flagged for utils.js, given that it uses pure functions with parameter defaults.
ok 8 - Given utils.js hashes secrets before comparison, should recognize hash-before-compare as the correct timing-safe pattern per project standards
  # pass rate: 3/4
  # avg score: 74.50
  # actual: The review explicitly states that hash-before-compare with === is 'not a substitute for crypto.timingSafeEqual' and flags it as HIGH severity, arguing that V8 may optimize string comparisons in ways that leak timing. It treats the pattern as incorrect and recommends changing to timingSafeEqual on Buffer outputs.
  # expected: The review should recognize that hashing secrets before comparison (hash-before-compare) is the correct timing-safe pattern per project standards, and treat it as acceptable or compliant rather than flagging it as a high severity vulnerability.
ok 9 - Given data-fetch.js uses || for defaults instead of parameter defaults, should flag || default pattern as a style issue
  # pass rate: 4/4
  # avg score: 96.75
  # actual: The review flags the || falsy check in data-fetch.js line 3 as a MEDIUM severity issue, explaining that || treats 0, '', false as falsy and recommends ?? (nullish coalescing) instead. It notes the comment in the code acknowledges this as intentional but still correctly identifies it as a style/correctness issue.
  # expected: The review should flag the || default pattern in data-fetch.js as a style issue
ok 10 - Given data-fetch.js uses an IIFE instead of a block scope, should flag IIFE usage
  # pass rate: 4/4
  # avg score: 95.50
  # actual: The review flagged IIFE usage in data-fetch.js under 'Unnecessary IIFE in fetchUserData' (LOW severity), noting lines 14-18 and suggesting simpler destructuring as an alternative.
  # expected: A flag on IIFE usage in data-fetch.js with a note that a block scope or simpler alternative would be cleaner
ok 11 - Given data-fetch.js uses ALL_CAPS constant naming, should flag ALL_CAPS naming convention violation
  # pass rate: 3/4
  # avg score: 76.25
  # actual: The review mentions DEFAULT_TIMEOUT_MS but only flags it for semantic mismatch (the variable is used as a retry delay, not a fetch timeout). The ALL_CAPS naming convention itself is never identified as a violation.
  # expected: The review should explicitly flag the use of ALL_CAPS constant naming (e.g., DEFAULT_TIMEOUT_MS) as a naming convention violation per project JavaScript standards
ok 12 - Given the complete review, should explicitly list all current OWASP top 10 categories
  # pass rate: 4/4
  # avg score: 96.25
  # actual: The review includes a complete OWASP Top 10 (2021) checklist table listing all 10 categories: A01 Broken Access Control, A02 Cryptographic Failures, A03 Injection, A04 Insecure Design, A05 Security Misconfiguration, A06 Vulnerable/Outdated Components, A07 Identification & Auth Failures, A08 Software & Data Integrity, A09 Security Logging & Monitoring, A10 SSRF. Each entry includes a status and location/notes.
  # expected: Explicit listing of all current OWASP Top 10 categories with assessment of whether each applies to the reviewed code
1..12
# tests 12
# pass  11
# fail  1
