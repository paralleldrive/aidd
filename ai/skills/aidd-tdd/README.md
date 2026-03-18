# aidd-tdd — Test-Driven Development Reference

`/aidd-tdd` enforces systematic test-driven development with proper test
isolation, using RITEway assertions and the Vitest test runner.

## Why TDD

Writing the test first forces you to think about the API before implementing it.
The failing test proves the requirement isn't accidentally met, and the minimal
fix keeps scope tight.

## The TDD cycle

1. Write a test for the next requirement — watch it **fail**
2. Implement the **minimum code** to make it pass
3. Run the test runner: fail → fix; pass → continue
4. Get user approval before moving to the next requirement

## Assert format

```js
assert({
  given: "a new account",
  should: "have zero balance",
  actual: getBalance(createAccount()),
  expected: 0,
});
```

Every test must answer five questions:

1. What is the unit under test? (named `describe` block)
2. What is the expected behavior? (`given` and `should`)
3. What is the actual output? (unit exercised by the test)
4. What is the expected output? (`expected` value)
5. How can we find the bug? (implicitly answered by the above)

## RITE way

- **Readable** — answers the 5 questions
- **Isolated** — units isolated from each other, no shared mutable state
- **Thorough** — covers expected and likely edge cases
- **Explicit** — everything needed to understand the test is in the test itself

## Test tooling

| Tool | Purpose |
| --- | --- |
| RITEway + Vitest | Default test framework |
| `vi.fn` / `vi.spyOn` | Spies and stubs |
| `vi.mock` | Module mocking (with `vi.importActual` for partials) |
| `vi.useFakeTimers` | Timer control |
| Playwright | Real browser interactions |

**Never** use `@testing-library/react` — use `riteway/render` for markup
verification instead.

## Key rules

- Colocate tests with the code they test
- Use selectors to read state — never read state objects directly
- Don't test expected types/shapes (redundant with type checks)
- Test action creators and selectors through the reducer, not in isolation

## When to use `/aidd-tdd`

- Implementing code changes (TDD is the default process)
- Writing or reviewing tests
- When TDD process guidance is needed
