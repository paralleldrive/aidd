# AIDD Server Framework

A lightweight, type-safe alternative to Express built for functional programming and secure-by-default API development.

## Quick Start

```javascript
import { createRoute, withRequestId } from 'aidd/server';

export default createRoute(
  withRequestId,
  async ({ request, response }) => {
    response.status(200).json({
      message: 'Hello World',
      requestId: response.locals.requestId
    });
  }
);
```

## Why AIDD Server?

- **Function Composition** - Use `asyncPipe` instead of middleware chains
- **Type-Safe** - Complete TypeScript definitions included
- **Secure by Default** - Sanitized logging, explicit CORS, fail-fast config
- **Functional** - Pure functions, immutability, composability
- **Zero Classes** - Functions and data, no OOP complexity
- **Production-Ready** - Battle-tested patterns with comprehensive tests

## Table of Contents

- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
  - [createRoute](#createroute)
  - [withRequestId](#withrequestid)
  - [createWithCors](#createwithcors)
  - [createWithConfig](#createwithconfig)
  - [loadConfigFromEnv](#loadconfigfromenv)
  - [withServerError](#withservererror)
  - [convertMiddleware](#convertmiddleware)
  - [createServer](#createserver)
- [Examples](#examples)
- [Security Best Practices](#security-best-practices)
- [Migration from Express](#migration-from-express)

---

## Core Concepts

### Middleware Pattern

AIDD Server middleware uses a simple pattern:

```typescript
type Middleware = ({ request, response }) => Promise<{ request, response }>
```

Each middleware:
1. Receives `{ request, response }`
2. Can modify either object
3. Returns `{ request, response }`
4. Composes with `asyncPipe`

### Direct Exports vs Factories

- **Direct exports** (e.g., `withRequestId`) - Zero config needed, use immediately
- **Factory functions** (e.g., `createWithCors`) - Require configuration, return middleware

### Error Handling

All errors are caught by `createRoute` and return standardized 500 responses with request IDs for debugging.

---

## API Reference

### createRoute

Composes middleware using `asyncPipe` and handles errors automatically.

```javascript
createRoute(...middleware: Middleware[]): RouteHandler
```

**Example:**
```javascript
import { createRoute, withRequestId } from 'aidd/server';
import { asyncPipe } from 'aidd';

const myRoute = createRoute(
  withRequestId,
  withCors,
  async ({ request, response }) => {
    response.status(200).json({ success: true });
  }
);

export default myRoute;
```

**Error Handling:**
- Catches all errors automatically
- Logs error with sanitized request context
- Returns standardized 500 response
- Includes request ID for debugging

**Security:**
- Sanitizes sensitive headers (authorization, cookie, x-api-key)
- Sanitizes sensitive body fields (password, token, apiKey, secret)
- Never logs stack traces in production

---

### withRequestId

Generates unique CUID2 request ID and attaches to `response.locals.requestId`.

```javascript
withRequestId: Middleware
```

**Example:**
```javascript
import { createRoute, withRequestId } from 'aidd/server';

export default createRoute(
  withRequestId,
  async ({ request, response }) => {
    const requestId = response.locals.requestId;
    console.log('Request ID:', requestId);
    response.json({ requestId });
  }
);
```

**Features:**
- Uses CUID2 (defense-in-depth security)
- Unique per request
- Available in `response.locals.requestId`
- Included in error logs

---

### createWithCors

Factory that creates CORS middleware with explicit origin validation.

```javascript
createWithCors(options: CorsOptions): Middleware

interface CorsOptions {
  allowedOrigins: string | string[];  // REQUIRED
  allowedHeaders?: string[];
  allowedMethods?: string[];
}
```

**Security: `allowedOrigins` is required** - No wildcard default prevents accidental exposure.

**Example - Specific Origins (Recommended):**
```javascript
import { createRoute, createWithCors } from 'aidd/server';

const withCors = createWithCors({
  allowedOrigins: ['https://example.com', 'https://app.example.com']
});

export default createRoute(
  withCors,
  async ({ request, response }) => {
    response.json({ message: 'CORS-enabled' });
  }
);
```

**Example - Public API:**
```javascript
const withCors = createWithCors({
  allowedOrigins: '*'  // Explicit opt-in for public APIs
});
```

**Example - Environment-Based:**
```javascript
const withCors = createWithCors({
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
});
```

**Security Features:**
- Rejects `null` origin (prevents exploits)
- Requires explicit configuration
- Validates origin against allowlist
- Custom headers and methods supported

---

### createWithConfig

Factory that creates config injection middleware with fail-fast validation.

```javascript
createWithConfig(configLoader: () => Promise<object>): Middleware
```

**Features:**
- Loads config asynchronously
- Wraps in object with `get()` method
- `config.get(key)` throws if key missing (fail-fast)
- Available in `response.locals.config`

**Example with loadConfigFromEnv:**
```javascript
import { createRoute, createWithConfig, loadConfigFromEnv } from 'aidd/server';

const withConfig = createWithConfig(() =>
  loadConfigFromEnv(['OPENAI_API_KEY', 'DATABASE_URL', 'PORT'])
);

export default createRoute(
  withConfig,
  async ({ request, response }) => {
    // Throws immediately if OPENAI_API_KEY is missing
    const apiKey = response.locals.config.get('OPENAI_API_KEY');

    // Safe - returns undefined if PORT is missing (key not required)
    const port = response.locals.config.get('PORT');

    response.json({ configured: true });
  }
);
```

**Example with Custom Loader:**
```javascript
const withConfig = createWithConfig(async () => {
  const config = await fetchFromVault();
  return {
    apiKey: config.OPENAI_API_KEY,
    dbUrl: config.DATABASE_URL
  };
});
```

**Error Handling:**
- `config.get('MISSING_KEY')` throws `ConfigurationError`
- Error includes requested key name
- Fails immediately, not deep in application logic

---

### loadConfigFromEnv

Helper that loads specified environment variables into config object.

```javascript
loadConfigFromEnv(keys: string[]): Promise<Record<string, string | undefined>>
```

**Example:**
```javascript
import { loadConfigFromEnv } from 'aidd/server';

const config = await loadConfigFromEnv(['DATABASE_URL', 'API_KEY', 'PORT']);
// => { DATABASE_URL: 'postgres://...', API_KEY: 'abc123', PORT: '3000' }
```

**Use with createWithConfig:**
```javascript
const withConfig = createWithConfig(() =>
  loadConfigFromEnv(['DATABASE_URL', 'API_KEY'])
);
```

**Returns:**
- Object with key-value pairs from `process.env`
- `undefined` for missing environment variables
- Empty object `{}` if keys array is empty

---

### withServerError

Attaches standardized error response helper to `response.locals.serverError`.

```javascript
withServerError: Middleware
```

**Example:**
```javascript
import { createRoute, withServerError } from 'aidd/server';

export default createRoute(
  withServerError,
  async ({ request, response }) => {
    if (!request.body.email) {
      return response.json(
        response.locals.serverError({
          message: 'Email is required',
          status: 400
        })
      );
    }

    response.json({ success: true });
  }
);
```

**API:**
```javascript
response.locals.serverError({
  message?: string,    // Default: "Internal Server Error"
  status?: number,     // Default: 500
  requestId?: string   // Default: response.locals.requestId
})
```

**Returns:**
```javascript
{
  error: {
    message: string,
    status: number,
    requestId: string
  }
}
```

---

### convertMiddleware

Converts traditional Express-style middleware to AIDD functional middleware.

```javascript
convertMiddleware(middleware: ExpressMiddleware): Middleware
```

**Example:**
```javascript
import { createRoute, convertMiddleware } from 'aidd/server';
import bodyParser from 'body-parser';

const withBodyParser = convertMiddleware(bodyParser.json());

export default createRoute(
  withBodyParser,
  async ({ request, response }) => {
    console.log(request.body);
    response.json({ received: true });
  }
);
```

**Use Cases:**
- Integrate existing Express middleware
- Gradual migration from Express
- Use popular middleware (body-parser, helmet, etc.)

---

### createServer

Test utility for creating mock request/response objects.

```javascript
createServer({
  request?: object,
  response?: object
}): { request, response }
```

**Example in Tests:**
```javascript
import { createServer, withRequestId } from 'aidd/server';
import { assert } from 'riteway';

test('withRequestId adds request ID', async () => {
  const result = await withRequestId(createServer());

  assert({
    given: 'server object',
    should: 'add requestId to response.locals',
    actual: typeof result.response.locals.requestId,
    expected: 'string'
  });
});
```

**Features:**
- Creates mock objects for testing middleware
- Includes `setHeader` and `getHeader` methods
- Mergeable with custom request/response properties

---

## Examples

### Complete API with Auth

```javascript
import { createRoute, withRequestId, createWithCors, createWithConfig, loadConfigFromEnv } from 'aidd/server';
import { asyncPipe } from 'aidd';

// CORS for your frontend
const withCors = createWithCors({
  allowedOrigins: ['https://app.example.com']
});

// Load API keys
const withConfig = createWithConfig(() =>
  loadConfigFromEnv(['OPENAI_API_KEY', 'DATABASE_URL', 'JWT_SECRET'])
);

// Custom auth middleware
const withAuth = async ({ request, response }) => {
  const token = request.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    response.status(401).json({ error: 'Unauthorized' });
    return { request, response };
  }

  // Verify token and attach user
  const user = await verifyToken(token);
  response.locals.user = user;

  return { request, response };
};

// Compose middleware
const defaultMiddleware = asyncPipe(
  withRequestId,
  withCors,
  withConfig,
  withAuth
);

// Route handler
export default createRoute(
  defaultMiddleware,
  async ({ request, response }) => {
    const apiKey = response.locals.config.get('OPENAI_API_KEY');
    const user = response.locals.user;

    response.json({
      message: 'Authenticated',
      user: user.email
    });
  }
);
```

### Database Connection Middleware

```javascript
const withDatabase = async ({ request, response }) => {
  const dbUrl = response.locals.config.get('DATABASE_URL');
  const db = await connectToDatabase(dbUrl);

  response.locals.db = db;

  // Cleanup after request
  response.on('finish', () => db.close());

  return { request, response };
};

export default createRoute(
  withConfig,
  withDatabase,
  async ({ request, response }) => {
    const users = await response.locals.db.query('SELECT * FROM users');
    response.json({ users });
  }
);
```

### Rate Limiting Middleware

```javascript
const rateLimit = new Map();

const withRateLimit = async ({ request, response }) => {
  const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const max = 100; // 100 requests per minute

  const record = rateLimit.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }

  record.count++;
  rateLimit.set(ip, record);

  if (record.count > max) {
    response.status(429).json({ error: 'Too many requests' });
    return { request, response };
  }

  return { request, response };
};
```

---

## Security Best Practices

### 1. Never Use Wildcard CORS in Production

```javascript
// ❌ BAD - Exposes API to all origins
const withCors = createWithCors({ allowedOrigins: '*' });

// ✅ GOOD - Explicit allowlist
const withCors = createWithCors({
  allowedOrigins: ['https://example.com', 'https://app.example.com']
});
```

### 2. Use Fail-Fast Configuration

```javascript
// ✅ GOOD - Throws immediately if missing
const apiKey = response.locals.config.get('OPENAI_API_KEY');

// ❌ BAD - Silent failure, bugs appear later
const apiKey = process.env.OPENAI_API_KEY;
```

### 3. Always Include Request ID Middleware

```javascript
// ✅ GOOD - Enables request tracking
export default createRoute(
  withRequestId,
  // ... other middleware
);
```

### 4. Sanitize User Input

```javascript
const withValidation = async ({ request, response }) => {
  const { email } = request.body;

  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    response.status(400).json({ error: 'Invalid email' });
    return { request, response };
  }

  return { request, response };
};
```

### 5. Use HTTPS-Only Cookies

```javascript
response.setHeader('Set-Cookie',
  `token=${token}; HttpOnly; Secure; SameSite=Strict`
);
```

### 6. Implement Rate Limiting

See [Rate Limiting Middleware](#rate-limiting-middleware) example above.

### 7. Add Security Headers

```javascript
const withSecurityHeaders = async ({ request, response }) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('X-XSS-Protection', '1; mode=block');
  response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  return { request, response };
};
```

---

## Migration from Express

### Express Pattern
```javascript
const express = require('express');
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/api/users', async (req, res) => {
  const users = await db.query('SELECT * FROM users');
  res.json({ users });
});

app.listen(3000);
```

### AIDD Server Pattern
```javascript
import { createRoute, createWithCors, convertMiddleware } from 'aidd/server';
import bodyParser from 'body-parser';

const withCors = createWithCors({
  allowedOrigins: ['https://example.com']
});

const withBodyParser = convertMiddleware(bodyParser.json());

export default createRoute(
  withCors,
  withBodyParser,
  async ({ request, response }) => {
    const users = await db.query('SELECT * FROM users');
    response.json({ users });
  }
);
```

### Key Differences

| Express | AIDD Server |
|---------|-------------|
| `app.use()` chains | `asyncPipe` composition |
| `(req, res, next)` | `({ request, response })` |
| `next()` calls | Return `{ request, response }` |
| Global middleware | Per-route composition |
| `app.listen()` | Export route handler |

### Benefits of AIDD Server

1. **Explicit composition** - See all middleware for each route
2. **Type-safe** - TypeScript definitions included
3. **Testable** - Pure functions, easy to test
4. **Secure defaults** - No accidental wildcards
5. **Better errors** - Fail-fast configuration
6. **Function-first** - No classes or `this` binding

---

## TypeScript Support

Complete TypeScript definitions included:

```typescript
import {
  createRoute,
  Middleware,
  ServerContext,
  ConfigObject
} from 'aidd/server';

const myMiddleware: Middleware = async ({ request, response }) => {
  // Full type inference
  return { request, response };
};

const myRoute = createRoute(
  myMiddleware,
  async ({ request, response }) => {
    const config: ConfigObject = response.locals.config;
    const apiKey: string = config.get('API_KEY');

    response.json({ success: true });
  }
);
```

---

## Testing Your Middleware

```javascript
import { createServer, withRequestId } from 'aidd/server';
import { assert } from 'riteway';

test('withRequestId generates CUID2', async () => {
  const result = await withRequestId(createServer());

  assert({
    given: 'withRequestId middleware',
    should: 'add requestId to response.locals',
    actual: typeof result.response.locals.requestId,
    expected: 'string'
  });
});

test('custom middleware modifies request', async () => {
  const addTimestamp = async ({ request, response }) => {
    request.timestamp = Date.now();
    return { request, response };
  };

  const result = await addTimestamp(createServer());

  assert({
    given: 'timestamp middleware',
    should: 'add timestamp to request',
    actual: typeof result.request.timestamp,
    expected: 'number'
  });
});
```

---

## FAQ

### Q: How do I deploy AIDD Server routes?

**A**: AIDD Server routes are compatible with any Node.js runtime:

- **Vercel**: Export as default function
- **Netlify**: Export as handler
- **AWS Lambda**: Wrap with adapter
- **Node.js HTTP**: Use with `http.createServer`

### Q: Can I use Express middleware?

**A**: Yes! Use `convertMiddleware`:

```javascript
import { convertMiddleware } from 'aidd/server';
import helmet from 'helmet';

const withHelmet = convertMiddleware(helmet());
```

### Q: How do I handle file uploads?

**A**: Use `convertMiddleware` with multer or similar:

```javascript
import { convertMiddleware } from 'aidd/server';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const withUpload = convertMiddleware(upload.single('file'));
```

### Q: What about WebSockets?

**A**: AIDD Server focuses on HTTP routes. For WebSockets, use libraries like `ws` or `socket.io` alongside your AIDD routes.

### Q: How do I add logging?

**A**: Create a logging middleware:

```javascript
const withLogging = async ({ request, response }) => {
  console.log({
    method: request.method,
    url: request.url,
    timestamp: new Date().toISOString()
  });
  return { request, response };
};
```

---

## Contributing

Found a bug or want to contribute?

1. Fork the repository
2. Create your feature branch
3. Add tests
4. Submit a pull request

See the main [AIDD repository](https://github.com/paralleldrive/sudolang.ai) for details.

---

## License

MIT © [ParallelDrive](https://github.com/paralleldrive)
