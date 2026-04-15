# aidd-parallel Skill Epic

**Status**: 🔬 IN REVIEW
**Goal**: Extract parallel prompt generation and sub-agent dispatch into a shared `/aidd-parallel` skill, fix the constraint conflation in `/aidd-pr`, and make prompt generation independently unit-testable.

## Overview

The prompt generation and sub-agent dispatch logic in `/aidd-pr` is reusable across any skill that needs to fan work out to sub-agents (PR review, task execution, etc). Extracting it into `/aidd-parallel` gives us a clean unit-testable boundary, fixes the constraint conflation problem in `/aidd-pr` (orchestrator constraints mixed with sub-agent constraints), and makes `/aidd-pr` simpler.

---

## Create the aidd-parallel skill

Add `ai/skills/aidd-parallel/SKILL.md` following the AgentSkills specification.

**Requirements**:
- Given the agent needs to discover the skill, its name and description should be in the frontmatter
- Given the agent needs to discover what a skill does, the description should include a very brief description of functionality without delving into implementation details
- Given the agent needs to discover when to use a skill, the description should include a very brief "Use when..." clause
- Given a list of tasks, should generate one `/aidd-fix` delegation prompt per task
- Given a delegation prompt, should start with `/aidd-fix`
- Given a delegation prompt, should be wrapped in a markdown codeblock, with any nested codeblocks indented to prevent breaking the outer block
- Given `--branch <branch>` is supplied, should instruct each sub-agent to work directly on `<branch>` and commit and push to origin on `<branch>`
- Given `--branch` is omitted, should assume the current branch
- Given `/aidd-parallel delegate`, should first create a list of files that will need to change and a mermaid change dependency graph (for sequencing reference only — do not save or commit)
- Given `/aidd-parallel delegate`, should use the dependency graph to sequence the prompts before dispatching
- Given `/aidd-parallel delegate`, should spawn one sub-agent worker per prompt in dependency order
- Given post-dispatch callbacks are needed (e.g. resolving PR threads), should be the caller's responsibility

Constraints {
  put the prompt in a markdown codeblock, indenting any nested codeblocks to prevent breaking the outer block
  instruct the agent to work directly from the supplied branch and commit directly to the supplied branch (not from/to main, not to their own fix branch)
  instruct the agent to pull --rebase before pushing so concurrent agents on the same branch don't fail with non-fast-forward errors
}

Commands {
  /aidd-parallel [--branch <branch>] <tasks> - generate one /aidd-fix delegation prompt per task
  /aidd-parallel delegate - build file list + mermaid dep graph, sequence, and dispatch to sub-agents
}

---

## Add the aidd-parallel command

Add `ai/commands/aidd-parallel.md` so the skill is invokable and discoverable.

**Requirements**:
- Given the command file, should load and execute `ai/skills/aidd-parallel/SKILL.md`
- Given the command file, should respect constraints from `/aidd-please`

---

## Update aidd-pr to use aidd-parallel

Remove the prompt generation and constraint logic from `/aidd-pr` that now belongs in `/aidd-parallel`.

**Requirements**:
- Given remaining issues after triage, `/aidd-pr` should call `/aidd-parallel` to generate delegation prompts rather than generating them inline
- Given the inner `Constraints` block in `/aidd-pr` (codeblock format, branch targeting), should be removed from `/aidd-pr` — it belongs in `/aidd-parallel`
- Given `/aidd-pr delegate`, should call `/aidd-parallel delegate` and then resolve related PR conversation threads via the GitHub GraphQL API

---

## Add aidd-parallel eval

Add `ai-evals/aidd-parallel/` with a unit eval for prompt generation.

**Requirements**:
- Given a list of tasks and a branch, the eval should assert one prompt is generated per task
- Given a generated prompt, should assert it starts with `/aidd-fix`
- Given a generated prompt, should assert it references the correct branch
- Given a generated prompt, should assert it is wrapped in a markdown codeblock

---

## Update aidd-please discovery

Add `/aidd-parallel` to the Commands block in `ai/skills/aidd-please/SKILL.md`.

**Requirements**:
- Given the aidd-please Commands block, should list `/aidd-parallel` so agents can discover it
