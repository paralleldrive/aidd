# aidd churn Epic

**Status**: 🔄 IN PROGRESS (core complete, follow-ups remaining)  
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

## ✅ Output Formatter

## Fix Locale-Dependent Score Rendering 🔴 HIGH

`score.toLocaleString()` produces locale-dependent output. In German locale `20940` renders as `"20.940"`, in French as `"20 940"`. All other numeric columns use `String()`, making the Score column unpredictable across CI environments and potentially misread as a decimal.

**Requirements**:
- Given a score value, should render it as a plain integer string without locale formatting

## ✅ Tests

## ✅ Update split-pr Skill and README

---

## Fix Subdirectory File Path Resolution in churn Command 🔴 HIGH

`git log --name-only` always outputs file paths relative to the repository root, but `collectFileMetrics` resolves those paths against `process.cwd()`. When a user runs `npx aidd churn` from a subdirectory (e.g. `/repo/src`), every file read silently fails because paths are resolved to `/repo/src/src/foo.js` instead of `/repo/src/foo.js`, producing a misleading "No hotspots found" output.

**Requirements**:
- Given the user runs `npx aidd churn` from a subdirectory of the git repository, should resolve file paths relative to the git repository root and produce results

---

## Fix Shell Injection in collectChurn ⚠️ HIGH

Replace `execSync` string interpolation with `spawnSync` args array to eliminate command injection risk.

**Requirements**:
- Given any value for `days`, should never interpolate user input into a shell string
- Given a non-numeric `days` value, should throw a validation error before calling git

---

## ✅ Add Missing Collector Tests

---

## Filter Non-Source Files from Results 🟡 LOW

`package-lock.json`, `README.md`, and other non-source files dominate scores despite being useless signal.

**Requirements**:
- Given default options, should exclude JSON, markdown, and lockfiles from results
- Given a `--ext` option, should allow the user to override the included extensions

---

## Validate `--days` Input 🟡 LOW

`--days abc` silently returns the full git history. Should fail fast with a clear message.

**Requirements**:
- Given a non-numeric `--days` value, should print an error and exit 1
- Given a non-positive `--days` value, should print an error and exit 1

---

## Add churn signal to /review 🟡 LOW

Add a single line to `review.mdc` instructing the agent to run `npx aidd churn` early and surface high-scoring files in the diff.

**Requirements**:
- Given a code review is running, should run `npx aidd churn` and flag diff files that rank in the top results

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
