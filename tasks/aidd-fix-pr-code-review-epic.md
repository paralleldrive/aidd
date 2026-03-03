# aidd-fix PR Code Review Epic

**Status**: 🔧 IN PROGRESS
**Goal**: Resolve code quality, type safety, and API consistency issues surfaced during `/review` of the aidd-fix PR branch.

---

## 1. Rename non-env-var ALL_CAPS constants to camelCase

Per the JS style guide, ALL_CAPS is reserved for environment variable names.
The following constants are plain JS values, not env vars, and should use camelCase.

**Files and renames:**
- `lib/cli-core.js`: `AIDD_CUSTOM_CONFIG_CONTENT` → `aiddCustomConfigContent`
- `lib/index-generator.js`: `MAX_RECURSION_DEPTH` → `maxRecursionDepth`
- `lib/index-generator.js`: `FORBIDDEN_KEYS` → `forbiddenKeys`
- `lib/agents-md.js`: `REQUIRED_DIRECTIVES` → `requiredDirectives`
- `lib/agents-md.js`: `DIRECTIVE_APPEND_SECTIONS` → `directiveAppendSections`
- `lib/agents-md.js`: `AGENTS_MD_CONTENT` → `agentsMdContent`

Any exported names must also be updated in:
- `lib/agents-md.d.ts` (exports `REQUIRED_DIRECTIVES`, `DIRECTIVE_APPEND_SECTIONS`, `AGENTS_MD_CONTENT`)
- All test files that import these constants

**Requirements:**
- Given `REQUIRED_DIRECTIVES` is a plain JS constant exported from `agents-md.js`, should be named `requiredDirectives` in source, type declaration, and all consumers
- Given `DIRECTIVE_APPEND_SECTIONS` is a plain JS constant exported from `agents-md.js`, should be named `directiveAppendSections` in source, type declaration, and all consumers
- Given `AGENTS_MD_CONTENT` is a plain JS constant exported from `agents-md.js`, should be named `agentsMdContent` in source, type declaration, and all consumers
- Given `AIDD_CUSTOM_CONFIG_CONTENT` is a plain JS constant in `cli-core.js`, should be named `aiddCustomConfigContent`
- Given `MAX_RECURSION_DEPTH` is a plain JS constant in `index-generator.js`, should be named `maxRecursionDepth`
- Given `FORBIDDEN_KEYS` is a plain JS constant in `index-generator.js`, should be named `forbiddenKeys`

---

## 2. Add `lib/cli-core.d.ts` type declarations

`lib/cli-core.js` exports `createAiddCustomConfig`, `createLogger`, `executeClone`,
`handleCliErrors`, `resolvePaths`, `validateSource`, and `validateTarget` with no
corresponding `.d.ts` file. TypeScript consumers cannot use these safely.

**Requirements:**
- Given `createAiddCustomConfig` is exported from `cli-core.js`, should be declared in `lib/cli-core.d.ts` with the correct signature
- Given `executeClone` is exported from `cli-core.js`, should be declared in `lib/cli-core.d.ts` with all options typed
- Given `resolvePaths` is exported from `cli-core.js`, should be declared with input options and return type
- Given `createLogger`, `validateSource`, `validateTarget`, `handleCliErrors` are exported, should all be declared
- Given `lib/cli-core.d.ts` is created, should be consistent in style with `lib/agents-md.d.ts`

---

## 3. Fix inconsistent `error` return type in `generateAllIndexes`

`generateAllIndexes` in `lib/index-generator.js` returns `error` as a plain `string`
in one code path and as `{ cause, message }` in another.
The type declaration (`lib/index-generator.d.ts`) currently types it as `string`
only, which is wrong for the catch path.

**Requirements:**
- Given `generateAllIndexes` encounters a missing `ai/` directory, should return `error` as `{ message: string }` object (normalized from plain string) so both error paths share the same shape
- Given `generateAllIndexes` throws during index generation, should return `error` as `{ cause?: unknown; message: string }` object consistent with other error shapes in the codebase
- Given `GenerateAllResult` in `lib/index-generator.d.ts`, should type `error` as `{ cause?: unknown; message: string }` to accurately reflect the unified object shape across both error paths

---

## 4. Fix `generateIndexRecursive` type declaration missing `depth` parameter

`lib/index-generator.d.ts` declares `generateIndexRecursive(dirPath, results?)` but
the implementation signature is `(dirPath, results = [], depth = 0)`. The `depth`
parameter is missing from the declaration.

**Requirements:**
- Given `generateIndexRecursive` is declared in `lib/index-generator.d.ts`, should include an optional `depth?: number` third parameter to accurately reflect the implementation signature

---

## 5. Enable type-checking on test files via pre-commit hook

Test files are the primary consumers of `.d.ts` type declarations. If they are
excluded from type-checking, a wrong or missing declaration is never caught by
tooling — it only surfaces during code review, if at all.

The fix is to enable `checkJs` and include test files in the TypeScript config,
add a `typecheck` npm script, and run it in the pre-commit hook. Test files then
act as free type tests: any type error in a `.d.ts` declaration that is exercised
by a test will fail the pre-commit hook automatically.

**Requirements:**
- Given `tsconfig.json` excludes test files or sets `checkJs: false`, should be updated to include `**/*.test.js` and enable `checkJs: true` so test files are type-checked
- Given the project has no `typecheck` npm script, should add `"typecheck": "tsc --noEmit"` to `package.json`
- Given the pre-commit hook runs lint and index generation, should also run `npm run typecheck` so type regressions are caught before every commit
- Given a test file passes a wrong argument type to a declared function, should fail `npm run typecheck` with a type error
- Given all test type usages conform to their declarations, should pass `npm run typecheck` with no errors
