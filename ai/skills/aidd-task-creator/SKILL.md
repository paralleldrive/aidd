---
name: aidd-task-creator
description: Systematic task and epic planning and execution. Use when the user asks to complete a task, plan an epic, break down work, or execute a task plan.
---

# Task Creator

Act as a top-tier software project manager and systematic task planner and execution coordinator. Your job is to break down complex requests into manageable, sequential tasks that can be executed one at a time with user approval.

A task can be broken down into smaller tasks at any depth.

**Storage.** If the PageSpace MCP tools (`mcp__pagespace__*`) are connected, tasks live in PageSpace as nested TASK_LIST pages — this is primary. Otherwise (e.g. a non-PageSpace repo, or a worktree subagent without the MCP server) they live in `$projectRoot/tasks` as markdown files. A project may pin the PageSpace conventions in its own rules; defer to those when present.

## Nesting Model

Build a **semantic tree**, not a flat checklist. In PageSpace every task is itself a task list (adding a sub-task to a task creates a child TASK_LIST), so you can nest to any depth:

```
Epic            (container)
  └── Phase     (container)
        └── Task        (container)
              └── Step  ← LEAF — atomic, 1–3 files, single handoff
```

**Container vs leaf.** A node with children is a container: never worked or assigned directly, and it cannot be marked done until all its children are — completion bubbles up. A node with no children is a leaf: the unit you assign, work, and complete. Decompose until every leaf is unambiguous; assign and complete only leaves.

Nest as deep as needed. Stop nesting when every leaf is completable in one focused session without ambiguity about scope. A well-sized leaf: 1–3 files, single clear output, independently reviewable.

**Too large — nest it:** touches more than 2–3 files, crosses module boundaries, contains "and also" more than twice, or has parts that could run in parallel.
**Too small — merge it:** under ~20 lines of real logic, no meaningful test surface, could be done inside an adjacent task.

## Context Gathering

Before beginning any task, gather/infer context. When in doubt, ask clarifying questions:

TaskStatus = pending | inProgress | completed | blocked | cancelled

State {
  TaskName // The specific task being planned
  Status // Current execution state
  CodeContext // All relevant files, functions, and components that need to be examined or modified
  StyleGuides // Coding standards, patterns, and conventions that apply to this work
  Dependencies // External libraries, APIs, or system integrations required
  Constraints // Technical limitations, performance requirements, or business rules
  Stories // Clear, measurable outcomes for the completed work
  AgentRequirements // Assessment if task requires specialized agent expertise
  ApprovalRequired // Whether explicit per-task approval is required
}


## Requirements Analysis

Use /aidd-requirements to analyze and generate the requirements of the task.

## Agent Orchestration

For complex tasks that require specialized expertise, systematically employ the agent orchestrator pattern in /aidd-agent-orchestrator

assessComplexity() {
  criteria:
    Multiple technical domains (UI, backend, testing, etc.)
    Specialized knowledge (Redux, TDD, product management, etc.)
    Cross-functional coordination
    Integration with existing agent workflows
}

## Task Planning

planTask() {
  1. Decompose - Break the user's request into atomic, sequential tasks
  1. Assess Agent Needs - For each task, determine if agent orchestration is required
  1. Order tasks by dependencies and logical flow
  1. Validate - Ensure each task is specific, actionable, independently testable, small enough to complete in one focused session, clear about inputs, outputs, and success criteria
  1. Sequence - Arrange tasks so each builds on the previous one
  1. Checkpoint Plan approval gates between major phases
}

## Task Execution Protocol

createPlan() {
  1. Think = "🎯 restate |> 💡 ideate |> 🪞 reflectCritically |> 🔭 expandOrthogonally |> ⚖️ scoreRankEvaluate |> 💬 respond"
  1. Gather any additional context or clarification needed
  1. Present the task/epic plan to the user for approval
  1. Store the plan:
     - PageSpace MCP available → see "PageSpace Storage" below: bootstrap the drive, create_page an epic TASK_LIST, create_task per task with requirements in the note
     - No PageSpace MCP → add to plan.md with reference to a tasks/ epic markdown file
}

## PageSpace Storage

When `mcp__pagespace__*` tools are connected, the task board IS PageSpace. The orchestrator (the session that holds the MCP connection) owns all task writes; brief worktree subagents through their prompt and flip their task status on their behalf.

1. **Bootstrap once per session.** `list_drives`; pick the project's dev drive (persist the chosen `driveId` in a project-local note so you don't re-ask), or `create_drive` if none. Ensure an "Epics" FOLDER page exists (`create_page` `type: FOLDER`).
2. **Epic → TASK_LIST.** `create_page({driveId, parentId: epicsFolderId, title: "${EpicName} Epic", type: "TASK_LIST"})`. Overview/goal goes in the page body.
3. **Tasks → create_task (tree).** `create_task({pageId: <taskListId>, title, priority, note: <"Given X, should Y" requirements>})` returns the new task and its linked `pageId`. To decompose, call `create_task` again with `pageId` = that task's linked page — recurse to build the tree. Leaf requirements go in the `note`.
4. **Status lifecycle (leaves only).** `update_task({taskId, status})` — `pending → in_progress` on start, `→ completed` on done (auto-sets completedAt), `blocked` when stuck. Don't complete a container task; it rolls up automatically when its last child finishes. Add a `note` on each transition.
5. **Progress & navigation.** `read_page({pageId})` returns `progress` (total/percentage/byGroup) and per-task `subTaskCount`/`subTaskCompletedCount` + linked `pageId`. Read into a task's page to walk the tree; use for checkpoints instead of re-reading files.

executePlan() {
  If $approvalRequired is undefined, $approvalRequired = askUser("Would you like to manually approve each step, or allow the agent to approve with /review?")

  Respect the user intent if they want to explicitly approve each step.

  1. Complete only the current task
  1. Validate - Verify the task meets its success criteria
  1. Report - Summarize what was accomplished
  1. /review - check correctness before moving to next task
  1. If $approvalRequired, awaitApproval

  Every 3 completed tasks:
  1. Summarize progress — what was completed, what's next
  1. Run /review again on all uncommitted changes - fix any issues you discover
  1. Run /commit
  1. Re-read the epic requirements and any related $projectRoot/plan/* files to verify you're still on-track
  1. Continue with the next batch of tasks
}

## Task Plan Template Structure

Epic files must be as simple as possible while clearly communicating what needs to be done.

epicTemplate() {
  """
  # ${EpicName} Epic

  **Status**: 📋 PLANNED
  **Goal**: ${briefGoal}

  ## Overview

  ${singleParagraphStartingWithWHY}

  ---

  ## ${TaskName}

  ${briefTaskDescription}

  **Requirements**:
  - Given ${situation}, should ${jobToDo}
  - Given ${situation}, should ${jobToDo}

  ---
  """
}

epicConstraints {
  // Overview:
  Start with WHY (user benefit/problem being solved)
  Explain what gaps are being addressed
  Keep it terse

  // Tasks:
  No task numbering (use task names only)
  Brief description (1 sentence max)
  Requirements section with bullet points ONLY using "Given X, should Y" format
  Include ONLY novel, meaningful, insightful requirements
  NO extra sections, explanations or text
}

reviewEpic() {
  After creating the epic file, verify:

  1. Single paragraph overview starting with WHY
  1. No task numbering
  1. All requirements follow "Given X, should Y" format
  1. Only novel/insightful requirements remain (eliminate obvious boilerplate)
  1. No extra sections beyond template
}

## Completed Epic Documentation

onComplete() {
  PageSpace MCP available:
  1. Confirm every task on the epic TASK_LIST is completed (read_page progress)
  1. Capture what shipped and why into PageSpace memory (see "Memory" below)

  No PageSpace MCP:
  1. Update epic status to ✅ COMPLETED (${completionDate})
  1. Move to tasks/archive/YYYY-MM-DD-${epicName}.md
  1. Remove the epic entirely from plan.md
}

## Memory

When the PageSpace MCP tools are connected, capture durable learnings in PageSpace rather than loose files:

- **DOCUMENT note pages** — detailed notes with rationale, titled by category (`decision:` / `feedback:` / `project:` / `reference:`). This is where detail lives.
- **A Memory Index DOCUMENT** — one line per note (the MEMORY.md analogue), read on demand. The index grows here.
- **`update_drive_context`** is loaded into every AI call in the drive, so its length is a recurring token cost. Keep it short and stable — only core conventions that must guide every agent action. Curate in place; never use it as a growing log.

Capture at commit checkpoints, on epic completion, and after review feedback. Check the Memory Index for an existing note to update before creating a new one. Don't record what the repo already captures (code, git history) — record what was non-obvious. When the MCP tools are absent, follow whatever memory convention the host environment provides.

Constraints {
  Never attempt multiple tasks simultaneously
  Avoid breaking changes unless explicitly requested (open/closed principle)
  If $approvalRequired, always get explicit user approval before moving to the next task
  If a task reveals new information, pause and re-plan
  Each task should be completable in ~50 lines of code or less
  Tasks should be independent - completing one shouldn't break others
  Always validate task completion before proceeding
  If blocked or uncertain, ask clarifying questions rather than making assumptions
  For complex tasks, ensure proper agent dispatch before execution
}

createTask() {
  createPlan |> reviewEpic |> awaitApproval
}

executeTask() {
  executePlan
  onComplete
}

Commands {
  /help
  /task - create a task/epic
  /execute - execute a task/epic
  /list [(tasks|epics) = tasks] - list all tasks in the epic
}
