TAP version 13
ok 1 - Given user-service.js builds SQL queries with string concatenation, should flag SQL injection vulnerability
  # pass rate: 4/4
  # avg score: 100.00
  # actual: The review explicitly identified SQL injection in BaseModel.save(), UserService.findUser(), and UserService.deleteUser() — all three using string interpolation/concatenation to build SQL queries. Rated CRITICAL under A03:2021, listed as finding #1 in the summary table, and actionable recommendation #1 calls for replacing all SQL string interpolation with parameterized queries.
  # expected: Detection of SQL injection vulnerability stemming from string concatenation in SQL query construction within user-service.js
ok 2 - Given user-service.js assigns unsanitized user input to innerHTML, should flag XSS vulnerability
  # pass rate: 4/4
  # avg score: 99.75
  # actual: The review explicitly identifies XSS via innerHTML in renderUserProfile() as a CRITICAL finding under OWASP A03:2021 – Injection. It appears in the OWASP section ('renderUserProfile(): innerHTML with unsanitized user fields — Stored XSS'), in the summary table as item #3 (🔴 CRITICAL), and in actionable recommendation #3 with specific remediation advice (use textContent instead of innerHTML).
  # expected: The review should flag that renderUserProfile() assigns unsanitized user input (user.name, user.bio, user.website) to container.innerHTML, creating an XSS vulnerability.
not ok 3 - Given user-service.js uses class and extends keywords, should flag class usage as a best practice violation
  # pass rate: 1/4
  # avg score: 18.50
  # actual: The review identifies that UserService extends BaseModel and explicitly flags this as a best practice violation, stating 'inheritance used for code reuse of a single method. Composition preferred.' under the user-service.js Code Quality section.
  # expected: The review should flag usage of class/extends keywords as a best practice violation
ok 4 - Given user-service.js compares secrets with === operator, should flag timing-unsafe secret comparison
  # pass rate: 4/4
  # avg score: 98.75
  # actual: The review explicitly identifies the timing-unsafe === comparison in verifyApiKey() under A02:2021 – Cryptographic Failures, marking it CRITICAL. It notes that verifyApiKey uses === direct string equality and is vulnerable to timing attacks, contrasts it with the correct verifyToken() that uses crypto.timingSafeEqual, and flags that authenticate() calls the insecure path. The finding also appears in the summary table as row #4 (CRITICAL) and in recommendation #4.
  # expected: Flag that user-service.js compares secrets with === operator and that this is timing-unsafe
ok 5 - Given user-service.js uses imperative for loop with push and mutation, should flag imperative style and input mutation
  # pass rate: 4/4
  # avg score: 89.75
  # actual: The review explicitly flags the imperative for loop in processUsers, noting the biome-ignore comment suppresses a valid linter warning, and calls out in-place mutation (user.processed = true). It provides a concrete code example showing the functional filter+map alternative with spread to avoid mutation, and lists it in the summary table as finding #11 (MEDIUM: 'processUsers mutates caller's objects in-place — A08').
  # expected: Flag imperative style (index-based for loop with push) and input mutation in processUsers
ok 6 - Given user-service.js logs the auth token to console, should flag sensitive data exposure in logs
  # pass rate: 4/4
  # avg score: 99.25
  # actual: The review explicitly flags the console.log of the raw API token in authenticate() as a CRITICAL finding under both A07 and A09 OWASP categories. It appears in the OWASP A09 section ('Raw token logged to stdout on success — credential exposure in logs'), in the A07 section ('console.log of raw token — secrets exposed in logs'), in the summary table as finding #2 (🔴 CRITICAL), and in actionable recommendation #2 ('Remove console.log of token in authenticate() immediately. Rotate the API key if this code has run in production.').
  # expected: The review should flag that user-service.js logs the auth token to console, identifying this as sensitive data exposure in logs.
ok 7 - Given utils.js uses pure functions with parameter defaults, should not flag any major violations
  # pass rate: 3/4
  # avg score: 74.75
  # actual: The review correctly assessed utils.js as having good code quality, explicitly stating 'Code Quality: GOOD' and noting it uses clean functional composition, point-free style, explicit defaults, and proper patterns. The only findings against utils.js were MEDIUM (compareSecrets hash-then-=== not formally timing-safe) and LOW (missing docblocks for security-critical functions) — no major violations flagged.
  # expected: Given utils.js uses pure functions with parameter defaults, no major violations should be flagged. Minor/low-severity observations are acceptable.
not ok 8 - Given utils.js hashes secrets before comparison, should recognize correct timing-safe pattern
  # pass rate: 2/4
  # avg score: 49.25
  # actual: The review correctly identifies that utils.js uses hash-then-=== comparison and notes it 'reduces but does not eliminate timing risk', assigning it MODERATE severity and recommending an upgrade to timingSafeEqual on the digests. However, it does NOT recognize the hash-before-compare pattern as correct/safe — instead it flags it as a security concern requiring remediation.
  # expected: The review should recognize that hashing both secrets to fixed-length digests before comparing with === is a correct and accepted timing-safe pattern, since fixed-length hex digest comparison via === does not leak information about the original secret length or content.
ok 9 - Given data-fetch.js uses || for defaults instead of parameter defaults, should flag || default pattern as a style issue
  # pass rate: 4/4
  # avg score: 86.75
  # actual: The review flags the || default pattern in data-fetch.js as a bug/style issue in multiple places: in the OWASP A10 section noting `userId || 'anonymous'` coerces falsy values, in the data-fetch.js code quality section explicitly calling out `||` vs `??` as a semantic bug for the value `0`, and in the summary table listing it as finding #15 ('`||` vs `??` for `userId` default — semantic bug for `0`') and in recommendation #9 ('replace `||` with `??`').
  # expected: The review should flag the || default pattern (userId || 'anonymous') in data-fetch.js as a style/correctness issue, noting it should use parameter defaults or ?? instead
ok 10 - Given data-fetch.js uses an IIFE instead of a block scope, should flag IIFE usage
  # pass rate: 4/4
  # avg score: 93.75
  # actual: The review explicitly identifies the IIFE in data-fetch.js under the Code Quality section, noting 'IIFE in fetchUserData' as unnecessary complexity and recommending replacement with direct destructuring. It also appears in the summary table as finding #16 ('IIFE for simple destructuring — unnecessary complexity') rated LOW severity.
  # expected: The review should flag IIFE usage in data-fetch.js where it is used instead of block scope
ok 11 - Given data-fetch.js uses ALL_CAPS constant naming, should flag ALL_CAPS naming convention violation
  # pass rate: 3/4
  # avg score: 68.00
  # actual: The review explicitly states 'MAX_RETRY_COUNT, DEFAULT_TIMEOUT_MS — ALL_CAPS is a valid JS convention for module-level constants. No issue.' — it treats ALL_CAPS naming as acceptable and raises no violation.
  # expected: The review should flag ALL_CAPS constant naming as a violation of project JavaScript best practices (aidd-javascript style), which prefers camelCase for constants.
ok 12 - Given the complete review, should explicitly list all current OWASP top 10 categories
  # pass rate: 3/4
  # avg score: 86.50
  # actual: The review explicitly lists all 10 OWASP Top 10 (2021) categories: A01 Broken Access Control, A02 Cryptographic Failures, A03 Injection, A04 Insecure Design, A05 Security Misconfiguration, A06 Vulnerable and Outdated Components, A07 Identification and Authentication Failures, A08 Software and Data Integrity Failures, A09 Security Logging and Monitoring Failures, A10 SSRF. Each category is addressed with specific findings mapped to the fixture files.
  # expected: Explicit listing of all current OWASP Top 10 categories with inspection of the code changes against each
1..12
# tests 12
# pass  10
# fail  2
