# aidd churn Epic

**Status**: 🔄 IN PROGRESS  
**Goal**: Add `npx aidd churn` — a CLI command that ranks files by composite hotspot score to identify prime PR split candidates

## Overview

PRs are hard to scope without knowing where complexity actually lives. Developers need a fast, reproducible way to identify which files are the highest-risk to change — large, frequently touched, and logically complex. `npx aidd churn` produces a ranked table using LoC × git churn × cyclomatic complexity, with gzip density as a supplemental column, so any team can run it in seconds before splitting a branch or opening a review.

---

## Install tsmetrics-core

Add `tsmetrics-core` as a production dependency for TypeScript-native cyclomatic complexity via AST.

**Requirements**:
- Given the package is installed, should be importable and return a numeric complexity score for a TypeScript source string

---

## Churn Collector

`collectChurn({ cwd, days })` — runs `git log` and returns a `Map<filePath, touchCount>` for files changed within the window.

**Requirements**:
- Given a git repo and a day window, should return each touched file with its commit count
- Given a file not touched in the window, should not appear in the result
- Given a path outside a git repo, should throw a structured error

---

## File Metrics Collector

`collectFileMetrics({ files, cwd })` — reads each file and returns `{ loc, gzipRatio, complexity }` per file.

**Requirements**:
- Given a source file, should return line count, gzip compression ratio, and cyclomatic complexity
- Given a binary or unreadable file, should skip it gracefully
- Given a non-TypeScript file, should return complexity of 1

---

## Composite Scorer

`scoreFiles(metrics)` — pure function that computes `score = loc * churn * complexity`, merges gzip ratio as a display column, and returns results sorted descending.

**Requirements**:
- Given file metrics with loc, churn, and complexity, should return score = loc × churn × complexity
- Given a list of scored files, should return them sorted by score descending
- Given options `{ top, minLoc }`, should filter results accordingly

---

## Churn Command

Wire `collectChurn`, `collectFileMetrics`, and `scoreFiles` into a `churn` subcommand on the existing Commander CLI.

**Requirements**:
- Given `npx aidd churn`, should run against the current directory with 90-day window and top 20 results
- Given `--days`, `--top`, `--min-loc` options, should apply them to the analysis
- Given `--json`, should output raw JSON instead of a table

---

## Output Formatter

`formatTable(results)` — renders scored results as an aligned CLI table with columns: Score, LoC, Churn, Complexity, Density, File.

**Requirements**:
- Given scored results, should render a readable aligned table to stdout
- Given `--json` flag, should output a JSON array instead
- Given no results above threshold, should print a friendly empty-state message

---

## Tests

Unit tests for scorer, collector, and formatter; integration smoke test for the CLI command.

**Requirements**:
- Given known loc, churn, and complexity values, score should equal their product
- Given a top-N filter, should return at most N results
- Given a minLoc filter, should exclude files below the threshold
- Given `--json`, CLI output should be valid parseable JSON

---

## Update split-pr Skill and README

Update `aidd-split-pr` Step 3 to reference `npx aidd churn`, and add the command to the CLI reference table in README.

**Requirements**:
- Given the skill is invoked, should instruct the agent to run `npx aidd churn` for modularization analysis
- Given the README CLI reference table, should list `churn` with its options

---

## Fix Shell Injection in collectChurn ⚠️ HIGH

Replace `execSync` string interpolation with `spawnSync` args array to eliminate command injection risk.

**Requirements**:
- Given any value for `days`, should never interpolate user input into a shell string
- Given a non-numeric `days` value, should throw a validation error before calling git

---

## Add Missing Collector Tests 🟠 MEDIUM

Unit tests for `collectChurn` and `collectFileMetrics` — three epic requirements currently have no coverage.

**Requirements**:
- Given a git repo, `collectChurn` should return each touched file with its commit count
- Given a path outside a git repo, `collectChurn` should throw a structured `NotAGitRepo` error
- Given a non-TypeScript file, `collectFileMetrics` should return complexity of 1
- Given an unreadable file, `collectFileMetrics` should skip it and continue

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

## Deduplicate ScoredFile Typedef 🔵 NITPICK

`ScoredFile` is defined in both `churn-scorer.js` and `churn-formatter.js`.

**Requirements**:
- Given the typedef exists, should be defined once and referenced by both files
