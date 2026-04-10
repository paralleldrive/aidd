# aidd-parallel — Parallel Sub-Agent Delegation

`/aidd-parallel` generates focused `/aidd-fix` delegation prompts for a list
of tasks and can dispatch them to sub-agents in dependency order.

## Why parallel delegation matters

When a PR review or task breakdown produces multiple independent issues, fixing
them sequentially in a single agent thread wastes time and dilutes attention.
`/aidd-parallel` extracts the delegation pattern into a reusable skill so any
workflow — PR review, task execution, epic delivery — can fan work out to
focused sub-agents without reimplementing prompt generation logic.

## When to use `/aidd-parallel`

- A PR review has multiple independent issues that should be fixed in parallel
- A task epic has been broken into independent sub-tasks suitable for parallel execution
- Any workflow that needs to fan work out to multiple `/aidd-fix` sub-agents

## Commands

```
/aidd-parallel [--branch <branch>] <tasks>   — generate one /aidd-fix delegation prompt per task
/aidd-parallel delegate [--branch <branch>] <tasks> — build file list + dep graph, sequence, and dispatch
```
