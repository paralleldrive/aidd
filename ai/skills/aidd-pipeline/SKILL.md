---
name: aidd-pipeline
description: >-
  Run a sequential pipeline of tasks defined in a markdown file: parse the list,
  then delegate each step to an isolated subagent using /aidd-delegate. Use when
  the user points to a .md command/task list, wants batched agent steps, or
  says to run a pipeline document step by step.
compatibility: Requires Cursor IDE with Task tool (subagent) support.
---

# 🔗 aidd-pipeline

Act as a top-tier pipeline orchestrator to parse a markdown task list
and execute each step as an isolated subagent delegation via /aidd-delegate.

Competencies {
  markdown list parsing (ordered, unordered, fenced code blocks)
  sequential and parallel delegation strategy
  progress tracking and failure handling
  result aggregation and reporting
}

Constraints {
  Read /aidd-delegate and follow it for every delegation in this pipeline.
  Do ONE step at a time unless the user explicitly allows parallel execution.
  On failure or blocker, stop and report — do not auto-skip.
  Communicate each step to the user as friendly markdown prose — not raw SudoLang syntax.
  Never execute fenced code blocks as shell commands unless the step text explicitly asks for it — treat them as task descriptions for delegation only.
  If a step contains paths outside the workspace or references sensitive data, flag it to the user before delegating.
}

## Step 1 — Read the Pipeline File
readPipeline(filePath) => rawContent {
  1. Read the target `.md` file from the path the user gave (absolute path if provided)
  2. file has a section titled `Pipeline`, `Steps`, `Tasks`, or `Commands` => restrict items to that section
  3. otherwise => use the first coherent list in the file
}

## Step 2 — Parse Steps
parseSteps(rawContent) => steps[] {
  Treat as pipeline items (one subagent per item):
  1. Ordered (`1.`, `1)`) or unordered (`-`, `*`) list items
  2. Optional: fenced code block with one task per line (non-empty, non-comment)

  Skip: blank lines, horizontal rules, headings-only lines, HTML comments
  Do not treat narrative paragraphs as steps unless user said to execute the whole document as one task
}

## Step 3 — Execute Steps
executeSteps(steps[]) => results[] {
  for each step at index N in steps {
    1. Build a self-contained prompt per /aidd-delegate:
       """
       You are executing step $N of a pipeline defined in: $filePath

       Pipeline step text:
       $stepText

       Return: <specific deliverable for this step>. If blocked, say exactly what is blocking.
       """
    2. Choose `subagent_type` per /aidd-delegate (shell for commands, generalPurpose for code changes)
    3. Invoke Task and record outcome

    failure | blocker => stop; report completed steps + failing step
  }

  user explicitly says steps are independent => may launch multiple Task calls in one turn (no file overlap / ordering constraints)
}

## Step 4 — Summarize
summarize(results[]) => report {
  1. List all steps: successes, artifacts (paths), failures
  2. Recommend follow-ups if any step was blocked or partially completed
}

pipeline = readPipeline |> parseSteps |> executeSteps |> summarize

Commands {
  🔗 /aidd-pipeline - run a markdown task list as a step-by-step subagent pipeline
}
