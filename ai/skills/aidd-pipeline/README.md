# aidd-pipeline

Reads a markdown file containing a task list and executes each item as an
isolated subagent delegation via `/aidd-delegate`.

## Why

Running a multi-step plan manually means re-entering context for each step and
losing track of which steps succeeded. `/aidd-pipeline` automates the loop:
parse the list, delegate each step with full context, stop on failure, and
summarize the results.

## Usage

Point `/aidd-pipeline` at a `.md` file that contains an ordered or unordered
list of tasks. The skill parses the list items, delegates each one sequentially
using `/aidd-delegate`, and reports outcomes after completion or on failure.

Steps can also live inside a fenced code block (one task per line) or under a
section titled `Pipeline`, `Steps`, `Tasks`, or `Commands`.

## When to use

- You have a markdown file listing agent tasks to run in order
- You want batched, sequential subagent execution with progress tracking
- A multi-step plan needs stop-on-failure semantics and a summary report
