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

Constraints {
  Do ONE step at a time. Do not skip steps or reorder them.
  Never close any other PRs.
  Never modify any branch other than the PR's own branch.
  Instruct delegated agents to branch directly from the PR branch and commit directly to the PR branch — not from/to main, not to their own fix branch.
  Put each delegation prompt in a markdown codeblock; indent any nested codeblocks to prevent breaking the outer block.
  Communicate each step to the user as friendly markdown prose with numbered lists — not raw SudoLang syntax.
}

## Step 1 — Fetch PR details

```sudolang
fetchPR(prUrl) => prDetails {
  use `gh pr view $prUrl` to retrieve title, description, branch name, and base branch
  use `gh pr review $prUrl --list` or `gh api` to list all review comments and their resolution status
}
```

## Step 2 — Identify already-addressed comments

```sudolang
identifyAddressed(prDetails) => { addressed, remaining } {
  for each review comment {
    check git log and diff to determine if the concern has already been resolved
    addressed => list the comment with a brief note explaining why it is resolved
    unresolved => add to remaining list
  }
  present addressed list to user for manual approval before resolving
}
```

## Step 3 — Resolve addressed comments

```sudolang
resolveAddressed(addressed) {
  after user approves the addressed list:
  for each approved comment {
    use GitHub GraphQL API to mark the PR conversation as resolved:
      mutation { resolveReviewThread(input: { threadId: $threadId }) { thread { isResolved } } }
  }
}
```

## Step 4 — Validate remaining issues

```sudolang
validateRemaining(remaining) => validatedIssues {
  for each remaining comment {
    read relevant source files to confirm the issue still exists
    confirmed => add to validatedIssues
    already fixed but not marked resolved => move to addressed list and resolve
  }
}
```

## Step 5 — Generate fix delegation prompts

```sudolang
generateDelegations(validatedIssues, prBranch) => delegationPrompts {
  for each validatedIssue {
    generate a prompt that:
      starts with `/aidd-fix`
      describes ONLY that single issue
      instructs the agent to work on `$prBranch` directly (not main, not a separate branch)
      references the specific file(s) and line(s) involved
    wrap the prompt in a markdown codeblock
    indent any nested codeblocks inside the outer codeblock
  }
  present all delegation prompts to the user
}
```

## Step 6 — Delegate (optional)

```sudolang
delegate(delegationPrompts) {
  /aidd-pr delegate =>
    for each delegationPrompt {
      dispatch to a sub-agent
      after fix is confirmed, use GraphQL API to resolve the related PR conversation thread
    }
}
```

pr = fetchPR |> identifyAddressed |> resolveAddressed |> validateRemaining |> generateDelegations

Commands {
  🔍 /aidd-pr [PR URL] - take a PR URL, identify issues, and generate /aidd-fix delegation prompts
  🔍 /aidd-pr delegate - dispatch generated prompts to sub-agents and resolve related PR conversations
}
