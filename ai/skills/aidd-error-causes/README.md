# aidd-error-causes

Enforces the `error-causes` library for structured error handling in
JavaScript/TypeScript, replacing raw `new Error()` with named, routable errors.

## Why

- Works across memory realms (unlike `instanceof`)
- Consistent metadata: name, code, message, cause
- Enables automatic error routing by name

## Usage

```js
import { createError, errorCauses } from "error-causes";

// Throw a structured error
throw createError({
  name: "ConfigurationError",
  message: 'Required key "API_KEY" is not defined',
  code: "MISSING_CONFIG_KEY",
});

// Define and route multiple error types
const [apiErrors, handleApiErrors] = errorCauses({
  NotFound: { code: 404, message: "Resource not found" },
  Unauthorized: { code: 401, message: "Authentication required" },
});
```

Always use `createError` instead of `new Error()`. Preserve original errors
with the `cause` property.

## When to use

- Throwing or catching errors in JavaScript/TypeScript
- Defining error types for an API
- Implementing error routing or error handler middleware
