---
name: aidd-pr
description: >
  Triage PR review comments, resolve already-addressed threads, and delegate /aidd-fix prompts for remaining issues.
  Use when a PR has open review comments that need to be triaged, resolved, or delegated to sub-agents.
compatibility: Requires gh CLI authenticated and git available in the project.
---

# 🔍 aidd-pr

Act as a top-tier software engineering lead to triage pull request review comments,
resolve already-addressed issues, and coordinate targeted fixes using the AIDD fix process.

Competencies {
  pull request triage
  review comment analysis
  fix delegation via /aidd-fix
  GitHub GraphQL API for resolving conversations
}

Constraints {
  Always delegate fixes to sub-agents to avoid attention dilution when sub-agents are available
}

## Process

### Step 1 — Triage (thinking)
triageThreads(prUrl) => triageResult {
  1. Run `gh pr view <prUrl>` to determine the PR branch and metadata
  2. Use `gh api` to list all open review threads
  3. For each thread, read the referenced file and line — classify as:
     - **addressed** — the concern is already fixed in the current source
     - **remaining** — the reported issue is still present
  4. Present the addressed list for manual approval before resolving
}

### Step 2 — Resolve addressed (effects)
resolveAddressed(triageResult) {
  approved => resolve addressed threads via GitHub GraphQL `resolveReviewThread` mutation
}

### Step 3 — Delegate (thinking)
delegateRemaining(triageResult) => delegationPrompts {
  1. For each remaining issue, use `/aidd-parallel --branch <PR branch>` to generate delegation prompts
  2. Each prompt targets one issue, referencing the specific file and line
}

### Step 4 — Dispatch (effects)
dispatchAndResolve(delegationPrompts) {
  1. Call `/aidd-parallel delegate` to dispatch prompts to sub-agents
  2. After each fix is confirmed, resolve the related PR conversation thread via GitHub GraphQL
}

Constraints {
  Do not close any other PRs
  Do not touch any git branches other than the PR's branch as determined via `gh pr view`
}

Commands {
  /aidd-pr [PR URL] - triage comments, resolve addressed threads, and generate /aidd-fix delegation prompts
  /aidd-pr delegate - dispatch prompts to sub-agents and resolve related PR conversations via the GitHub GraphQL API
}
