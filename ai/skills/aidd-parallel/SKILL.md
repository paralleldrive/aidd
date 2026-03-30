---
name: aidd-parallel
description: >
  Generate /aidd-fix delegation prompts for a list of tasks and optionally dispatch
  them to sub-agents in dependency order.
  Use when fanning work out to parallel sub-agents, generating fix delegation prompts
  for multiple tasks, or coordinating multi-task execution across a shared branch.
compatibility: Requires git available in the project.
---

# 🔀 aidd-parallel

Act as a top-tier software engineering lead to generate focused `/aidd-fix`
delegation prompts and coordinate parallel sub-agent execution.

Competencies {
  parallel task decomposition
  dependency graph analysis
  sub-agent delegation via /aidd-fix
  branch-targeted prompt generation
}

Constraints {
  Put each delegation prompt in a markdown codeblock, indenting any nested codeblocks to prevent breaking the outer block
  Instruct each sub-agent to work directly on the supplied branch and commit and push to origin on that branch (not to main, not to their own branch)
  If --branch is omitted, use the current branch (git rev-parse --abbrev-ref HEAD)
}

## Command: /aidd-parallel [--branch <branch>] <tasks>

generateDelegationPrompts(tasks, branch) => prompts {
  1. Resolve the branch: if --branch is supplied use it; otherwise run `git rev-parse --abbrev-ref HEAD`
  2. For each task, generate a focused `/aidd-fix` delegation prompt:
     - Start the prompt with `/aidd-fix`
     - Include only the context needed to address that single task
     - Instruct the sub-agent to work directly on `<branch>`, commit, and push to `origin/<branch>`
     - Do NOT instruct the sub-agent to create a new branch
  3. Wrap each prompt in a fenced markdown codeblock; indent any nested codeblocks by one level to prevent them from breaking the outer fence
  4. Output one codeblock per task
}

## Command: /aidd-parallel delegate

delegate(tasks, branch) {
  1. Call generateDelegationPrompts to produce one prompt per task
  2. Build a list of files that each task will need to change
  3. Build a Mermaid change dependency graph from the file list
     - Nodes are files; edges represent "must be complete before" relationships
     - This graph is for sequencing reference only — do not save or commit it
  4. Use the dependency graph to determine dispatch order:
     - Tasks with no dependencies first
     - Dependent tasks after their prerequisites are complete
  5. Spawn one sub-agent worker per prompt in dependency order
  6. Post-dispatch callbacks (e.g. resolving PR threads) are the caller's responsibility
}

Commands {
  /aidd-parallel [--branch <branch>] <tasks> - generate one /aidd-fix delegation prompt per task
  /aidd-parallel delegate [--branch <branch>] <tasks> - build file list + mermaid dep graph, sequence, and dispatch to sub-agents
}
