# aidd-riteway-ai Skill Epic

**Status**: 📋 PLANNED
**Goal**: Create an `/aidd-riteway-ai` skill that teaches agents how to write correct `riteway ai` prompt evals for multi-step flows that involve tool calls.

## Overview

Without guidance, agents default to writing Vitest structural tests instead of `.sudo` prompt evals, collapse multi-step flows into a single overloaded `userPrompt`, pre-supply tool return values instead of testing that the agent makes the right calls, and assert implementation details rather than functional requirements. This skill codifies the lessons learned and references `/aidd-tdd` and `/aidd-requirements` for assertion style and requirement format.

---

## Rename /aidd-functional-requirements to /aidd-requirements

Rename the existing skill directory, frontmatter name, command file, and all references to use the shorter name.

**Requirements**:
- Given the skill is referenced anywhere in the codebase as `aidd-functional-requirements`, should be updated to `aidd-requirements`
- Given the command file `ai/commands/aidd-functional-requirements.md`, should be renamed to `ai/commands/aidd-requirements.md`
- Given any skill or doc that references `/aidd-functional-requirements`, should reference `/aidd-requirements` instead

---

## Create the aidd-riteway-ai skill

Add `ai/skills/aidd-riteway-ai/SKILL.md` following the AgentSkills specification.

**Requirements**:
- Given the skill file, should have frontmatter with `name: aidd-riteway-ai`, a `description` following the "Use when" format, and a `compatibility` field
- Given the skill file, should include a role preamble and reference both `/aidd-tdd` and `/aidd-requirements` for assertion style and requirement format
- Given a multi-step flow under test, should instruct the agent to write one `.sudo` eval file per step rather than combining all steps into one `userPrompt`
- Given a step that involves tool calls (gh, GraphQL, API), should instruct the agent to supply mock tools with stub return values in the `userPrompt` so the agent under test can invoke them
- Given step 1 of a tool-calling flow, should instruct the agent to test that the correct tool calls are made — not pre-supply the answers those calls would return
- Given step N > 1, should instruct the agent to supply the output of the previous step as context in the `userPrompt`
- Given fixture files needed by the eval, should be small files with one clear bug or condition per file
- Given assertions, should derive them from the functional requirements of the skill under test using `/aidd-requirements` format, and include only assertions that test distinct observable behaviors
- Given the eval directory, should be colocated under `ai-evals/<skill-name>/`

---

## Add the aidd-riteway-ai command

Add `ai/commands/aidd-riteway-ai.md` so the skill is invokable and discoverable.

**Requirements**:
- Given the command file, should load and execute `ai/skills/aidd-riteway-ai/SKILL.md`
- Given the command file, should respect constraints from `/aidd-please`

---

## Update aidd-please discovery

Add `/aidd-riteway-ai` to the Commands block in `ai/skills/aidd-please/SKILL.md`.

**Requirements**:
- Given the aidd-please Commands block, should list `/aidd-riteway-ai` so agents can discover it
