# aidd-riteway-ai Skill Epic

**Status**: 📋 PLANNED
**Goal**: Create an `/aidd-riteway-ai` skill that teaches agents how to write correct `riteway ai` prompt evals for multi-step flows that involve tool calls.

## Overview

Without guidance, agents default to writing Vitest structural tests instead of `.sudo` prompt evals, collapse multi-step flows into a single overloaded `userPrompt`, pre-supply tool return values instead of testing that the agent makes the right calls, and assert implementation details rather than functional requirements. This skill codifies the lessons learned and references `/aidd-tdd` and `/aidd-functional-requirements` for assertion style and requirement format.

---

## Create the aidd-riteway-ai skill

Add `ai/skills/aidd-riteway-ai/SKILL.md` following the AgentSkills specification.

**Requirements**:
- Given the agent needs to discover the skill, its name and description should be in the frontmatter
- Given the agent needs to discover what a skill does, the description should include a very brief description of functionality without delving into implementation details
- Given the agent needs to discover when to use a skill, the description should include a very brief "Use when..." clause
- Given the skill file, should include a role preamble and reference both `/aidd-tdd` and `/aidd-functional-requirements` for assertion style and requirement format
- Given a multi-step flow under test, should instruct the agent to write one `.sudo` eval file per step rather than combining all steps into one `userPrompt`
- Given a unit eval for a step that involves tool calls (gh, GraphQL, API), should instruct the agent to inform the prompted agent that it is operating in a test environment and should use mock tools with stub return values instead of calling real APIs
- Given a unit eval for step 1 of a tool-calling flow, should instruct the agent to assert that the correct tool calls are made — not pre-supply the answers those calls would return
- Given a unit eval for step N > 1, should instruct the agent to supply the output of the previous step as context in the `userPrompt`
- Given an e2e eval, should instruct the agent to use real tools and follow the `-e2e.test.sudo` naming convention, mirroring the project's existing unit/e2e split
- Given fixture files needed by the eval, should be small files with one clear bug or condition per file
- Given assertions, should derive them strictly from the functional requirements of the skill under test using `/aidd-functional-requirements` format, and include only assertions that test distinct observable behaviors

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
