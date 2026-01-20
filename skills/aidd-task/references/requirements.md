# Requirements Patterns

## Functional Requirements Format

Always use: `Given [situation], should [expected behavior]`

### Good Examples

```
Given a valid email and password, should create user account
Given invalid email format, should display validation error
Given network timeout, should retry up to 3 times
Given successful payment, should send confirmation email
```

### Bad Examples

```
# Too vague
Should work correctly
Should handle errors

# Implementation details instead of behavior
Should use try/catch
Should call the API

# Missing context
Should return 404
```

## Requirement Categories

### Happy Path
Normal expected behavior when everything works.

```
Given valid input, should produce expected output
Given authenticated user, should allow access
```

### Validation
Input validation and error handling.

```
Given missing required field, should return validation error
Given input exceeding max length, should truncate or reject
```

### Edge Cases
Boundary conditions and unusual scenarios.

```
Given empty list, should return empty result
Given maximum allowed items, should handle without error
```

### Error Handling
How the system responds to failures.

```
Given database connection failure, should return service unavailable
Given rate limit exceeded, should return 429 with retry-after header
```

## Sizing Guidelines

Each task should be completable in ~50 lines of code.

If a task has more than 5-7 requirements, consider splitting it.

## Dependency Order

Sequence requirements so:
1. Core functionality comes first
2. Error handling follows happy path
3. Edge cases come last
