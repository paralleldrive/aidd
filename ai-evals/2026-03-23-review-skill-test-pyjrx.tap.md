TAP version 13
ok 1 - Given user-service.js builds SQL queries with string concatenation, should flag SQL injection vulnerability
  # pass rate: 4/4
  # avg score: 100.00
  # actual: The review explicitly identifies SQL injection vulnerabilities in all three locations in user-service.js: BaseModel.save() using string-joined values, findUser() using template literal with username, and deleteUser() using unquoted id. Marked as CRITICAL under OWASP A03 with specific example payloads and remediation guidance (parameterized queries).
  # expected: Detection of SQL injection vulnerability due to string concatenation in SQL query building
ok 2 - Given user-service.js assigns unsanitized user input to innerHTML, should flag XSS vulnerability
  # pass rate: 4/4
  # avg score: 99.25
  # actual: The review explicitly flags XSS vulnerability in renderUserProfile() under both OWASP A03/A07 with a detailed critical-severity finding. It identifies that user.name, user.bio, and user.website are written directly to innerHTML, provides a concrete exploit example (<img src=x onerror=alert(1)>), notes the javascript: URI risk for user.website, and recommends using textContent/createElement/DOMPurify instead. It appears in the OWASP table, the detailed section 3, and the priority summary table as a Critical item.
  # expected: The review should flag that unsanitized user input assigned to innerHTML constitutes an XSS vulnerability
not ok 3 - Given user-service.js uses class and extends keywords, should flag class usage as a best practice violation
  # pass rate: 1/4
  # avg score: 24.00
  # actual: The review covers SQL injection, XSS, timing attacks, token logging, SRP violations, code style issues, and OWASP top 10 — but never flags the use of `class` and `extends` keywords as a best practice violation
  # expected: The review should explicitly identify that using `class` and `extends` in user-service.js violates JavaScript best practices (per /aidd-javascript skill guidance favoring functional patterns over OOP class hierarchies)
ok 4 - Given user-service.js compares secrets with === operator, should flag timing-unsafe secret comparison
  # pass rate: 4/4
  # avg score: 99.00
  # actual: The review explicitly flags verifyApiKey() in user-service.js for using === operator for API key comparison, labeling it a timing attack vulnerability (A02 Cryptographic Failures). It notes the method short-circuits on the first differing character, leaks key length/prefix information, and that authenticate() calls this insecure method despite a safer verifyToken() existing. It also flags compareSecrets() in utils.js for using === on hex strings. Both are marked Critical/High in the summary table.
  # expected: Detection and flagging of timing-unsafe secret comparison via === operator in user-service.js
ok 5 - Given user-service.js uses imperative for loop with push and mutation, should flag imperative style and input mutation
  # pass rate: 4/4
  # avg score: 77.50
  # actual: The review flags input mutation in processUsers() under 'Minor Code Quality' ('processUsers() mutates its input. Use map to return new objects.') and includes it in the summary table as a Low severity issue. The imperative for loop style is implicitly covered by the processUsers discussion, though not explicitly called out as an imperative-vs-functional style violation in the same way the data-fetch.js loop is.
  # expected: The review should flag both the imperative for loop with push pattern and the input mutation in processUsers()
ok 6 - Given user-service.js logs the auth token to console, should flag sensitive data exposure in logs
  # pass rate: 4/4
  # avg score: 99.00
  # actual: The review explicitly flags 'console.log(\"Auth successful for token:\", token)' under A09 (Logging/Monitoring Failures) and separately under 'Token Logged in Plaintext (A09)', noting that the raw Authorization header value is logged and that tokens in logs are a data breach risk. It appears in the critical summary table as severity 🔴 Critical.
  # expected: The review should flag that user-service.js logs the auth token to console as a sensitive data exposure issue in logs.
not ok 7 - Given utils.js uses pure functions with parameter defaults, should not flag any major violations
  # pass rate: 0/4
  # avg score: 37.50
  # actual: The review flagged utils.js for a timing-safety issue in compareSecrets() (using === on hash strings instead of timingSafeEqual), rated as High severity. It also noted absence of tests as a Low concern.
  # expected: No major violations should be flagged for utils.js given its use of pure functions with parameter defaults. The compareSecrets timing-safety flag is a minor/debatable concern, not a major violation. The review over-elevated it to High severity.
not ok 8 - Given utils.js hashes secrets before comparison, should recognize correct timing-safe pattern
  # pass rate: 0/4
  # avg score: 17.50
  # actual: The review recognized that utils.js hashes both secrets before comparison (a mitigation), but flagged it as NOT timing-safe because === on hex strings can short-circuit. It treated the hashing pattern as insufficient and recommended replacing it with crypto.timingSafeEqual on the hash buffers.
  # expected: The review should recognize that hashing both secrets before comparing with === is a correct/acceptable timing-safe pattern, since both hashes are fixed-length and the hash operation dominates the timing.
ok 9 - Given data-fetch.js uses || for defaults instead of parameter defaults, should flag || default pattern as a style issue
  # pass rate: 4/4
  # avg score: 97.75
  # actual: The review explicitly flags the `|| 'anonymous'` pattern in fetchUserData as a style issue, noting it should use a default parameter instead (`async (userId = 'anonymous')`), and also points out the falsy edge case with 0 and empty string.
  # expected: The review flags the || default pattern as a style issue in data-fetch.js
ok 10 - Given data-fetch.js uses an IIFE instead of a block scope, should flag IIFE usage
  # pass rate: 4/4
  # avg score: 95.75
  # actual: The review explicitly flags the IIFE usage in data-fetch.js under the 'Code Style Flags' section, quoting the code and labeling it with ❌, explaining it is unnecessary and should be replaced with a simple destructure or object literal.
  # expected: The review flags IIFE usage in data-fetch.js as an anti-pattern or style violation.
ok 11 - Given data-fetch.js uses ALL_CAPS constant naming, should flag ALL_CAPS naming convention violation
  # pass rate: 4/4
  # avg score: 83.75
  # actual: The review explicitly flags ALL_CAPS constant naming in data-fetch.js under section 5, stating 'ALL_CAPS constants: const MAX_RETRY_COUNT = 3; const DEFAULT_TIMEOUT_MS = 5000; These are module-level const values... Per idiomatic JS/TS style (and likely /aidd-javascript rules), maxRetryCount / defaultTimeoutMs is preferred unless the project convention explicitly mandates screaming snake case for all module constants.' It also appears in the summary table as a medium-severity finding: 'IIFE, || fallback, ALL_CAPS constants — style violations'.
  # expected: The review should flag ALL_CAPS naming convention violation for constants in data-fetch.js
ok 12 - Given the complete review, should explicitly list all current OWASP top 10 categories
  # pass rate: 3/4
  # avg score: 83.25
  # actual: The review contains a full OWASP Top 10 (2021) table listing all 10 categories (A01-A10) with findings for each, explicitly labeled and numbered.
  # expected: All current OWASP top 10 categories explicitly listed with review against the changes
1..12
# tests 12
# pass  9
# fail  3
