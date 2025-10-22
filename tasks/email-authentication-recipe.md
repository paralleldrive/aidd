# Email Authentication Recipe Epic

## Goal
Create a complete, pluggable Email Authentication recipe that developers can drop into any app using aidd. This includes all necessary utilities, example implementations, comprehensive documentation, and public exports.

## User Journey
"As a developer using aidd, I want to add email authentication (magic links) to my app by following a recipe that shows me exactly what to implement and what aidd provides."

## Success Criteria
- [ ] Complete documentation in `docs/recipes/email-auth/`
- [ ] All utilities exported from `aidd/auth`
- [ ] Working example handlers showing the pattern
- [ ] Integration tests demonstrating the full flow
- [ ] Security best practices documented
- [ ] Multiple email service examples (Resend, SendGrid, Nodemailer)

## What aidd Provides (Public Exports)

### Token Utilities (`aidd/auth/tokens`)
```javascript
import { generateSecureToken, createMagicLinkUrl } from 'aidd/auth/tokens'

// Generate cryptographically secure random token
const token = generateSecureToken() // returns 32-byte hex string

// Create magic link URL with token
const url = createMagicLinkUrl({
  baseUrl: 'https://example.com',
  token,
  path: '/auth/verify' // optional, defaults to '/auth/verify'
})
```

### Validation (`aidd/auth/validation`)
```javascript
import { validateEmail, validateToken } from 'aidd/auth/validation'

const isValid = validateEmail('user@example.com') // boolean
const isValid = validateToken(token) // boolean
```

### Types (`aidd/auth/types`)
```javascript
import { createUser, createMagicLink, isExpired } from 'aidd/auth/types'

const user = createUser({ email, name })
const magicLink = createMagicLink({ userId, token })
const expired = isExpired(magicLink)
```

### Client Components (`aidd/auth/client`)
```javascript
import { SignInForm } from 'aidd/auth/client'
import { signin } from 'aidd/auth/client'

// Component
<SignInForm onEmailSubmit={handleSubmit} />

// Service function
await signin(email) // handles CSRF, error messages
```

## What Users Implement (Plugin Points)

Users create their own route handlers using the utilities:

```javascript
import { createRoute, withRequestId, withCors, withServerError } from 'aidd/server'
import { generateSecureToken, createMagicLinkUrl } from 'aidd/auth/tokens'
import { validateEmail } from 'aidd/auth/validation'

// 1. User's email signin handler
const emailSignIn = async ({ request, response }) => {
  const { email } = await request.json()

  if (!validateEmail(email)) {
    return response.status(400).json({ error: 'Invalid email' })
  }

  const token = generateSecureToken()
  const magicLink = createMagicLinkUrl({
    baseUrl: process.env.BASE_URL,
    token
  })

  // User's own implementations:
  await userStore.saveToken({ email, token, expiresAt: Date.now() + 3600000 })
  await emailService.send({ to: email, magicLink })

  response.json({ success: true })
}

// 2. User's email verify handler
const emailVerify = async ({ request, response }) => {
  const { token } = request.query

  if (!validateToken(token)) {
    return response.status(400).json({ error: 'Invalid token' })
  }

  // User's own implementations:
  const tokenData = await userStore.getToken(token)
  if (!tokenData || Date.now() > tokenData.expiresAt) {
    return response.status(401).json({ error: 'Token expired' })
  }

  const user = await userStore.findOrCreateUser(tokenData.email)
  await sessionManager.createSession(user.id, response)

  response.json({ user })
}

// 3. Compose with middleware
export const signinRoute = createRoute(
  withRequestId,
  withCors,
  withServerError,
  emailSignIn
)

export const verifyRoute = createRoute(
  withRequestId,
  withCors,
  withServerError,
  emailVerify
)
```

## Implementation Plan

### Phase 1: Core Utilities
- [ ] Create `src/auth/tokens.js` with `generateSecureToken()` and `createMagicLinkUrl()`
- [ ] Write comprehensive unit tests for token utilities
- [ ] Move validation from `lib/` to `src/auth/validation.js`
- [ ] Move types from `types/` to `src/auth/types/`
- [ ] Update existing tests for moved files

### Phase 2: Client Integration
- [ ] Move `lib/auth-service.js` to `src/auth/client/auth-service.js`
- [ ] Move `components/signin-form-v2.jsx` to `src/auth/client/signin-form.jsx`
- [ ] Create `src/auth/client/index.js` with exports
- [ ] Update component tests for new location

### Phase 3: Example Handlers
- [ ] Create `examples/email-auth/handlers/email-signin.js` (example implementation)
- [ ] Create `examples/email-auth/handlers/email-verify.js` (example implementation)
- [ ] Create mock stores for examples (mockUserStore, mockEmailService)
- [ ] Write integration tests showing full flow

### Phase 4: Documentation
- [ ] Create `docs/recipes/email-auth/README.md` (overview, architecture, security)
- [ ] Create `docs/recipes/email-auth/setup.md` (step-by-step integration guide)
- [ ] Create `docs/recipes/email-auth/api-reference.md` (all exports documented)
- [ ] Create `docs/recipes/email-auth/examples/resend.md`
- [ ] Create `docs/recipes/email-auth/examples/sendgrid.md`
- [ ] Create `docs/recipes/email-auth/examples/nodemailer.md`

### Phase 5: Package Configuration
- [ ] Update `package.json` exports to include:
  - `aidd/auth/tokens`
  - `aidd/auth/validation`
  - `aidd/auth/types`
  - `aidd/auth/client`
- [ ] Update `package.json` files array to include `src/auth/**/*`, `examples/**/*`, `docs/**/*`
- [ ] Create root index files for clean imports

### Phase 6: Testing & Verification
- [ ] Run all tests to ensure nothing broke
- [ ] Verify all exports work correctly
- [ ] Test example handlers with mock services
- [ ] Review documentation for clarity
- [ ] Security review of token generation and validation

## File Structure

```
src/auth/
├── tokens.js
├── tokens.test.js
├── validation.js
├── validation.test.js
├── types/
│   ├── auth-types.sudo
│   ├── auth-types.js (JS factory functions)
│   ├── auth-types.test.js
│   ├── auth-api.sudo
│   └── index.js
├── client/
│   ├── auth-service.js
│   ├── auth-service.test.js
│   ├── signin-form.jsx
│   ├── signin-form.test.js
│   └── index.js
└── index.js

examples/email-auth/
├── handlers/
│   ├── email-signin.js
│   ├── email-verify.js
│   └── README.md
├── mocks/
│   ├── mock-user-store.js
│   ├── mock-email-service.js
│   └── mock-session-manager.js
├── integration.test.js
└── README.md

docs/recipes/email-auth/
├── README.md (overview & why)
├── setup.md (step-by-step guide)
├── api-reference.md (all exports)
├── security.md (best practices)
└── examples/
    ├── resend.md
    ├── sendgrid.md
    └── nodemailer.md
```

## Dependencies
- ✅ Server utilities (`createRoute`, middleware) - already implemented
- ✅ asyncPipe - already exists in `lib/`
- Node.js `crypto` module for secure token generation

## Security Considerations
- Use `crypto.randomBytes()` for token generation (cryptographically secure)
- Tokens must be at least 32 bytes (64 hex characters)
- Magic links should expire (recommend 1 hour)
- Rate limiting on signin endpoint (not implemented in recipe, but documented)
- CSRF protection on state-changing requests (already in auth-service.js)
- Generic error messages to prevent account enumeration (already implemented)
- HTTPS required for production (documented)

## Testing Strategy
- Unit tests for all utilities (tokens, validation)
- Unit tests for type factories
- Integration tests for example handlers
- Component tests for SignInForm (already exist)
- Security tests for token generation (randomness, length)

## Constraints
- Follow functional programming patterns (no classes)
- Pure functions where possible
- Comprehensive error handling
- Clear, beginner-friendly documentation
- Framework-agnostic (works with Express, Next.js, vanilla Node)
