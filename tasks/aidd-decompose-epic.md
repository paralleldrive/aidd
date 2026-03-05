# aidd-decompose Epic

**Status**: ✅ COMPLETED (2026-03-04)  
**Goal**: Build and npm-link the `aidd-decompose` skill, then run it once against the contractor-marketplace PR to validate and iterate.

## Overview

PR #76 (`iwhite/contractor-marketplace`, ~39K additions) needs to be decomposed into reviewable breakout PRs — and this has proven hard to do ad-hoc. The `aidd-decompose` skill systematizes the riteway PR #411 workflow (8 focused PRs with dependency graph and tracking epic). The skill must be npm-linked from the local aidd repo into paralleldrive.com before it can be used. Scope: decompose pipeline + status pipeline + encoded team standards in `references/review-feedback.md`; no auto-review integration in v1.

---

## ✅ Create Feature Branch

Create `feat/aidd-decompose` in the aidd repo.

**Requirements**:
- Given a clean main branch, should create and switch to `feat/aidd-decompose`

---

## ✅ Create SKILL.md

Author `ai/skills/aidd-decompose/SKILL.md` with both the decompose pipeline and the status pipeline.

**Requirements**:
- Given the file is authored, should include Agent Skills spec frontmatter with `name: aidd-decompose`, `description`, and `compatibility: Requires git and gh CLI`
- Given the file is authored, should stay under 500 lines — reference material goes in `references/`
- Given the file is authored, should define "umbrella PR" near the top so agents loading the status pipeline in isolation understand the term
- Given the file is authored, should place pipeline summary expressions (`decompose = ...`, `status = ...`) after their respective steps, not before — consistent with aidd-fix pattern
- Given the file is authored, should close with a `Commands { }` block listing both commands — consistent with aidd-fix pattern
- Given a branch name contains `/`, should sanitize it to `-` when constructing the tracking epic file path
- Given `analyzeBranch` reads the references file, should use the full path `ai/skills/aidd-decompose/references/review-feedback.md` not a bare relative path
- Given `planDecomposition` creates the tracking epic, should use `$projectRoot/tasks/` as the path anchor
- Given the user selects consolidation branch strategy, `executeBreakouts` should create `decompose/{sanitizedBranchName}` first and target all breakout PRs at it
- Given `executeBreakouts` creates a breakout PR, should include a placeholder "Review context" section in the PR body (to be filled in by `syncFeedback`)
- Given `syncFeedback` updates open breakout PR bodies, should use `gh pr view {pr} --json body -q .body` to read then `gh pr edit {pr} --body "..."` to write
- Given `gatherStatus` is invoked, should first infer the tracking epic path from the current branch name, or ask the user if the file does not exist
- Given the skill is loaded, should execute `analyzeBranch |> identifyGroups |> planDecomposition |> executeBreakouts |> trackProgress` for decomposition
- Given the skill is loaded in status mode, should execute `gatherStatus |> syncFeedback |> updateTracking`
- Given a step completes, should pause and get user approval before the next step
- Given each step communicates to the user, should use friendly markdown prose with numbered lists — not raw SudoLang syntax
- Given `analyzeBranch` runs, should read `references/review-feedback.md` to load team standards before analysis
- Given `identifyGroups` runs, should cluster files by layer + domain, colocate tests with source, then dependency-order groups so groups imported by others come first
- Given a breakout group, should enforce max 2000 lines (prefer 500-1000) and colocate tests with source
- Given a merge strategy is inferred, should ask user to confirm before proceeding
- Given all git operations, should use non-interactive git only (no `-i` flags)
- Given `planDecomposition` runs, should create a tracking epic at `tasks/decompose-{branchName}-epic.md` containing an ASCII dependency graph, a numbered PR table (`| # | PR | Files | Status |`), and a WIP issues section
- Given `planDecomposition` completes, should present the plan to the user for approval before executing any breakout
- Given `executeBreakouts` runs, should for each breakout in dependency order: create a branch, `git checkout {source} -- {files}`, commit, push, open a PR via `gh pr create`, and update the tracking epic with the PR URL before pausing for user approval
- Given files are checked out for a breakout, should use `git checkout {source} -- {files}` not cherry-pick
- Given a breakout PR is created, should link to the umbrella PR in its body
- Given breakout PRs are ready to merge, should never merge out of dependency order
- Given `gatherStatus` runs, should check each breakout PR via `gh pr view` for open/merged/closed state, CI status, and new review comments since last sync
- Given `syncFeedback` runs, should document feedback in the tracking epic tagged by breakout PR, reviewer, and resolution status (`resolved | pending | propagated`) with cross-references to which other breakouts the feedback applies to
- Given `syncFeedback` runs, should add a "Review context" section to each open breakout PR body linking back to the epic's feedback section — not only update the epic itself
- Given `updateTracking` runs and the decomposition plan has changed (files moved, new breakouts added), should update all open breakout PR descriptions and the epic's PR table to reflect the current plan
- Given `updateTracking` completes, should update the umbrella PR checklist and present a summary to the user

---

## ✅ Create references/review-feedback.md

Author `ai/skills/aidd-decompose/references/review-feedback.md` encoding known team PR standards.

**Requirements**:
- Given the references file exists, should encode: PR size limits (0-2000 lines, prefer 500-1000), layer dependency order (config → types/utils → services → components → pages → integration → tests → docs), tests travel with source files, branch naming (`breakout/{name}`, `decompose/{source-branch}`), no "misc" or "cleanup" breakouts, every breakout PR body links to umbrella PR, WIP issues tracked and resolved during consolidation
- Given a merge strategy decision is needed, should provide heuristics for consolidation branch vs direct-to-main

---

## ✅ Create Commands

Author `ai/commands/aidd-decompose.md` and `ai/commands/aidd-decompose-status.md` following the established command file pattern in `ai/commands/`.

**Requirements**:
- Given `aidd-decompose.md` is authored, should contain a `# 🧩 /aidd-decompose` heading, a description loading and executing `ai/skills/aidd-decompose/SKILL.md`, and a `Constraints` block requiring `please.mdc` to be read before beginning
- Given `aidd-decompose-status.md` is authored, should contain a `# 📊 /aidd-decompose-status` heading, a description loading the status mode of `ai/skills/aidd-decompose/SKILL.md` starting at Step S1 — Gather Status, and the same `please.mdc` `Constraints` block

---

## ✅ Update please.mdc

Add both commands to the `Commands {}` block in `ai/rules/please.mdc` after the `/aidd-fix` entry.

**Requirements**:
- Given the block is updated, should add `🧩 /aidd-decompose - decompose a large PR into smaller, reviewable breakout PRs` and `📊 /aidd-decompose-status - sync feedback, update tracking, and propagate review context across breakout PRs`
- Given `/help` is run after the update, should list both new commands

---

## ✅ Commit and Verify Pre-commit Hook

Commit all files on `feat/aidd-decompose` and verify the pre-commit hook auto-generates `index.md` files.

**Requirements**:
- Given a commit is made, should trigger the pre-commit hook and regenerate `ai/skills/index.md` and `ai/commands/index.md`
- Given the commit completes, should have a conventional commit message referencing the new skill

---

## ✅ npm link and Test

Link the local aidd repo into paralleldrive.com and run `npx aidd --force` to install the skill, then invoke `/aidd-decompose` on the contractor-marketplace branch.

**Requirements**:
- Given `npm link` is run in the aidd repo (`/Users/ianwhite/code/ParallelDrive/aidd`), should register the local package globally
- Given `npm link aidd` is run in paralleldrive.com (`/Users/ianwhite/code/ParallelDrive/paralleldrive.com`), should resolve `aidd` to the local repo
- Given paralleldrive.com is checked out on branch `iwhite/contractor-marketplace`, should run `npx aidd --force` to copy the updated `ai/` folder including the new skill
- Given `/aidd-decompose` is invoked against `iwhite/contractor-marketplace`, should analyze the branch and present approximately 9 dependency-ordered logical groups for user approval
- Given the initial test run completes, should verify `/aidd-decompose-status` loads and starts at Step S1 — Gather Status
- Given the initial test run completes, should verify both commands appear in `/help` output
