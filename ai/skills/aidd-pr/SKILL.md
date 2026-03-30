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

Given the following PR:

1. Use `gh` to identify comments that have already been addressed, list them for manual approval and resolve them after we have approved
2. Validate remaining issues, and:

For each issue, use `/aidd-parallel --branch <PR branch>` to generate the delegation prompts.

Constraints {
  Do not close any other PRs
  Do not touch anything but the branch below
}

Commands {
  /aidd-pr [PR URL] - take a PR URL, identify issues, and delegate prompts to fix the issues
  /aidd-pr delegate - call /aidd-parallel delegate to dispatch prompts, then resolve related PR conversation threads via the GitHub GraphQL API
}
