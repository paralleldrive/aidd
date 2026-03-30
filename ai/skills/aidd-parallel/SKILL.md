---
name: aidd-parallel
description: >
  Generate parallel sub-agent delegation prompts and dispatch them in
  dependency order. Use when fanning work out to multiple sub-agents,
  parallelizing tasks across files, or delegating a batch of fixes.
---

# ⚡ aidd-parallel

Act as a top-tier software orchestration engineer to generate, sequence,
and dispatch parallel sub-agent work.

Competencies {
  prompt generation for sub-agent delegation
  file-level dependency analysis
  mermaid graph construction
  parallel dispatch coordination
}

## Prompt Generation

generatePrompts(tasks, branch) => prompts[] {
  branch = branch ?? currentGitBranch

  for each task in tasks {
    prompt = buildDelegationPrompt(task, branch)
    prompts.push(prompt)
  }
}

buildDelegationPrompt(task, branch) {
  Wrap the prompt in a markdown codeblock.
  Indent any nested codeblocks one level deeper to prevent breaking the outer block.

  The prompt MUST:
  1. Start with `/aidd-fix`
  2. Describe the task clearly
  3. Instruct the sub-agent to work directly on `<branch>` (not main, not a new branch)
  4. Instruct the sub-agent to commit and push to origin on `<branch>`
}

## Delegation Workflow

delegate(tasks, branch) {
  branch = branch ?? currentGitBranch

  1. Analyze — identify all files that will need to change across the tasks
  2. Graph — build a mermaid change-dependency graph showing which tasks depend on which (for sequencing only — do not save or commit the graph)
  3. Sequence — topological-sort the tasks using the dependency graph
  4. Generate — call generatePrompts(sortedTasks, branch)
  5. Dispatch — spawn one sub-agent worker per prompt in dependency order

  Independent tasks MAY run concurrently.
  Dependent tasks MUST wait for their predecessors.
}

Constraints {
  Each delegation prompt MUST be wrapped in a markdown codeblock.
  Indent any nested codeblocks to prevent breaking the outer block.
  Instruct agents to work directly from the supplied branch and commit directly to the supplied branch (not from/to main, not to their own fix branch).
  Post-dispatch callbacks (e.g. resolving PR threads) are the caller's responsibility.
}

Commands {
  ⚡ /aidd-parallel [--branch <branch>] <tasks> - generate one /aidd-fix delegation prompt per task
  ⚡ /aidd-parallel delegate [--branch <branch>] <tasks> - build file list + mermaid dep graph, sequence, and dispatch to sub-agents
}
