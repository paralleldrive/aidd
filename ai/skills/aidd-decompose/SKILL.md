---
name: aidd-decompose
description: >
  Decompose a large PR into smaller, reviewable breakout PRs in dependency order.
  Use when a PR exceeds ~2000 lines, when review feedback requests smaller chunks,
  or when you need to track and sync feedback across breakout PRs in progress.
compatibility: Requires git and gh CLI.
---

# 🧩 aidd-decompose

Act as a top-tier software project manager and code reviewer to systematically
decompose large PRs into focused, reviewable breakout PRs following a proven
dependency-ordered workflow.

Competencies {
  PR analysis and file classification by layer
  dependency-ordered grouping
  non-interactive git operations
  gh CLI for PR creation and status checking
  feedback tracking and cross-PR propagation
}

Constraints {
  Do ONE step at a time. Do not skip steps or reorder them.
  Use non-interactive git only — no -i flags.
  Use `git checkout {source} -- {files}` to move files into breakouts — never cherry-pick.
  Tests must travel with their source files — never separate them.
  Max 2000 lines per breakout group (prefer 500-1000).
  Never merge breakout PRs out of dependency order.
  Communicate each step to the user as friendly markdown prose with numbered lists — not raw SudoLang syntax.
}

---

## Decompose Pipeline

decompose = analyzeBranch |> identifyGroups |> planDecomposition |> executeBreakouts |> trackProgress

---

## Step 1 — Analyze the Source Branch

analyzeBranch(sourceBranch, targetBranch) => analysis {
  1. Read `references/review-feedback.md` to load team PR standards
  2. Run diff stats and review commit history between sourceBranch and targetBranch
  3. Classify all changed files by layer:
     config | types/utils | services | components | pages | integration | tests | docs
  4. Report total line count and file breakdown to user
}

## Step 2 — Identify Logical Groups

identifyGroups(analysis) => groups {
  1. Cluster files by layer + domain; colocate each test file with its source file
  2. Enforce 0-2000 lines per group (prefer 500-1000); split large clusters as needed
  3. Dependency-order the groups: groups that are imported by others come first
  4. Present the proposed groups to the user for feedback before proceeding
}

## Step 3 — Plan the Decomposition

planDecomposition(groups) => plan {
  1. Infer merge strategy (consolidation branch vs direct-to-main); present reasoning and ask user to confirm
  2. Create tracking epic at `tasks/decompose-{branchName}-epic.md` containing:
     - ASCII dependency graph showing module relationships between groups
     - Numbered PR table: `| # | Breakout | Files | Lines | Status |`
     - WIP issues section for tracking known gaps or cross-cutting concerns
  3. Present the full plan to the user and await approval before any breakout is executed
}

## Step 4 — Execute Breakout PRs

executeBreakouts(plan) => breakoutPRs {
  For each breakout in dependency order:
  1. Create branch: `git checkout -b breakout/{name}`
  2. Check out files from source: `git checkout {sourceBranch} -- {files}`
  3. Commit with a conventional message referencing the umbrella PR
  4. Push: `git push -u origin breakout/{name}`
  5. Open PR via `gh pr create` — body must link to the umbrella PR
  6. Update tracking epic with the new PR URL and current status
  7. Pause and report to the user — await approval before the next breakout
}

## Step 5 — Track and Report

trackProgress(breakoutPRs) => status {
  1. Update the umbrella PR checklist (open / merged / pending per breakout)
  2. Update the tracking epic status table
  3. Present a summary to the user
}

---

## Status Pipeline

status = gatherStatus |> syncFeedback |> updateTracking

---

## Step S1 — Gather Status

gatherStatus(epicPath) => currentState {
  1. Read the tracking epic to load the current decomposition plan
  2. For each breakout PR, run `gh pr view {pr}` to check:
     open/merged/closed state, CI status, and new review comments since last sync
  3. Report current state to the user
}

## Step S2 — Sync Feedback

syncFeedback(currentState) => updatedFeedback {
  1. Collect all review feedback from merged and open breakout PRs
  2. Document feedback in the tracking epic under a "Review Feedback" section:
     - Tagged by breakout PR and reviewer
     - Resolution status for each item: resolved | pending | propagated
     - Cross-references to which other breakouts each item applies to
  3. For each open breakout PR, add or update a "Review context" section in the PR body
     linking back to the tracking epic's feedback section
  4. If feedback from one breakout applies to another (e.g. "use error-causes pattern"),
     propagate it: reference it explicitly in the affected breakout's PR description
}

## Step S3 — Update Tracking

updateTracking(updatedFeedback) => report {
  1. Update the umbrella PR checklist (merged / pending per breakout)
  2. Update the tracking epic status table
  3. If the decomposition plan has changed (files moved, new breakouts added):
     - Update all open breakout PR descriptions to reflect the current plan
     - Update the epic's PR table
  4. Present a summary to the user
}
