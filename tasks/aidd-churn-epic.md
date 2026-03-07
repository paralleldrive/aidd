# aidd churn Epic

**Status**: 🔄 IN PROGRESS (core complete, follow-ups remaining)  
**Goal**: Add `npx aidd churn` — a CLI command that ranks files by composite hotspot score to identify prime PR split candidates

## Overview

PRs are hard to scope without knowing where complexity actually lives. Developers need a fast, reproducible way to identify which files are the highest-risk to change — large, frequently touched, and logically complex. `npx aidd churn` produces a ranked table using LoC × git churn × cyclomatic complexity, with gzip density as a supplemental column, so any team can run it in seconds before splitting a branch or opening a review.

---

## ✅ Install tsmetrics-core

## ✅ Churn Collector

## ✅ File Metrics Collector

## ✅ Composite Scorer

## ✅ Churn Command

## ✅ Output Formatter

## ✅ Tests

## ✅ Update split-pr Skill and README

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

## Deduplicate ScoredFile Typedef 🔵 NITPICK

`ScoredFile` is defined in both `churn-scorer.js` and `churn-formatter.js`.

**Requirements**:
- Given the typedef exists, should be defined once and referenced by both files
