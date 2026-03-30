# aidd-parallel Skill Epic

**Status**: 🔄 IN PROGRESS
**Goal**: Extract parallel prompt generation and sub-agent dispatch into a shared `/aidd-parallel` skill, making prompt generation independently unit-testable.

## Overview

The prompt generation and sub-agent dispatch logic is reusable across any skill that needs to fan work out to sub-agents (PR review, task execution, etc). Extracting it into `/aidd-parallel` gives us a clean unit-testable boundary and a single place to call when parallelizing work.

---

## Create the aidd-parallel skill

Add `ai/skills/aidd-parallel/SKILL.md` following the AgentSkills specification.

**Requirements**:
- Given the agent needs to discover the skill, its name and description should be in the frontmatter
- Given the agent needs to discover when to use a skill, the description should include a "Use when..." clause
- Given a list of tasks, should generate one `/aidd-fix` delegation prompt per task
- Given a delegation prompt, should start with `/aidd-fix`
- Given a delegation prompt, should be wrapped in a markdown codeblock, with any nested codeblocks indented to prevent breaking the outer block
- Given `--branch <branch>` is supplied, should instruct each sub-agent to work directly on `<branch>` and commit and push to origin on `<branch>`
- Given `--branch` is omitted, should assume the current branch
- Given `/aidd-parallel delegate`, should first create a list of files that will need to change and a mermaid change dependency graph
- Given `/aidd-parallel delegate`, should use the dependency graph to sequence the prompts before dispatching
- Given `/aidd-parallel delegate`, should spawn one sub-agent worker per prompt in dependency order

---

## Add the aidd-parallel command

Add `ai/commands/aidd-parallel.md` so the skill is invokable and discoverable.

**Requirements**:
- Given the command file, should load and execute `ai/skills/aidd-parallel/SKILL.md`
- Given the command file, should respect constraints from `/aidd-please`

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
