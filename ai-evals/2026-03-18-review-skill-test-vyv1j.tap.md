TAP version 13
ok 1 - Given user-service.js builds SQL queries with string concatenation, should flag SQL injection vulnerability
  # pass rate: 4/4
  # avg score: 100.00
  # actual: The review explicitly identified SQL injection vulnerabilities in user-service.js at multiple specific locations: BaseModel.save() (lines 10-13), findUser() (lines 29-31), and deleteUser() (line 36). It called out direct string concatenation/interpolation in SQL queries, provided a concrete injection example ('name = \"'; DROP TABLE users; --\"'), classified these as CRITICAL under OWASP A03 Injection, and listed them as S1/S2/S3 in the security findings table with Critical severity. Actionable remediation (parameterized queries) was also provided.
  # expected: Detection and flagging of SQL injection vulnerability due to string concatenation in SQL query construction in user-service.js
ok 2 - Given user-service.js assigns unsanitized user input to innerHTML, should flag XSS vulnerability
  # pass rate: 4/4
  # avg score: 99.75
  # actual: The review explicitly identifies XSS vulnerability from innerHTML assignment with unescaped user data (user.name, user.bio, user.website) in renderUserProfile() at line 41-45 of user-service.js. It is flagged as a Critical violation under OWASP A03 Injection, listed as S4 in the security findings table with 'Critical' severity, and included in the actionable feedback as item #2 under Critical fixes. The review also notes specific attack vectors (javascript:alert(1), <img src=x onerror=alert(1)>) and recommends replacing innerHTML with textContent or using DOMPurify.
  # expected: The review should flag that user-service.js assigns unsanitized user input to innerHTML, identifying it as an XSS vulnerability.
not ok 3 - Given user-service.js uses class and extends keywords, should flag class usage as a best practice violation
  # pass rate: 1/4
  # avg score: 35.75
  # actual: The review mentions 'Prefer composition over inheritance' as item #13 in the Low priority section, noting that 'UserService extends BaseModel should be UserService accepting a db dependency'. However, this is framed as an architectural preference about composition vs inheritance, not as a JavaScript best practices violation specifically calling out the class/extends keywords themselves as a best practice concern.
  # expected: The review should explicitly flag the use of class and extends keywords as a JavaScript best practice violation, likely referencing prototypal inheritance, functional patterns, or the project's /aidd-javascript standards that discourage class-based OOP in favor of functional or compositional approaches
ok 4 - Given user-service.js compares secrets with === operator, should flag timing-unsafe secret comparison
  # pass rate: 4/4
  # avg score: 99.00
  # actual: The review explicitly identifies the timing-unsafe secret comparison in user-service.js. Step 3 flags 'verifyApiKey() (line 49): Uses === for secret comparison — timing attack'. The security table includes S5: 'Timing-unsafe API key comparison' rated High. OWASP A07 section states 'verifyApiKey() uses timing-unsafe === for API key comparison — susceptible to timing oracle attacks'. Actionable item #4 recommends replacing === with crypto.timingSafeEqual.
  # expected: Detection that user-service.js compares secrets with === operator and flags this as timing-unsafe
ok 5 - Given user-service.js uses imperative for loop with push and mutation, should flag imperative style and input mutation
  # pass rate: 4/4
  # avg score: 84.25
  # actual: The review flags imperative style in processUsers() (line 74) noting it 'mutates the input objects directly (user.processed = true). Callers' objects are silently modified.' It also mentions the biome-ignore suppression for the for loop, noting the justification is inaccurate and for...of with entries() would work. Performance section notes processUsers iterates once but flags mutation as the concern.
  # expected: Review should flag the imperative for loop with push/mutation pattern in user-service.js, identifying both the imperative style (vs functional) and the input mutation side effect
ok 6 - Given user-service.js logs the auth token to console, should flag sensitive data exposure in logs
  # pass rate: 4/4
  # avg score: 99.50
  # actual: The review explicitly identifies the console.log of raw secret token in user-service.js line 63 as a security issue, listed as S6 in the security table with severity 'High', covered under OWASP A07 and A09, and included as Critical item #3 in the actionable feedback: 'Remove console.log with the token. Log only sanitized, non-sensitive metadata.'
  # expected: Flag sensitive data exposure via logging the auth token to console in user-service.js
not ok 7 - Given utils.js uses pure functions with parameter defaults, should not flag any CRITICAL or HIGH severity violations
  # pass rate: 1/4
  # avg score: 54.50
  # actual: The review flagged utils.js with Medium severity issues: S8 (hash strings compared with === not timing-safe) and S9 (fast hash SHA3-256 inappropriate for password secrets). These are labeled Medium, not Critical or High.
  # expected: No CRITICAL or HIGH severity violations should be flagged for utils.js, given it uses pure functions with parameter defaults.
not ok 8 - Given utils.js hashes secrets before comparison, should recognize hash-before-compare as the correct timing-safe pattern per project standards
  # pass rate: 1/4
  # avg score: 32.00
  # actual: The review identifies that utils.js uses SHA3-256 hashing before comparison and notes that string comparison with === is not timing-safe even on hashes, recommending crypto.timingSafeEqual be used for the hash comparison. It flags this as a Medium severity issue (S8) and criticizes the use of a fast hash for passwords. The review does NOT recognize hash-before-compare as a correct or acceptable timing-safe pattern — instead it treats it as a deficiency requiring remediation.
  # expected: The review should recognize that hashing secrets before comparison (hash-before-compare) is the correct timing-safe pattern per project standards, acknowledging it as a valid security approach rather than flagging it as a violation.
ok 9 - Given data-fetch.js uses || for defaults instead of parameter defaults, should flag || default pattern as a style issue
  # pass rate: 4/4
  # avg score: 89.50
  # actual: The review flagged the || default pattern in data-fetch.js line 3, noting that `userId || 'anonymous'` should use `??` (nullish coalescing) instead of `||` (falsy check), specifically because `userId = 0` or `userId = ''` would incorrectly resolve to 'anonymous'. This was listed as item #7 in the actionable feedback under Medium priority.
  # expected: The review should flag the || default pattern in data-fetch.js as a style/correctness issue
ok 10 - Given data-fetch.js uses an IIFE instead of a block scope, should flag IIFE usage
  # pass rate: 4/4
  # avg score: 97.50
  # actual: The review explicitly flags the IIFE usage in data-fetch.js at lines 14-18, stating 'Lines 14–18: IIFE used solely for scoping — unnecessary. A plain object literal { email: data.email, id, name: data.name } is clearer.' It also includes an actionable item: 'Remove IIFE (data-fetch.js:14–18) — Replace with a plain object literal.'
  # expected: The review should flag IIFE usage in data-fetch.js where an IIFE is used instead of block scope
not ok 11 - Given data-fetch.js uses ALL_CAPS constant naming, should flag ALL_CAPS naming convention violation
  # pass rate: 2/4
  # avg score: 44.25
  # actual: The review flags ALL_CAPS constant naming in data-fetch.js. In Step 9 (Documentation and Commit Messages), the review explicitly notes: 'data-fetch.js contains inline comments that describe anti-patterns (// Using || instead of parameter defaults, // IIFE instead of block scope, // ALL_CAPS constant naming)' — identifying ALL_CAPS as a noted anti-pattern in the fixture. Additionally, Step 10 item 16 flags 'DEFAULT_TIMEOUT_MS naming' as a naming concern.
  # expected: The review should flag the ALL_CAPS constant naming convention violation present in data-fetch.js
ok 12 - Given the complete review, should explicitly list all current OWASP top 10 categories
  # pass rate: 4/4
  # avg score: 97.50
  # actual: The review explicitly lists all 10 OWASP Top 10 (2021) categories: A01 Broken Access Control, A02 Cryptographic Failures, A03 Injection, A04 Insecure Design, A05 Security Misconfiguration, A06 Vulnerable and Outdated Components, A07 Identification and Authentication Failures, A08 Software and Data Integrity Failures, A09 Security Logging and Monitoring Failures, A10 Server-Side Request Forgery (SSRF). Each category is addressed with findings or explicitly marked N/A for the file scope.
  # expected: The review should explicitly list all current OWASP Top 10 categories (2021 edition) and inspect the code against each one.
1..12
# tests 12
# pass  8
# fail  4
