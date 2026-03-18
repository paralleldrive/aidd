TAP version 13
ok 1 - Given user-service.js builds SQL queries with string concatenation, should flag SQL injection vulnerability
  # pass rate: 4/4
  # avg score: 99.75
  # actual: The review explicitly identified SQL injection vulnerabilities in all three relevant locations: BaseModel.save() (line 9-13), findUser() (line 30), and deleteUser() (line 36), all due to string interpolation in SQL queries. These were flagged under OWASP A03:2021 as critical violations, and SQL injection was listed as finding #1 in the Critical priority summary with the recommendation to use parameterized queries.
  # expected: The review should flag SQL injection vulnerability in user-service.js where SQL queries are built with string concatenation
ok 2 - Given user-service.js assigns unsanitized user input to innerHTML, should flag XSS vulnerability
  # pass rate: 4/4
  # avg score: 100.00
  # actual: The review explicitly flagged XSS vulnerability under A03:2021 – Injection: 'renderUserProfile() (user-service.js:41–45): container.innerHTML set with unsanitized user.name, user.bio, user.website — critical stored/reflected XSS.' It also listed XSS as a Critical finding (#2) in the summary: 'XSS — renderUserProfile — sanitize before innerHTML or use textContent/DOM APIs.'
  # expected: Flag that user-service.js assigns unsanitized user input to innerHTML, constituting an XSS vulnerability
not ok 3 - Given user-service.js uses class and extends keywords, should flag class usage as a best practice violation
  # pass rate: 1/4
  # avg score: 20.50
  # actual: The review thoroughly covers SQL injection, XSS, timing attacks, OWASP top 10, and numerous code quality issues across all three files, but does not mention or flag the use of class/extends keywords in user-service.js as a best practice violation.
  # expected: The review should flag that user-service.js uses class and extends keywords and identify this as a JavaScript best practice violation (e.g., preferring composition/factory functions over class inheritance).
ok 4 - Given user-service.js compares secrets with === operator, should flag timing-unsafe secret comparison
  # pass rate: 4/4
  # avg score: 99.25
  # actual: The review explicitly flags timing-unsafe secret comparison in multiple places: verifyApiKey() at user-service.js:49 uses === for secret comparison (flagged under A02 Cryptographic Failures and in the Security Deep Scan section), and is listed as Critical finding #3. The review also notes that authenticate() calls verifyApiKey instead of the safer verifyToken.
  # expected: Detection that user-service.js compares secrets with === operator and flags it as timing-unsafe
ok 5 - Given user-service.js uses imperative for loop with push and mutation, should flag imperative style and input mutation
  # pass rate: 4/4
  # avg score: 83.50
  # actual: The review flags imperative style (biome-ignore suppression for for loop, noting the index isn't needed and for...of would work) and explicitly calls out that processUsers mutates input objects in place (user.processed = true), labeling it an invisible side effect and recommending returning new objects instead.
  # expected: Flag imperative style (for loop with push) and input mutation in user-service.js
ok 6 - Given user-service.js logs the auth token to console, should flag sensitive data exposure in logs
  # pass rate: 4/4
  # avg score: 99.50
  # actual: The review explicitly flags sensitive data exposure in logs in multiple places: A02 (Cryptographic Failures) notes 'authenticate() (user-service.js:63) logs the raw auth token to console — sensitive data exposure', A05 (Security Misconfiguration) flags 'console.log(\"Auth successful for token:\", token) — production log leaking credentials', A09 (Security Logging and Monitoring Failures) reiterates 'Token value logged on successful auth', and it appears as Critical finding #4: 'Auth token logged — authenticate() logs raw credential.'
  # expected: The review should flag that user-service.js logs the auth token to console, identifying it as sensitive data exposure in logs
ok 7 - Given utils.js uses pure functions with parameter defaults, should not flag any major violations
  # pass rate: 3/4
  # avg score: 70.00
  # actual: The review flagged two issues on utils.js: (1) compareSecrets uses === instead of crypto.timingSafeEqual on hash buffers — classified as High severity, and (2) hashSecret may be inappropriate for passwords — classified as a code quality concern. These are presented as meaningful violations requiring remediation.
  # expected: Given that utils.js uses pure functions with parameter defaults, the review should not flag any major violations. Minor style notes are acceptable, but no High or Critical findings should be raised against utils.js.
not ok 8 - Given utils.js hashes secrets before comparison, should recognize correct timing-safe pattern
  # pass rate: 0/4
  # avg score: 18.75
  # actual: The review correctly identified that compareSecrets uses SHA3-256 hashing before comparison (equalizing output length to 64 hex chars), which eliminates length-based timing attacks. However, it then flagged this as a timing vulnerability and criticized it, stating JS string === is not architecturally constant-time and recommending timingSafeEqual on the hash buffers. The review did not recognize the hash-before-compare pattern as a correct/accepted timing-safe approach.
  # expected: The review should recognize that hashing secrets before comparison is a valid and correct timing-safe pattern, since hash output is fixed-length, eliminating length-based timing oracles. It should acknowledge this as correct implementation rather than flagging it as a violation.
ok 9 - Given data-fetch.js uses || for defaults instead of parameter defaults, should flag || default pattern as a style issue
  # pass rate: 4/4
  # avg score: 93.00
  # actual: The review flagged the || default pattern in data-fetch.js line 3, noting that falsy coercion will replace 0, '', false with 'anonymous' and recommending ?? (nullish coalescing) or a default parameter instead. It is listed as a Medium/Low style finding (#15 in the summary).
  # expected: The review should flag the || default pattern in data-fetch.js as a style issue
ok 10 - Given data-fetch.js uses an IIFE instead of a block scope, should flag IIFE usage
  # pass rate: 4/4
  # avg score: 94.50
  # actual: The review explicitly flags the IIFE in data-fetch.js under 'Unnecessary IIFE (lines 14–18)', calls it a code smell, shows the code, and recommends replacing it with simple destructuring. It is listed as finding #14 in the Medium priority summary.
  # expected: The review should flag IIFE usage in data-fetch.js where block scope would be more appropriate
not ok 11 - Given data-fetch.js uses ALL_CAPS constant naming, should flag ALL_CAPS naming convention violation
  # pass rate: 1/4
  # avg score: 29.50
  # actual: The review mentions DEFAULT_TIMEOUT_MS and MAX_RETRY_COUNT (finding #13 and #18) but only flags semantic issues (misnamed constant, exported internals). It does not flag ALL_CAPS naming convention itself as a violation.
  # expected: The review should explicitly flag the use of ALL_CAPS constant naming (e.g., DEFAULT_TIMEOUT_MS, MAX_RETRY_COUNT) as a naming convention violation
ok 12 - Given the complete review, should explicitly list all current OWASP top 10 categories
  # pass rate: 4/4
  # avg score: 98.00
  # actual: The review explicitly lists all 10 OWASP Top 10 (2021) categories: A01 Broken Access Control, A02 Cryptographic Failures, A03 Injection, A04 Insecure Design, A05 Security Misconfiguration, A06 Vulnerable and Outdated Components, A07 Identification and Authentication Failures, A08 Software and Data Integrity Failures, A09 Security Logging and Monitoring Failures, A10 Server-Side Request Forgery. Each category is labeled with its full name and year, assessed against the code, and findings or lack thereof are noted.
  # expected: Explicit enumeration of all current OWASP Top 10 categories (2021 edition) with each category named and assessed
1..12
# tests 12
# pass  9
# fail  3
