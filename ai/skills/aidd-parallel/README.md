# aidd-parallel — Parallel Sub-Agent Delegation

`/aidd-parallel` generates focused `/aidd-fix` delegation prompts for a list
of tasks and can dispatch them to sub-agents in dependency order.

## Usage

```
/aidd-parallel [--branch <branch>] <tasks>   — generate one /aidd-fix delegation prompt per task
/aidd-parallel delegate                       — build file list + dep graph, sequence, and dispatch
```

## Why parallel delegation matters

When a PR review or task breakdown produces multiple independent issues, fixing
them sequentially in a single agent thread wastes time and dilutes attention.
`/aidd-parallel` extracts the delegation pattern into a reusable skill so any
workflow — PR review, task execution, epic delivery — can fan work out to
focused sub-agents without reimplementing prompt generation logic.

## How it works

### Step 1 — Resolve the branch

If `--branch <branch>` is supplied, use that branch. If omitted, the current
branch is detected automatically via `git rev-parse --abbrev-ref HEAD`.

### Step 2 — Generate delegation prompts

For each task, one `/aidd-fix` delegation prompt is produced. Every prompt:

- Starts with `/aidd-fix`
- Contains only the context needed for that single task
- Instructs the sub-agent to work directly on the target branch and commit and
  push to `origin/<branch>` — never to `main`, never to a new branch
- Is wrapped in a fenced markdown codeblock; any nested codeblocks are indented
  one level to prevent them from breaking the outer fence

### Step 3 (delegate only) — Build the dependency graph

`/aidd-parallel delegate` first builds a list of files each task will change,
then produces a Mermaid change dependency graph. The graph is used for
sequencing only — it is not saved or committed.

### Step 4 (delegate only) — Dispatch in dependency order

Prompts are dispatched to sub-agent workers in the order determined by the
dependency graph: tasks with no dependencies first, dependents after their
prerequisites are complete.

Post-dispatch callbacks (e.g. resolving PR conversation threads) are the
caller's responsibility.

## When to use `/aidd-parallel`

- A PR review has multiple independent issues that should be fixed in parallel
- A task epic has been broken into independent sub-tasks suitable for parallel execution
- Any workflow that needs to fan work out to multiple `/aidd-fix` sub-agents

## Constraints

- Each prompt must be wrapped in a markdown codeblock
- Nested codeblocks inside a prompt must be indented to prevent breaking the outer fence
- Sub-agents are always directed to the supplied branch — never to `main` or a new branch
