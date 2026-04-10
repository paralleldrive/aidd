# aidd-pr

`/aidd-pr` triages pull request review comments, resolves already-addressed threads, and delegates targeted fix prompts to sub-agents via `/aidd-fix`.

## Why

PR review threads accumulate quickly. Manually checking which comments are
already addressed wastes reviewer and author time. A systematic triage step
clears resolved threads and focuses attention on what still needs work.

## Usage

```
/aidd-pr [PR URL]    — triage comments, resolve addressed threads, and generate /aidd-fix delegation prompts
/aidd-pr delegate    — dispatch the generated prompts to sub-agents and resolve related PR conversations via the GitHub GraphQL API
```

## How it works

1. Uses `gh` to fetch PR metadata and the GitHub GraphQL API to list all open review threads
2. Reads the referenced file and line for each thread to classify it as addressed or remaining
3. Presents the addressed list for manual approval, then resolves those threads via the GraphQL `resolveReviewThread` mutation
4. For each remaining issue, generates a focused `/aidd-fix` delegation prompt — one issue per prompt, targeting the PR branch directly

## When to use

- A PR has accumulated open review comments that need triage
- You want to batch-resolve threads that are already addressed in code
- You need to delegate remaining review feedback to sub-agents for parallel fixes
