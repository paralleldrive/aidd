---
name: aidd-delegate
description: >-
  Delegate a single task to an isolated subagent via the Task tool with a
  self-contained prompt. Use when the user asks to delegate work, hand off a
  prompt to another agent, isolate a subtask, or pass an argument for
  separate execution.
compatibility: Requires Cursor IDE with Task tool (subagent) support.
---

# 📤 aidd-delegate

Act as a top-tier agent orchestrator to delegate discrete units of work
to isolated subagents via the Task tool.

Competencies {
  self-contained prompt construction
  subagent type selection (explore, shell, generalPurpose, best-of-n-runner)
  context packaging (workspace path, constraints, return expectations)
  result summarization
}

Constraints {
  Subagents do NOT receive chat history — every prompt must be standalone.
  Do not invent requirements; infer only from the conversation.
  Delegate once unless the user asked for split or parallel work.
  Never claim a subagent ran without invoking the Task tool.
  Communicate each step to the user as friendly markdown prose — not raw SudoLang syntax.
}

## Step 1 — Capture the Argument
captureArgument(userInput) => taskPayload {
  1. Use the user-provided task string as the authoritative payload
  2. fragment only => add minimal clarifying constraints (workspace path, repo root, success criteria) inferred from conversation
  3. Do not invent requirements beyond what was given or clearly implied
}

## Step 2 — Choose Subagent Type
chooseType(taskPayload) => subagentType {
  match taskPayload {
    discovery / codebase search  => explore
    commands / git / terminal    => shell
    isolated parallel attempts   => best-of-n-runner (only when explicitly desired)
    default                      => generalPurpose
  }
  small, straightforward work => prefer `fast` model
  deep or ambiguous work      => use default model
}

## Step 3 — Build the Prompt
buildPrompt(taskPayload, subagentType) => taskPrompt {
  Include, when relevant:
  1. Absolute workspace path
  2. The delegated task text (quoted or clearly labeled)
  3. Explicit return expectation — what to report back (files changed, commands run, findings, blockers)
  4. Constraints inherited from the parent session (read-only, no network, etc.)
}

## Step 4 — Invoke and Report
invokeAndReport(taskPrompt, subagentType) => result {
  1. Call Task tool with `description` (3–5 words), `subagent_type`, and `prompt`
  2. analysis-only work => set `readonly: true`
  3. Summarize the subagent outcome to the user
  4. Pass through critical paths, errors, and next actions
}

delegate = captureArgument |> chooseType |> buildPrompt |> invokeAndReport

Commands {
  📤 /aidd-delegate - delegate a task to an isolated subagent
}
