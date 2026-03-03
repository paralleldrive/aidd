# scaffold-example

A minimal scaffold used as the end-to-end test fixture for `npx aidd create`.

## What this scaffold does

1. Initializes a new npm project (`npm init -y`)
2. Configures a `test` script using Vitest
3. Installs the AIDD-standard testing dependencies at `@latest`:
   - `riteway` — functional assertion library
   - `vitest` — fast test runner
   - `@playwright/test` — browser automation testing
   - `error-causes` — structured error chaining
   - `@paralleldrive/cuid2` — collision-resistant unique IDs

## Usage

```sh
npx aidd create scaffold-example my-project
```

After scaffolding, run your tests:

```sh
cd my-project
npm test
```
