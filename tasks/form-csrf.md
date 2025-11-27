## ✅ Form Handling & CSRF Middleware

Implement secure form submission handling with JSON Schema validation and CSRF protection middleware.

Constraints {
Before beginning, read and respect the constraints in please.mdc.
Remember to use the TDD process when implementing code.
Follow the existing middleware patterns in src/server/middleware/.
Use @paralleldrive/cuid2 for token generation.
}

---

# Epic: handleForm & withCSRF Middleware

## Files to Create

- `src/server/middleware/handle-form.js` - Form handling factory
- `src/server/middleware/handle-form.test.js` - Tests for handleForm
- `src/server/middleware/with-csrf.js` - CSRF protection middleware
- `src/server/middleware/with-csrf.test.js` - Tests for withCSRF
- Update `src/server/middleware/index.js` - Export new middleware

---

## Task 1: handleForm

### Overview

Factory function that creates middleware for secure form submission handling with JSON Schema validation.

### Signature

```javascript
handleForm({ name, schema, processSubmission, pii, honeypotField })
```

### Parameters

- `name` (string) - Identifier for the form, used in logging
- `schema` (object) - JSON Schema for validating request body
- `processSubmission` (function) - Async function receiving validated form data as `{ [fieldName]: value }`
- `pii` (string[]) - Field names to register with logger scrubber
- `honeypotField` (string, optional) - Field name that must be empty, rejects submission if filled

### Functional Requirements

1. Given a request with a body matching the JSON Schema, should pass validated fields to `processSubmission`
2. Given a request with a body failing JSON Schema validation, should return 400 status with an array of validation failure descriptions
3. Given a request where the honeypot field contains a value, should reject with 400 status and generic validation error (no indication of honeypot detection)
4. Given a request missing required fields per schema, should return 400 status with validation failures indicating missing fields
5. Given `processSubmission` throws an error, should surface error through standard `createRoute` error handling
6. Given a successful submission, should return `{ request, response }` without setting status or body (caller handles success response)
7. Given PII fields, should pass them to `request.locals.logger.scrub(pii)`
8. Given a request with fields not defined in schema, should return 400 status with validation failures indicating undeclared fields
9. Given the `honeypotField` parameter is omitted, should skip honeypot validation

### Implementation Notes

- Use a JSON Schema validation library (suggest ajv)
- Configure ajv with `additionalProperties: false` behavior for requirement 8
- Honeypot rejection should appear identical to validation errors (security by obscurity)
- Ensure validation errors are descriptive but don't leak sensitive schema details

---

## Task 2: withCSRF

### Overview

Middleware providing stateless CSRF protection using the double-submit cookie pattern.

### Signature

```javascript
withCSRF // Direct export, no parameters
```

### Functional Requirements

1. Given a GET/HEAD/OPTIONS request, should set a CSRF token cookie and attach token to `response.locals.csrfToken` for inclusion in forms
2. Given a POST/PUT/PATCH/DELETE request with matching token in cookie and header (`X-CSRF-Token`), should allow request to proceed
3. Given a POST/PUT/PATCH/DELETE request with matching token in cookie and body field (`_csrf`), should allow request to proceed
4. Given a POST/PUT/PATCH/DELETE request where token is missing from cookie, should return 403 status with error message
5. Given a POST/PUT/PATCH/DELETE request where submitted token does not match cookie token, should return 403 status with error message
6. Given a request, should generate tokens using CUID2
7. Given setting the CSRF cookie, should set `SameSite=Strict` and `Secure=true` (in production)
8. Given setting the CSRF cookie, should not set `HttpOnly` (client must read token to submit it)
9. Given any CSRF rejection, should log the failure with request ID but without exposing token values

### Implementation Notes

- Use `@paralleldrive/cuid2` for token generation (already in dependencies)
- Cookie name suggestion: `csrf_token`
- Detect production via `process.env.NODE_ENV === 'production'`
- Safe methods (GET/HEAD/OPTIONS) should still set the cookie for subsequent unsafe requests
- Middleware signature: `async ({ request, response }) => { ... }`

---

## Testing Approach

Follow the existing test patterns in `src/server/middleware/*.test.js`:
- Use vitest with riteway assertions
- Use `createServer` from `../test-utils.js` for mock objects
- Extend `createServer` as needed for cookie/body mocking
- Test each functional requirement explicitly
- Include edge cases (empty strings, missing fields, malformed data)

---

## Export Updates

Add to `src/server/middleware/index.js`:
```javascript
export { handleForm } from "./handle-form.js";
export { withCSRF } from "./with-csrf.js";
```
