# aidd-pr — Pull Request Review & Fix Delegation Reference

`/aidd-pr` guides an AI agent through triaging pull request review comments,
resolving already-addressed conversations, and delegating targeted fix prompts
to sub-agents using `/aidd-fix` — one issue at a time, with no scope creep.

## Why a structured PR review process matters

Unstructured PR review handling shares a common failure mode: comments pile up,
it is unclear which ones are resolved, and broad "fix everything" prompts produce
unfocused changes that introduce regressions. `/aidd-pr` enforces the opposite
discipline:

1. Fetch the PR and enumerate all open review threads
2. Identify which comments have already been addressed in code
3. Present the addressed list for manual approval, then resolve those conversations
4. Validate the remaining open issues against the current source
5. Generate a focused `/aidd-fix` delegation prompt for each confirmed issue
6. Optionally dispatch those prompts to sub-agents and resolve threads automatically

## The PR workflow

### Step 1 — Fetch PR details

Use `gh pr view` and the GitHub API to retrieve the PR's title, description,
branch name, base branch, and the full list of review comments with their
resolution status.

### Step 2 — Identify already-addressed comments

For each open review thread, inspect the git log and current diff to determine
whether the concern has already been resolved in code. Collect confirmed
resolutions into an "addressed" list and present it to the user before taking
any action.

### Step 3 — Resolve addressed comments

After the user approves the addressed list, use the GitHub GraphQL API to mark
each conversation thread as resolved:

```graphql
mutation {
  resolveReviewThread(input: { threadId: $threadId }) {
    thread { isResolved }
  }
}
```

### Step 4 — Validate remaining issues

For each comment that was not addressed, read the relevant source files to
confirm the issue still exists in the current codebase. If a comment turns out
to already be fixed but not yet marked resolved, move it to the addressed list
and resolve it.

### Step 5 — Generate fix delegation prompts

For each confirmed remaining issue, generate a focused prompt that:

- Starts with `/aidd-fix`
- Describes **only** that single issue
- Instructs the delegated agent to work directly on the PR branch (not `main`,
  not a separate fix branch)
- References the specific file(s) and line(s) involved

Each prompt is wrapped in a markdown codeblock. Any nested codeblocks inside
the prompt are indented to prevent breaking the outer block.

### Step 6 — Delegate (optional)

Running `/aidd-pr delegate` dispatches each generated prompt to a sub-agent.
After each fix is confirmed, the related PR conversation thread is resolved via
the GitHub GraphQL API.

## Commands

```
/aidd-pr [PR URL]    — identify open issues and generate /aidd-fix delegation prompts
/aidd-pr delegate    — dispatch prompts to sub-agents and resolve related conversations
```

## Constraints

- Never close any other PRs
- Never modify any branch other than the PR's own branch
- Each delegated agent works directly on the PR branch — not from/to `main`,
  not to a separate fix branch
- Delegation prompts are presented as markdown codeblocks; nested codeblocks
  are indented to prevent breaking the outer block
- Always get manual approval before resolving any PR conversation thread
