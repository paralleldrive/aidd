# aidd churn Epic

**Status**: 🔄 IN PROGRESS (core + bug fixes complete, follow-ups remaining)  
**Goal**: Add `npx aidd churn` — a CLI command that ranks files by composite hotspot score to identify prime PR split candidates

## Overview

PRs are hard to scope without knowing where complexity actually lives. Developers need a fast, reproducible way to identify which files are the highest-risk to change — large, frequently touched, and logically complex. `npx aidd churn` produces a ranked table using LoC × git churn × cyclomatic complexity, with gzip density as a supplemental column, so any team can run it in seconds before splitting a branch or opening a review.

---

## ✅ Install tsmetrics-core

## Fix tsmetrics-core Peer Dependency Conflict 🔴 HIGH

`tsmetrics-core@1.4.1` declares `peerDependencies: { "typescript": "^4.9.4" }` while the project uses TypeScript 5.x, causing `npm install` to fail without `--legacy-peer-deps`. Using a global `.npmrc` workaround silently suppresses peer-dep validation for the entire tree.

**Requirements**:
- Given the project installs dependencies without flags, should resolve cleanly with TypeScript 5.x satisfying tsmetrics-core's peer dep via package.json overrides
- Given `tsmetrics-core` peer dep is pinned to TypeScript 4.x, should not require a global `legacy-peer-deps` workaround in `.npmrc`

## ✅ Churn Collector

## ✅ File Metrics Collector

## ✅ Composite Scorer

## ✅ Churn Command

## Fix Error Exit Code in churn Command 🔴 HIGH

`handleChurnErrors` handlers return `undefined` (from `console.error`), which resolves the promise chain before the final `.catch(() => process.exit(1))` can fire. Known errors silently exit with code 0.

**Requirements**:
- Given a git error occurs during churn collection, should exit with code 1
- Given the current directory is not a git repository, should exit with code 1

## Fix Silent Exit on Unexpected Errors in churn Command 🔴 HIGH

The trailing `.catch()` calls `process.exit(1)` for unrecognized errors without printing any diagnostic output, making it impossible to debug failures.

**Requirements**:
- Given an unexpected error occurs during churn collection, should print the error message to stderr before exiting with code 1

## Fix GitError Handler Showing Static Message Instead of Real stderr 🔴 HIGH

The `GitError` handler destructures `{ message }` from the error, yielding the static string `"git command failed"` rather than the actual git stderr, which is stored as `cause.message`.

**Requirements**:
- Given a GitError with a specific stderr cause, should display the real git stderr output rather than the static error message

## ✅ Output Formatter

## Fix Locale-Dependent Score Rendering 🔴 HIGH

`score.toLocaleString()` produces locale-dependent output. In German locale `20940` renders as `"20.940"`, in French as `"20 940"`. All other numeric columns use `String()`, making the Score column unpredictable across CI environments and potentially misread as a decimal.

**Requirements**:
- Given a score value, should render it as a plain integer string without locale formatting

## ✅ Tests

## ✅ Update split-pr Skill and README

---

## ✅ Fix Subdirectory File Path Resolution in churn Command

`git log --name-only` always outputs file paths relative to the repository root, but `collectFileMetrics` resolves those paths against `process.cwd()`. When a user runs `npx aidd churn` from a subdirectory (e.g. `/repo/src`), every file read silently fails because paths are resolved to `/repo/src/src/foo.js` instead of `/repo/src/foo.js`, producing a misleading "No hotspots found" output.

**Requirements**:
- Given the user runs `npx aidd churn` from a subdirectory of the git repository, should resolve file paths relative to the git repository root and produce results

---

## ✅ Fix Shell Injection in collectChurn

Replace `execSync` string interpolation with `spawnSync` args array to eliminate command injection risk.

---

## ✅ Add Missing Collector Tests

---

## Fix functionComplexity Undercounting Multi-Level Nesting 🔴 HIGH

`functionComplexity` only sums a function node's own complexity plus its **direct** non-visible children. Non-visible grandchildren (e.g. an `if` nested inside a `for`) are silently excluded, undercounting cyclomatic complexity for functions with multi-level nesting.

**Requirements**:
- Given a function node with a non-visible for-node containing a non-visible if-node, should include the complexity of all non-visible descendants, not just direct children

---

## Filter Non-Source Files from Results 🟡 LOW

`package-lock.json`, `README.md`, and other non-source files dominate scores despite being useless signal.

**Requirements**:
- Given default options, should exclude JSON, markdown, and lockfiles from results
- Given a `--ext` option, should allow the user to override the included extensions

---

## ✅ Validate `--days` / `--top` / `--min-loc` Input

Expanded from original `--days`-only scope. All three numeric options are now validated via a rules-based dispatch (`optionRules` array + `validateRule` helper), eliminating the repeated if-branches and reducing cyclomatic complexity from 14 → 7.

---

## ✅ Add churn signal to /review

Added to `review.mdc` Criteria: run `npx aidd churn` at the start of every review and cross-reference ranked files against the diff.

---

## Deduplicate jsTsExtensions 🔵 NITPICK

`jsTsExtensions` is defined locally in `file-metrics-collector.js` but should be exported from `churn-filters.js` as the single canonical source, so that `filterSourceFiles` and `measureComplexity` always stay in sync.

**Requirements**:
- Given `jsTsExtensions` is exported from `churn-filters.js`, should be importable and contain all standard JS/TS extensions
- Given `file-metrics-collector.js` measures complexity, should use the same `jsTsExtensions` exported from `churn-filters.js`

---

## Deduplicate ScoredFile Typedef 🔵 NITPICK

`ScoredFile` is defined in both `churn-scorer.js` and `churn-formatter.js`.

**Requirements**:
- Given the typedef exists, should be defined once and referenced by both files

---

## ✅ Fix TypeScript Runtime Dependency

`typescript` is in `devDependencies` but `tsmetrics-core` calls `require("typescript")` at runtime. Published packages omit devDependencies, so `npx aidd churn` fails with `Cannot find module 'typescript'` for any user who does not have TypeScript in their own project.

**Requirements**:
- Given `typescript` is used at runtime by `tsmetrics-core`, should be listed in `dependencies` not `devDependencies`
- Given our code only uses `ts.ScriptTarget.Latest` (the literal `99`), should not import `typescript` directly — let `tsmetrics-core` own that dependency

---

## ✅ Fix Division by Zero on Empty Files

`gzipSync(buf).length / buf.length` produces `Infinity` when `buf.length === 0`, which renders as `Infinity%` in the output table.

**Requirements**:
- Given an empty file, should return a `gzipRatio` of `0` instead of `Infinity`

---

## ✅ Fix Input Validation for CLI Options

`--days abc`, `--top abc`, and `--min-loc abc` silently produce `NaN`, which passes through to git or the scorer and causes cryptic errors instead of a clear user-facing message.

**Requirements**:
- Given a non-numeric `--days` value, should print a clear error and exit 1
- Given a non-positive `--days` value, should print a clear error and exit 1
- Given a non-numeric `--top` value, should print a clear error and exit 1
- Given a non-positive `--top` value, should print a clear error and exit 1
- Given a non-numeric `--min-loc` value, should print a clear error and exit 1
- Given a negative `--min-loc` value, should print a clear error and exit 1

---

## ✅ Fix Exit Code on Churn Errors

`handleChurnErrors` catches and resolves the error, so the trailing `.catch(() => process.exit(1))` never fires. The command exits 0 even when a git error occurs, breaking CI pipelines.

**Requirements**:
- Given a git error, should print the error message and exit with code 1
- Given the command is run outside a git repository, should print an error and exit with code 1

---

## ✅ Fix File Column Alignment

The formatter uses `padStart` for all columns, giving file paths leading whitespace. Numeric columns should be right-aligned; the file path column should be left-aligned.

**Requirements**:
- Given output with files of varying path lengths, should left-align the file column and right-align all numeric columns

---

## ✅ Fix ALL_CAPS Constants

`JS_TS_EXTENSIONS` and `HEADERS` violate the project JavaScript guide ("avoid ALL_CAPS for constants").

**Requirements**:
- Given module-level constants, should use camelCase (`jsTsExtensions`, `headers`) per the JS style guide
