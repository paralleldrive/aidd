# API Route Handling - Context & Patterns

This folder contains reference implementations and patterns for API route handling using functional composition instead of Express middleware chains.

## Core Concepts

### asyncPipe Composition

Instead of Express-style middleware chains, we use functional composition with `asyncPipe`:

```javascript
const asyncPipe = (...fns) => (x) => fns.reduce(async (y, f) => f(await y), x);
```

This allows pure functional composition of async operations.

### Middleware Pattern

All middleware follows the `{ request, response }` object pattern:

```javascript
const myMiddleware = async ({ request, response }) => ({
  request,  // potentially modified
  response, // potentially modified
});
```

### Route Creation

Routes are created by composing middleware with `createRoute`:

```javascript
import { createRoute } from './create-route.js';
import withRequestId from './with-request-id.js';
import withCors from './with-cors.js';

const myRoute = createRoute(
  withRequestId,
  withCors,
  async ({ request, response }) => {
    response.status(200).json({ message: 'Success' });
  }
);

export default myRoute;
```

## Middleware Examples

### 1. with-request-id.js

Generates unique request ID for tracking and correlation.

**Purpose**: Attach CUID2 to `response.locals.requestId`

**Testing**: Uses `createServer()` helper to mock request/response

### 2. with-cors.js

Handles CORS headers for cross-origin requests.

**Purpose**: Add CORS headers, handle OPTIONS preflight

**Headers Set**:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers`
- `Access-Control-Allow-Methods` (OPTIONS only)

### 3. with-config.js

Injects configuration into response locals.

**Purpose**: Load environment-specific config and attach to `response.locals.config`

**Pattern**: Async config loading with error handling

### 4. with-server-error.js

Provides standardized error response helper.

**Purpose**: Attach `serverError()` helper to `response.locals`

**Usage**:
```javascript
const errorPayload = response.locals.serverError({
  message: 'Not Found',
  status: 404,
});
```

## Error Handling

The `createRoute` wrapper catches all errors and:
1. Logs full error details with request context
2. Returns standardized 500 response
3. Includes `requestId` for tracking
4. Never leaks stack traces to client

## Testing Pattern

All middleware should be tested using the `createServer()` helper:

```javascript
import { describe } from 'riteway';
import { createServer } from './test-utils.js';
import myMiddleware from './my-middleware.js';

describe('myMiddleware', async (assert) => {
  const result = await myMiddleware(createServer());

  assert({
    given: 'a server object',
    should: 'do something specific',
    actual: result.response.locals.something,
    expected: 'expected value',
  });
});
```

## Security Considerations

When implementing API routes:

1. **CSRF Protection**: Required for all POST/PUT/PATCH/DELETE
2. **Authentication**: Session validation for protected routes
3. **Input Validation**: Validate and sanitize all inputs
4. **Rate Limiting**: Defense-in-depth (Cloudflare primary)
5. **Security Headers**: CSP, X-Frame-Options, etc.
6. **Error Messages**: Never leak internal details
7. **Logging**: Include requestId, redact sensitive data

## Principles

- **Functional Composition**: Use `asyncPipe` for middleware chains
- **Pure Functions**: Middleware should not mutate inputs
- **Error Boundaries**: `createRoute` catches all errors
- **Testability**: Simple mock objects via `createServer()`
- **Observability**: Request IDs for correlation
- **Security**: Defense-in-depth with multiple layers

## Next Steps

See `../api-route-handling-epic.md` for the full implementation plan covering:
- CSRF validation middleware
- Authentication middleware
- Input validation middleware
- Rate limiting middleware
- Security headers middleware
- Logging middleware
- Complete route handler examples
