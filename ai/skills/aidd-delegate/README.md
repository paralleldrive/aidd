# aidd-delegate

Delegates a single task to an isolated subagent via the Cursor Task tool,
packaging a self-contained prompt with workspace context and return expectations.

## Why

Subagents receive no chat history — a bare task string without context leads to
hallucinated paths, missing constraints, and wasted turns. `/aidd-delegate`
enforces a disciplined packaging step so the subagent gets everything it needs
in one shot.

## Usage

Invoke `/aidd-delegate` with the task text. The skill captures the argument,
selects a subagent type (`explore`, `shell`, `generalPurpose`, or
`best-of-n-runner`), builds a standalone prompt including workspace path and
return expectations, then invokes the Task tool and summarizes the result.

## When to use

- A discrete unit of work should run in isolation with a clean context
- You want to hand off a prompt to a subagent without losing critical context
- A subtask needs a different subagent type than the current session
