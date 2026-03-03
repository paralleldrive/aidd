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

Any exported names must also be updated in:
- `lib/agents-md.d.ts` (exports `REQUIRED_DIRECTIVES`, `DIRECTIVE_APPEND_SECTIONS`)
- All test files that import these constants

**Requirements:**
- Given `REQUIRED_DIRECTIVES` is a plain JS constant exported from `agents-md.js`, should be named `requiredDirectives` in source, type declaration, and all consumers
- Given `DIRECTIVE_APPEND_SECTIONS` is a plain JS constant exported from `agents-md.js`, should be named `directiveAppendSections` in source, type declaration, and all consumers
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
in one code path (line 249) and as `{ cause, message }` in another (line 272).
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

## 5. Enable type-checking on test files

`tsconfig.json` currently excludes `**/*.test.js` and sets `checkJs: false`. This means the unit tests — the primary consumers of `.d.ts` type declarations — are never type-checked. A wrong or missing `.d.ts` declaration will go undetected, because no tooling validates it against real usage.

**Requirements:**
- Given test files consume exports from typed modules, should be validated by `npm run typecheck` against the declared types
- Given a test file passes a wrong argument type to a declared function, should fail `npm run typecheck` with a type error
- Given all test type usages conform to their declarations, should pass `npm run typecheck` with no errors
