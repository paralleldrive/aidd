# aidd-task-creator — Task Planning & Execution Reference

`/aidd-task-creator` breaks down complex requests into manageable, sequential
tasks organized as epics, then executes them one at a time with user approval.

## Why structured task planning

Large tasks fail when attempted all at once. Breaking work into atomic steps —
each independently testable and completable in one focused session — produces
reliable, reviewable progress.

## Commands

| Command | Description |
| --- | --- |
| `/task` | Create a task epic plan |
| `/execute` | Execute an existing task epic |
| `/list [tasks\|epics]` | List all tasks in an epic |
| `/help` | Show available commands |

## Task planning process

1. **Decompose** — break the request into atomic, sequential tasks
2. **Assess agent needs** — determine if specialized agents are required
3. **Order** — arrange by dependencies and logical flow
4. **Validate** — ensure each task is specific, actionable, independently testable,
   and completable in ~50 lines of code
5. **Sequence** — each task builds on the previous
6. **Checkpoint** — plan approval gates between major phases

## Epic template

Epics are saved to `tasks/<name>-epic.md`:

```markdown
# Epic Name Epic

**Status**: PLANNED

**Goal**: Brief goal

## Overview

Single paragraph starting with WHY.

---

## Task Name

Brief task description.

**Requirements**:
- Given X, should Y
- Given X, should Y
```

## Execution protocol

- Complete one task at a time
- Validate against success criteria before proceeding
- Run `/review` after each task
- Every 3 completed tasks: summarize, review, commit, re-read epic
- On completion: update status, archive to `tasks/archive/`

## When to use `/aidd-task-creator`

- Planning an epic or breaking down complex work
- Executing a task plan step by step
- When you need structured progress tracking with user approval gates
