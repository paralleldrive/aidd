# aidd-javascript — JavaScript/TypeScript Best Practices Reference

`/aidd-javascript` enforces disciplined JavaScript and TypeScript coding standards
emphasizing functional programming, immutability, and concise, composable code.

## Principles

- **DOT** — Do One Thing
- **YAGNI** — You Aren't Gonna Need It
- **KISS** — Keep It Simple
- **DRY** — Don't Repeat Yourself
- **SDA** — Self Describing APIs: parameter values explicitly named in function
  signatures with reasonable defaults

## Key conventions

### Functions and composition

- Favor pure functions, `map`/`filter`/`reduce` over manual loops
- One job per function; separate mapping from IO
- Prefer `const`, spread, and rest over mutation
- Chain operations rather than introducing intermediate variables
- Use arrow functions, destructuring, template literals
- Avoid `class` and `extends` — prefer composition of functions and data
- Assign defaults directly in function signatures:
  ```js
  const createUser = ({ id = createId(), name = "" } = {}) => ({ id, name });
  ```

### Naming

- Functions are verbs: `increment()`, `filter()`
- Predicates read as yes/no questions: `isActive`, `hasPermission`
- Lifecycle methods: `beforeX` / `afterX` (not `willX` / `didX`)
- Mixins and decorators: `with${Thing}`
- No `ALL_CAPS` for constants

### Comments

- Minimal docblocks for public APIs
- Comments should stand alone months later — no references to task plans
- Avoid redundancy with the code

## Before writing code

1. Read the lint and formatting rules
2. Observe the project's existing code
3. Conform to existing style unless these instructions say otherwise

## When to use `/aidd-javascript`

- Writing, reviewing, or refactoring JavaScript or TypeScript code
- Ensuring code follows functional programming best practices
