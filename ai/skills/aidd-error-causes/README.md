# aidd-error-causes — Structured Error Handling Reference

`/aidd-error-causes` enforces the use of the `error-causes` library for all error
handling in JavaScript/TypeScript, replacing raw `new Error()` with structured,
named errors that support automatic routing.

## Why error-causes

- Works across memory realms (unlike `instanceof`)
- Consistent metadata: name, code, message, cause
- Enables automatic error routing by name
- Self-documenting error handling

## Basic usage

```js
import { createError } from "error-causes";

// Throw a structured error
throw createError({
  name: "ConfigurationError",
  message: 'Required key "API_KEY" is not defined',
  code: "MISSING_CONFIG_KEY",
  requestedKey: "API_KEY",
});
```

## Wrapping caught errors

Preserve the original error as `cause`:

```js
try {
  await someOperation();
} catch (originalError) {
  throw createError({
    name: "OperationError",
    message: "Failed to perform operation",
    code: "OPERATION_FAILED",
    cause: originalError,
  });
}
```

## Error handler pattern

Define and route multiple error types with `errorCauses`:

```js
import { errorCauses, createError } from "error-causes";

const [apiErrors, handleApiErrors] = errorCauses({
  NotFound: { code: 404, message: "Resource not found" },
  ValidationError: { code: 400, message: "Invalid input" },
  Unauthorized: { code: 401, message: "Authentication required" },
});

const { NotFound } = apiErrors;

if (!resource) throw createError(NotFound);

someAsyncCall().catch(
  handleApiErrors({
    NotFound: ({ message }) => console.log(message),
    Unauthorized: () => redirect("/login"),
  })
);
```

## Rules

1. Always use `createError` instead of `new Error()`
2. Always include `name` and `message`
3. Include `code` when the error needs programmatic handling
4. Preserve original errors using the `cause` property
5. Test the `cause` property, not just the message
6. Use `errorCauses()` for APIs with multiple error types

## When to use `/aidd-error-causes`

- Throwing or catching errors in JavaScript/TypeScript
- Defining error types for an API
- Implementing error routing or error handler middleware
