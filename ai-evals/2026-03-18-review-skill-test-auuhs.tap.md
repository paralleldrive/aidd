TAP version 13
ok 1 - Given user-service.js builds SQL queries with string concatenation, should flag SQL injection vulnerability
  # pass rate: 4/4
  # avg score: 100.00
  # actual: The review explicitly identified SQL injection vulnerabilities at three specific locations in user-service.js: lines 9-13 (BaseModel.save() with raw string interpolation of column names and values), lines 29-31 (findUser with username interpolated directly into query string), and line 36 (deleteUser with raw id interpolation). All three were rated Critical severity and listed as the #1 priority fix in the summary.
  # expected: Detection and flagging of SQL injection vulnerability due to string concatenation in SQL query construction in user-service.js
ok 2 - Given user-service.js assigns unsanitized user input to innerHTML, should flag XSS vulnerability
  # pass rate: 4/4
  # avg score: 99.75
  # actual: The review explicitly identified the XSS vulnerability in user-service.js at lines 41-45, flagging it as Critical severity in multiple locations: Step 6 (OWASP A03 Injection), Step 7 (UI/UX), and the final summary table. The finding notes that `container.innerHTML` receives unsanitized user data (user.name, user.bio, user.website) and recommends using textContent or a sanitizer instead.
  # expected: Detection and flagging of the XSS vulnerability caused by assigning unsanitized user input to innerHTML in user-service.js
not ok 3 - Given user-service.js uses class and extends keywords, should flag class usage as a best practice violation
  # pass rate: 2/4
  # avg score: 50.75
  # actual: The review explicitly flags class/extends usage in user-service.js as a violation. In Step 2 (Code Structure): 'user-service.js:3 — class BaseModel — avoid class/extends; use function composition (Medium)' and 'user-service.js:17 — UserService extends BaseModel — inheritance anti-pattern (Medium)'. In Step 3 (Coding Standards): 'Uses class/extends — violates Avoid class and extends as much as possible (line 3, 17)'. In Step 8 (Architecture): 'Inheritance (BaseModel → UserService) is used where composition or simple function modules would suffice.' Also appears in the Medium priority summary findings (#10).
  # expected: The review should identify that user-service.js uses class and extends keywords and flag this as a best practice violation
ok 4 - Given user-service.js compares secrets with === operator, should flag timing-unsafe secret comparison
  # pass rate: 4/4
  # avg score: 99.75
  # actual: The review explicitly identified the timing-unsafe comparison at user-service.js:48-50 where `candidateKey === storedKey` is used for raw string equality on secrets. It categorized this as CRITICAL under A02:2021 Cryptographic Failures, labeled it a 'Timing oracle attack possible', and listed it as finding #3 in the Critical section with a specific fix recommendation to use SHA3-256 hash comparison (pointing to utils.compareSecrets as the correct pattern).
  # expected: Detection and flagging of timing-unsafe secret comparison using === operator in user-service.js
ok 5 - Given user-service.js uses imperative for loop with push and mutation, should flag imperative style and input mutation
  # pass rate: 4/4
  # avg score: 90.50
  # actual: The review explicitly flags the imperative for loop in user-service.js:69-79 as 'Imperative loop with mutation instead of filter+map' (Medium severity), and separately flags user.processed = true at line 73-76 as mutating input array elements (Medium severity). Both issues appear in the findings table under Step 3 and are repeated in the Summary as items 9 and 11.
  # expected: The review should flag the imperative for loop with push and the mutation of input objects (user.processed = true) in user-service.js processUsers method
ok 6 - Given user-service.js logs the auth token to console, should flag sensitive data exposure in logs
  # pass rate: 4/4
  # avg score: 98.50
  # actual: The review explicitly flags sensitive data exposure in logs under A09:2021 (Security Logging and Monitoring Failures) and A02:2021. It identifies user-service.js:63 where `console.log('Auth successful for token:', token)` logs the raw authorization token, noting that any log aggregation system will contain plaintext credentials. This is listed as HIGH severity and appears in both the OWASP table and the prioritized findings summary (#4 in High severity items).
  # expected: The review should identify that user-service.js logs the auth token to console and flag this as sensitive data exposure in logs.
not ok 7 - Given utils.js uses pure functions with parameter defaults, should not flag any CRITICAL or HIGH severity violations
  # pass rate: 1/4
  # avg score: 29.50
  # actual: The review correctly assessed utils.js as 'Passing — Clean, correct, well-structured' with no Critical or High severity violations. The only note about utils.js was a minor optional suggestion that the compareSecrets docblock 'could note why hashing (not just what)' and the absence of tests rated as 'High' — however this High severity finding applied to ALL THREE files collectively, not specifically to utils.js's code quality. The utils.js-specific findings were all complimentary or absent from the severity tables.
  # expected: utils.js should receive no CRITICAL or HIGH severity violations given its pure functions and parameter defaults
not ok 8 - Given utils.js hashes secrets before comparison, should recognize hash-before-compare as the correct timing-safe pattern per project standards
  # pass rate: 1/4
  # avg score: 31.00
  # actual: The review explicitly identifies utils.js compareSecrets() as using the correct pattern: 'Correctly uses hashSecret(candidate) === hashSecret(stored) with SHA3-256. PASS ✓' under A02 Cryptographic Failures. It also states in the verdict section: 'utils.js already demonstrates the correct patterns (SHA3-256 comparison, functional style, named exports, parameter defaults) that the other two files should adopt as a reference.' Furthermore, the Critical findings section recommends fixing user-service.js's direct === comparison by referencing 'see utils.compareSecrets for the correct pattern already in this codebase.'
  # expected: Recognition that utils.js hashes secrets before comparison and identification of this as the correct timing-safe pattern per project standards
ok 9 - Given data-fetch.js uses || for defaults instead of parameter defaults, should flag || default pattern as a style issue
  # pass rate: 4/4
  # avg score: 95.00
  # actual: The review explicitly flags data-fetch.js line 3 use of `|| 'anonymous'` as a violation: 'Line 3: `const id = userId || \"anonymous\"` — violates \"Avoid using `||` for defaults. Use parameter defaults instead.\" Should be `async (userId = 'anonymous') =>`'. This appears in Step 3 findings table as severity Low and again in the Summary section item #14.
  # expected: The review flags the || default pattern in data-fetch.js as a style issue
ok 10 - Given data-fetch.js uses an IIFE instead of a block scope, should flag IIFE usage
  # pass rate: 4/4
  # avg score: 97.00
  # actual: The review explicitly flags the IIFE in data-fetch.js at lines 14-18, citing it as 'explicitly prohibited' per aidd-javascript standards, noting it violates KISS, and recommending replacement with direct destructuring. It appears in both the detailed findings table (Step 3) and the prioritized summary (item #15 Low severity).
  # expected: The review should flag IIFE usage in data-fetch.js
not ok 11 - Given data-fetch.js uses ALL_CAPS constant naming, should flag ALL_CAPS naming convention violation
  # pass rate: 2/4
  # avg score: 52.50
  # actual: The review explicitly flags ALL_CAPS constant naming in data-fetch.js at lines 32-33 (MAX_RETRY_COUNT, DEFAULT_TIMEOUT_MS), citing the aidd-javascript NamingConstraints rule against ALL_CAPS for constants, with a Low severity rating and recommendation to use camelCase.
  # expected: Detection and flagging of ALL_CAPS constant naming convention violation in data-fetch.js
ok 12 - Given the complete review, should explicitly list all current OWASP top 10 categories
  # pass rate: 4/4
  # avg score: 98.25
  # actual: The review explicitly lists all 10 OWASP Top 10 (2021) categories: A01 Broken Access Control, A02 Cryptographic Failures, A03 Injection, A04 Insecure Design, A05 Security Misconfiguration, A06 Vulnerable and Outdated Components, A07 Identification and Authentication Failures, A08 Software and Data Integrity Failures, A09 Security Logging and Monitoring Failures, A10 Server-Side Request Forgery. Each category is addressed with findings, status (FAIL/PASS/N/A), location, and severity. A summary table consolidates all results.
  # expected: Explicit listing of all current OWASP Top 10 categories with assessment of each against the reviewed code
1..12
# tests 12
# pass  8
# fail  4
