# aidd-tdd

Enforces systematic test-driven development with RITEway assertions and Vitest.

## Why

Writing the test first forces you to think about the API before implementing
it. The failing test proves the requirement isn't accidentally met, and the
minimal fix keeps scope tight.

## Usage

Invoke `/aidd-tdd` when implementing code changes. The cycle: write a failing
test, implement the minimum code to pass, get approval, repeat.

Tests use the RITEway `assert` format:

```js
assert({
  given: "a new account",
  should: "have zero balance",
  actual: getBalance(createAccount()),
  expected: 0,
});
```

Colocate tests with the code they test. Never use `@testing-library/react` —
use `riteway/render` instead.

## When to use

- Implementing code changes (TDD is the default process)
- Writing or reviewing tests
