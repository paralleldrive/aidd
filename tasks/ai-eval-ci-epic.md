# AI Eval CI Epic

**Status**: 📋 PLANNED
**Goal**: Wire all `.sudo` eval files into `test:ai-eval`, make the AI eval CI job non-blocking, and run it at most once daily and only when AI eval files have actually changed.

## Overview

The `test:ai-eval` script currently only runs `aidd-review/review-skill-test.sudo`. The `aidd-pr` and `aidd-parallel` evals are silently skipped. Additionally, the `ai-eval` CI job runs on every PR push and fails the build when the Claude quota is exhausted — a rate-limit issue unrelated to code correctness. AI evals are slow, expensive, and non-deterministic; they should not gate every commit. Instead they should run once daily on a schedule, and only when `.sudo` files have actually changed.

---

## Wire all eval files into test:ai-eval

Update `package.json` to discover and run all `.sudo` unit eval files under `ai-evals/` rather than hardcoding a single file.

**Requirements**:
- Given multiple `.sudo` eval files exist under `ai-evals/`, should run all of them (excluding `-e2e.test.sudo` files)
- Given a new `.sudo` eval file is added to any `ai-evals/` subdirectory, should be picked up automatically without changing `package.json`
- Given an `-e2e.test.sudo` file exists, should not be run by `test:ai-eval` (only by `test:ai-eval:e2e`)
- Given `test:ai-eval` runs, should pass `--runs 4 --threshold 75 --timeout 600000 --agent claude --color --save-responses` consistent with the existing script

---

## Make the AI eval CI job non-blocking

The `ai-eval` job in `.github/workflows/test.yml` must not fail the PR build.

**Requirements**:
- Given the `ai-eval` job fails for any reason (quota, auth, flaky result), should not block PR merges — add `continue-on-error: true` to the job
- Given the job is non-blocking, should still upload eval responses as artifacts so results are visible

---

## Run AI evals on a daily schedule, only when eval files changed

Replace the per-push `ai-eval` trigger with a scheduled daily run and a path-filtered per-push check.

**Requirements**:
- Given a push or PR that does not modify any file under `ai-evals/**`, should skip the `ai-eval` job entirely
- Given a push or PR that modifies one or more files under `ai-evals/**`, should run the `ai-eval` job so authors get fast feedback when they change evals
- Given a daily schedule trigger (e.g. `cron: '0 8 * * *'`), should always run the full `ai-eval` suite regardless of changed files
- Given the daily scheduled run, should still be non-blocking (does not gate any merge)
- Given the schedule runs at 8am UTC, should run after the Claude quota resets at 7am UTC
