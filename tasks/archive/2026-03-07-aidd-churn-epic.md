# aidd churn Epic

**Status**: ✅ COMPLETE  
**Archived**: 2026-03-07  
**Goal**: Add `npx aidd churn` — a CLI command that ranks files by composite hotspot score to identify prime PR split candidates

## Overview

PRs are hard to scope without knowing where complexity actually lives. Developers need a fast, reproducible way to identify which files are the highest-risk to change — large, frequently touched, and logically complex. `npx aidd churn` produces a ranked table using LoC × git churn × cyclomatic complexity, with gzip density as a supplemental column, so any team can run it in seconds before splitting a branch or opening a review.

---

## ✅ Install tsmetrics-core

## ✅ Fix tsmetrics-core Peer Dependency Conflict

Replaced global `legacy-peer-deps=true` in `.npmrc` with a scoped `overrides` entry in `package.json`, so only `tsmetrics-core`'s peer dep is relaxed rather than suppressing validation for the entire tree.

**Requirements**:
- Given the project installs dependencies without flags, should resolve cleanly with TypeScript 5.x satisfying tsmetrics-core's peer dep via package.json overrides
- Given `tsmetrics-core` peer dep is pinned to TypeScript 4.x, should not require a global `legacy-peer-deps` workaround in `.npmrc`

## ✅ Churn Collector

## ✅ File Metrics Collector

## ✅ Composite Scorer

## ✅ Churn Command

## ✅ Fix Error Exit Code in churn Command

`handleChurnErrors` handlers now call `process.exit(1)` directly, so known errors always exit with code 1.

**Requirements**:
- Given a git error occurs during churn collection, should exit with code 1
- Given the current directory is not a git repository, should exit with code 1

## ✅ Fix Silent Exit on Unexpected Errors in churn Command

The trailing catch now prints `❌ Unexpected error: <message>` before calling `process.exit(1)`.

**Requirements**:
- Given an unexpected error occurs during churn collection, should print the error message to stderr before exiting with code 1

## ✅ Fix GitError Handler Showing Static Message Instead of Real stderr

The `GitError` handler now traverses the cause chain (`cause.cause.message`) to surface the actual git stderr rather than the static `"git command failed"` string.

**Requirements**:
- Given a GitError with a specific stderr cause, should display the real git stderr output rather than the static error message

## ✅ Output Formatter

## ✅ Fix Locale-Dependent Score Rendering

Replaced `score.toLocaleString()` with `String(score)` so the Score column renders as a plain integer string on all locales and CI environments.

**Requirements**:
- Given a score value, should render it as a plain integer string without locale formatting

## ✅ Tests

## ✅ Update split-pr Skill and README

---

## ✅ Fix Subdirectory File Path Resolution in churn Command

After `collectChurn` returns, the action detects the git repo root via `git rev-parse --show-toplevel` and passes it to `collectFileMetrics`, so file paths resolve correctly regardless of where the command is invoked from.

**Requirements**:
- Given the user runs `npx aidd churn` from a subdirectory of the git repository, should resolve file paths relative to the git repository root and produce results

---

## ✅ Fix Shell Injection in collectChurn

Replaced `execSync` string interpolation with `spawnSync` args array to eliminate command injection risk.

---

## ✅ Add Missing Collector Tests

---

## ✅ Fix functionComplexity Undercounting Multi-Level Nesting

`functionComplexity` now recurses into all non-visible descendants (not just direct children), so an `if` nested inside a `for` is counted correctly.

**Requirements**:
- Given a function node with a non-visible for-node containing a non-visible if-node, should include the complexity of all non-visible descendants, not just direct children

---

## ✅ Filter Non-Source Files from Results

`package-lock.json`, `README.md`, and other non-source files are excluded by default via `filterSourceFiles`.

**Requirements**:
- Given default options, should exclude JSON, markdown, and lockfiles from results
- Given a `--ext` option, should allow the user to override the included extensions

---

## ✅ Validate `--days` / `--top` / `--min-loc` Input

All three numeric options are validated via a rules-based dispatch (`optionRules` array + `validateRule` helper), eliminating repeated if-branches.

---

## ✅ Add churn signal to /review

Added to `review.mdc` Criteria: run `npx aidd churn` at the start of every review and cross-reference ranked files against the diff.

---

## ✅ Deduplicate jsTsExtensions

`jsTsExtensions` is exported from `churn-filters.js` as the single canonical source. `file-metrics-collector.js` imports it rather than defining its own copy.

**Requirements**:
- Given `jsTsExtensions` is exported from `churn-filters.js`, should be importable and contain all standard JS/TS extensions
- Given `file-metrics-collector.js` measures complexity, should use the same `jsTsExtensions` exported from `churn-filters.js`

---

## ✅ Deduplicate ScoredFile Typedef

`ScoredFile` is defined once in `churn-scorer.js` and referenced via `@typedef {import('./churn-scorer.js').ScoredFile}` in `churn-formatter.js`.

**Requirements**:
- Given the typedef exists, should be defined once and referenced by both files

---

## ✅ Fix TypeScript Runtime Dependency

`typescript` moved from `devDependencies` to `dependencies`. Direct `import ts from 'typescript'` removed — `tsmetrics-core` owns that dependency at runtime.

**Requirements**:
- Given `typescript` is used at runtime by `tsmetrics-core`, should be listed in `dependencies` not `devDependencies`
- Given our code only uses `ts.ScriptTarget.Latest` (the literal `99`), should not import `typescript` directly — let `tsmetrics-core` own that dependency

---

## ✅ Fix Division by Zero on Empty Files

`gzipRatio` now returns `0` for empty files instead of `Infinity`.

**Requirements**:
- Given an empty file, should return a `gzipRatio` of `0` instead of `Infinity`

---

## ✅ Fix Input Validation for CLI Options

**Requirements**:
- Given a non-numeric `--days` value, should print a clear error and exit 1
- Given a non-positive `--days` value, should print a clear error and exit 1
- Given a non-numeric `--top` value, should print a clear error and exit 1
- Given a non-positive `--top` value, should print a clear error and exit 1
- Given a non-numeric `--min-loc` value, should print a clear error and exit 1
- Given a negative `--min-loc` value, should print a clear error and exit 1

---

## ✅ Fix Exit Code on Churn Errors

**Requirements**:
- Given a git error, should print the error message and exit with code 1
- Given the command is run outside a git repository, should print an error and exit with code 1

---

## ✅ Fix File Column Alignment

The file column now uses `padEnd` (left-aligned); all numeric columns use `padStart` (right-aligned).

**Requirements**:
- Given output with files of varying path lengths, should left-align the file column and right-align all numeric columns

---

## ✅ Fix ALL_CAPS Constants

`JS_TS_EXTENSIONS` → `jsTsExtensions`, `HEADERS` → `headers`.

**Requirements**:
- Given module-level constants, should use camelCase per the JS style guide
