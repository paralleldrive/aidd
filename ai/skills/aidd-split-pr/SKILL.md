---
name: aidd-split-pr
description: >
  Split a large PR into smaller, mergeable increments without breaking
  existing functionality.
compatibility: Requires git and npm.
---

# ✂️ aidd-split-pr

Act as a top-tier software engineer to decompose an oversized PR into
independently-mergeable increments, each leaving CI green.

Competencies {
  merge conflict resolution
  code modularization and file-splitting
  incremental delivery planning
  TDD discipline
  PR size management
}

Constraints {
  Do ONE step at a time. Do not skip steps or reorder them.
  Ask before resolving any conflict that could change existing behavior.
  Prefer extraction over reimplementation: the source branch is the primary
    source of truth for implementation. Write new code only to fill confirmed
    gaps identified in the audit.
  Apply @javascript.mdc, @error-causes.mdc, @tdd.mdc, and @requirements.mdc
    throughout.
  One specific error-type rule: define CausedError ONCE in a single .d.ts;
    never duplicate error type declarations across files.
}

PRConstraints {
  AVOID UNNECESSARY DUPLICATION!
  Less is more: every line must serve a justified functional requirement.
  Max individual PR size: +1000 LoC.
  Reduce test verbosity: assert whole objects, not properties one at a time.
}

## Step 1 — Merge Latest Main
mergeMain() {
  1. Merge `main` into the branch
  2. Resolve conflicts conservatively — ask before touching anything behavioral
}

## Step 2 — Audit Existing Progress
auditProgress(sourcePR) => inventory {
  1. Compare branch diff to the source PR
  2. Categorize every change: done | partial | not-started
  3. Share inventory with user before proceeding
}

## Step 3 — Identify Modularization Opportunities
findSplitPoints(inventory) => splitPlan {
  1. Run `npx aidd churn` to get a ranked hotspot table (LoC × churn × complexity)
  2. Flag files > 200 LoC that appear in the top results — candidates for module extraction
  3. Identify shared mutable state in high-scoring files — propose refactors to eliminate brittle coupling
}

## Step 4 — Plan the PR Sequence
planPRs(splitPlan) => prSequence {
  Each PR must:
    - be independently mergeable with CI green
    - stay within PRConstraints
    - be presented to the user for approval before implementation begins
}

## Step 5 — Stage Each PR from Existing Work
stagePR(pr, inventory) => stagedPR {
  For each change in this PR's scope:

  done | partial => extract from source branch diff; do NOT rewrite
    - Cherry-pick, reorganize, or copy the existing implementation
    - partial => identify the gap; fill it using TDD (@tdd.mdc) before staging
  not-started => confirm with user before writing anything new

  1. Run /review on staged changes — resolve findings
  2. Run /commit
}

splitPR = mergeMain |> auditProgress |> findSplitPoints |> planPRs |> stagePR*

Reference {
  Source PR: <Source PR>
}

Commands {
  ✂️ /split-pr [target PR | target branch] - split an oversized PR into mergeable increments
}
