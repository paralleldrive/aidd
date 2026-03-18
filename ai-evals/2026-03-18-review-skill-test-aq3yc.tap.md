TAP version 13
ok 1 - Given user-service.js builds SQL queries with string concatenation, should flag SQL injection vulnerability
  # pass rate: 4/4
  # avg score: 100.00
  # actual: The review identified three distinct SQL injection vulnerabilities in user-service.js: BaseModel.save() at lines 9-14 (interpolating both column names and values directly), findUser() at lines 29-32 (interpolating username into a SELECT query), and deleteUser() at lines 35-37 (interpolating id without parameterization). All three were marked CRITICAL under OWASP A03: Injection and appeared in the Critical issues table as C1, C2, C3 with specific line references and remediation guidance (use parameterized queries).
  # expected: Detection of SQL injection vulnerability due to string concatenation in SQL query construction in user-service.js
ok 2 - Given user-service.js assigns unsanitized user input to innerHTML, should flag XSS vulnerability
  # pass rate: 4/4
  # avg score: 100.00
  # actual: The review explicitly identifies XSS vulnerability at user-service.js:40-46 where user.name, user.bio, and user.website are interpolated unescaped into innerHTML. It flags this as CRITICAL under both A03 and a standalone Additional Security Findings section, notes that user.website is particularly dangerous (script injection, javascript: href), and recommends using textContent or a sanitizer. It also appears in the Critical summary table as C4.
  # expected: Detection of XSS vulnerability caused by assigning unsanitized user input to innerHTML in user-service.js
ok 3 - Given user-service.js uses class and extends keywords, should flag class usage as a best practice violation
  # pass rate: 3/4
  # avg score: 75.75
  # actual: The review explicitly flags class inheritance as a violation in multiple places: Step 2 notes 'aidd-javascript skill explicitly prohibits class inheritance' and lists 'user-service.js:3–15 — BaseModel class exists solely to enable inheritance. Extract as a standalone save(db, table, data) function' and 'user-service.js:17 — class UserService extends BaseModel — replace with composed functions per aidd-javascript'. Step 3 labels it [HIGH] 'Class inheritance antipattern (lines 3–83)'. The summary table H3 also lists it as a High severity issue.
  # expected: The review should flag the use of class and extends keywords in user-service.js as a best practice violation, referencing the aidd-javascript skill's prohibition on class inheritance in favor of composed functions.
ok 4 - Given user-service.js compares secrets with === operator, should flag timing-unsafe secret comparison
  # pass rate: 4/4
  # avg score: 98.50
  # actual: The review explicitly flags the === comparison in verifyApiKey() at user-service.js:48-50 as a CRITICAL timing oracle vulnerability (C5 in the summary table), referencing the aidd-timing-safe-compare skill and recommending SHA3-256 hash-then-compare as the correct fix. It also flags that authenticate() uses the vulnerable verifyApiKey instead of the safer verifyToken (C6), and notes verifyToken's crypto.timingSafeEqual as MEDIUM risk per the same skill.
  # expected: Detection of timing-unsafe secret comparison using === operator in user-service.js, flagged as a security issue
ok 5 - Given user-service.js uses imperative for loop with push and mutation, should flag imperative style and input mutation
  # pass rate: 4/4
  # avg score: 94.25
  # actual: The review explicitly flags both the imperative for-loop (Step 3, data-fetch.js section under user-service.js) and the mutation issue. For the loop: '[MEDIUM] Imperative for-loop in processUsers() (lines 72–79)' with code example and note that filter/map handles it natively. For mutation: '[MEDIUM] Mutation in processUsers() (line 75)' noting `user.processed = true` mutates in-place and recommending spread operator. Both issues also appear in the actionable summary table as M3.
  # expected: Review should flag both the imperative for-loop with push pattern and the in-place mutation of input objects in user-service.js processUsers()
ok 6 - Given user-service.js logs the auth token to console, should flag sensitive data exposure in logs
  # pass rate: 4/4
  # avg score: 98.75
  # actual: The review explicitly flags the console.log of the raw authorization token in user-service.js:63 as a CRITICAL issue under both A07 (Identification and Authentication Failures) and A09 (Security Logging and Monitoring Failures). It is listed as item C7 in the Critical findings table with the description 'Token logged to console — remove immediately.'
  # expected: The review should flag that user-service.js logs the auth token to console, identifying it as sensitive data exposure in logs
ok 7 - Given utils.js uses pure functions with parameter defaults, should not flag any CRITICAL or HIGH severity violations
  # pass rate: 3/4
  # avg score: 79.25
  # actual: The review correctly identified utils.js as passing all checks, giving it an explicit PASS rating in code structure, standards, architecture, and documentation sections. The only finding for utils.js was in Step 4 (no test files present), which is a LOW severity finding (listed as L5 in the summary table) affecting all files, not a CRITICAL or HIGH specific to utils.js.
  # expected: No CRITICAL or HIGH severity violations flagged specifically for utils.js
ok 8 - Given utils.js hashes secrets before comparison, should recognize hash-before-compare as the correct timing-safe pattern per project standards
  # pass rate: 3/4
  # avg score: 75.75
  # actual: The review explicitly identifies utils.js compareSecrets (lines 12-13) as [PASS], noting it uses 'SHA3-256 hash-then-compare eliminates timing oracles, length oracles, and prevents raw secrets from appearing in logs.' It also uses compareSecrets as the reference implementation, recommending other code adopt this pattern (e.g., C5 states 'Use SHA3-256 hash-then-compare (see utils.compareSecrets)').
  # expected: Recognition that utils.js hashes secrets before comparison and identification of this as the correct timing-safe pattern per project standards
ok 9 - Given data-fetch.js uses || for defaults instead of parameter defaults, should flag || default pattern as a style issue
  # pass rate: 4/4
  # avg score: 92.00
  # actual: The review explicitly flags data-fetch.js line 3 as a MEDIUM issue: '[MEDIUM] || for default (line 3)' with code example showing `const id = userId || \"anonymous\"` and states 'Skill: Avoid using || for defaults. Use parameter defaults instead.' with the fix: `async (userId = 'anonymous') =>`
  # expected: The review should flag the || default pattern in data-fetch.js as a style issue
ok 10 - Given data-fetch.js uses an IIFE instead of a block scope, should flag IIFE usage
  # pass rate: 4/4
  # avg score: 98.25
  # actual: The review explicitly flags the IIFE in data-fetch.js at lines 14-18, labeling it [MEDIUM] with the note 'Skill: Avoid IIFEs. Use block scopes, modules, or normal arrow functions.' It appears in Step 3 under data-fetch.js analysis and is also listed in the Medium issues table as M5.
  # expected: The review should flag IIFE usage in data-fetch.js where a block scope should be used instead
ok 11 - Given data-fetch.js uses ALL_CAPS constant naming, should flag ALL_CAPS naming convention violation
  # pass rate: 3/4
  # avg score: 75.50
  # actual: The review explicitly flags ALL_CAPS constant naming in data-fetch.js under Step 3 (Coding Standards), labeled [LOW], citing lines 32-33 with constants MAX_RETRY_COUNT and DEFAULT_TIMEOUT_MS, and referencing the aidd-javascript skill rule against ALL_CAPS constants. It also appears in the actionable summary table as L1.
  # expected: The review should flag the ALL_CAPS naming convention violation for constants in data-fetch.js
ok 12 - Given the complete review, should explicitly list all current OWASP top 10 categories
  # pass rate: 4/4
  # avg score: 97.75
  # actual: The review explicitly lists all 10 OWASP Top 10 (2021) categories: A01 Broken Access Control, A02 Cryptographic Failures, A03 Injection, A04 Insecure Design, A05 Security Misconfiguration, A06 Vulnerable and Outdated Components, A07 Identification and Authentication Failures, A08 Software and Data Integrity Failures, A09 Security Logging and Monitoring Failures, A10 SSRF. Each category is addressed with findings or explicitly marked N/A or PASS.
  # expected: All current OWASP Top 10 categories explicitly listed and reviewed
1..12
# tests 12
# pass  12
