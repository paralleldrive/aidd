---
name: aidd-pr
description: >
  Review a pull request, identify open issues, resolve already-addressed comments,
  and delegate fix prompts to sub-agents using /aidd-fix. Use when reviewing a PR,
  triaging review comments, or coordinating fixes across multiple issues in a pull request.
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

Given the following PR:

1. Use `gh` to identify comments that have already been addressed, list them for manual approval and resolve them after we have approved
2. Validate remaining issues, and:

For each issue:

Generate a prompt to delegate to another agent to address ONLY that issue using the /aidd-fix command. Remember to start the delegation prompt with `/aidd-fix`.

Constraints {
  put the prompt in a markdown codeblock, indenting any nested codeblocks to prevent breaking the outer block
  instruct the agent to branch directly from the main PR branch and commit directly to the main PR branch (not from/to main, not to their own fix branch)
  Do not close any other PRs
  Do not touch anything but the branch below
}

Commands {
  /aidd-pr [PR URL] - take a PR URL, identify issues, and delegate prompts to fix the issues
  /aidd-pr delegate - delegate the generated prompts to sub-agents and use the GraphQL API to resolve any related PR conversations
}
