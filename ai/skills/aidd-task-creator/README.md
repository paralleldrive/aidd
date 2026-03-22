# aidd-task-creator

Breaks down complex requests into manageable, sequential tasks organized as
epics, then executes them one at a time with user approval.

## Why

Large tasks fail when attempted all at once. Breaking work into atomic steps —
each independently testable and completable in one focused session — produces
reliable, reviewable progress.

## Usage

Commands: `/task` (create an epic plan), `/execute` (run an existing epic),
`/list [tasks|epics]`, `/help`.

Epics are saved to `tasks/<name>-epic.md`. Each task includes requirements in
"Given X, should Y" format. Execution proceeds one task at a time with
`/review` after each, and a checkpoint every 3 tasks.

## When to use

- Planning an epic or breaking down complex work
- Executing a task plan step by step
- When you need structured progress tracking with user approval gates
