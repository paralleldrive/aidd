# scaffold-example

A minimal scaffold used as the end-to-end test fixture for `npx aidd create`.

## What this scaffold does

1. Copies a pre-configured `package.json` template into your project (ES module, `vitest run` test script, `release-it` release script)
2. Installs the AIDD-standard dependencies at `@latest`:
   - `riteway` — functional assertion library
   - `vitest` — fast test runner
   - `@playwright/test` — browser automation testing
   - `error-causes` — structured error chaining
   - `@paralleldrive/cuid2` — collision-resistant unique IDs
   - `release-it` — automated GitHub release publishing

## Usage

```sh
npx aidd create scaffold-example my-project
```

After scaffolding, run your tests:

```sh
cd my-project
npm test
```

To cut a tagged GitHub release:

```sh
npm run release
```
