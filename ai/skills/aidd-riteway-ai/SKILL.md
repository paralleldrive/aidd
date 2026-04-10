---
name: aidd-riteway-ai
description: >
  Teaches agents how to write correct riteway ai prompt evals (.sudo files) for
  multi-step flows that involve tool calls.
  Use when writing prompt evals, creating .sudo test files, or testing agent
  skills that use tools such as gh, GraphQL, or external APIs.
compatibility: Requires riteway >=9 with the `riteway ai` subcommand available.
---

# 🧪 aidd-riteway-ai

Act as a top-tier AI test engineer to write correct `riteway ai` prompt evals
for multi-step agent skills that involve tool calls.

Refer to `/aidd-tdd` for assertion style (given/should/actual/expected) and
test isolation principles.

Refer to `/aidd-functional-requirements` for the **"Given X, should Y"** format
when writing assertions inside `.sudo` eval files.

---

## Process

1. Read the skill under test and its functional requirements
2. Identify the discrete steps in the skill's flow
3. Create one `.sudo` eval file per step (Rule 1), placed in `ai-evals/<skill-name>/`
4. For each file, write the `userPrompt` — include mock tool preambles for unit evals (Rule 2), assert tool calls for step 1 (Rule 3), supply previous step output for step N > 1 (Rule 4)
5. Write assertions derived strictly from functional requirements in `Given X, should Y` format (Rule 7)
6. Create small, single-condition fixture files as needed (Rule 6)
7. Verify against the Eval Authoring Checklist below

---

## Eval File Structure

A `.sudo` eval file has three sections:

```
import 'ai/skills/<skill-name>/SKILL.md'

userPrompt = """
<prompt sent to the agent under test>
"""

- Given <condition>, should <observable behavior>
- Given <condition>, should <observable behavior>
```

Assertions are bullet points written after the `userPrompt` block.
Each assertion tests one distinct observable behavior derived from the
functional requirements of the skill under test.

---

## Rule 1 — One eval file per step

Given a multi-step flow under test, write **one `.sudo` eval file per step**
rather than combining all steps into a single overloaded `userPrompt`.

Naming convention:

```
ai-evals/<skill-name>/step-1-<description>-test.sudo
ai-evals/<skill-name>/step-2-<description>-test.sudo
```

Do not collapse multiple steps into one file. Each file tests exactly one
discrete agent action.

---

## Rule 2 — Unit evals: tell the agent it is in a test environment

Given a unit eval for a step that involves tool calls (gh, GraphQL, REST API),
include a preamble in the `userPrompt` that:

1. Tells the prompted agent it is operating in a test environment.
2. Provides mock tools with stub return values.
3. Instructs the agent to use the mock tools instead of calling real APIs.

Example preamble:

```
You have the following mock tools available. Use them instead of real gh or GraphQL calls:

mock gh pr view => returns:
  title: My PR
  branch: feature/foo
  base: main

mock gh api (list review threads) => returns:
  [{ id: "T_01", resolved: false, body: "..." }]
```

---

## Rule 3 — Step 1: assert tool calls, do not pre-supply answers

Given a unit eval for **step 1** of a tool-calling flow, assert that the agent
makes the correct tool calls. Do **not** pre-supply the answers those calls
would return — that defeats the purpose of the eval.

Correct pattern for step 1:

```
userPrompt = """
You have mock tools available. Use them instead of real API calls.
Run step 1 of your skill under test: fetch the PR details and review threads.
"""

- Given mock gh tools, should call gh pr view to retrieve the PR branch name
- Given mock gh tools, should call gh api to list the open review threads
- Given the review threads, should present them before taking any action
```

Wrong pattern (pre-supplying answers in step 1):

```
# ❌ Do not do this — it removes the assertion value
userPrompt = """
The PR branch is feature/foo.
The review threads are: [...]
Now generate delegation prompts.
"""
```

---

## Rule 4 — Step N > 1: supply previous step output as context

Given a unit eval for **step N > 1**, include the output of the previous step
as context inside the `userPrompt`. This makes each eval independently
executable without running the prior steps live.

Example for step 2:

```
userPrompt = """
You have mock tools available. Use them instead of real calls.

Triage is complete. The following issues remain unresolved:

Issue 1 (thread ID: T_01):
  File: src/utils.js, line 5
  "add() subtracts instead of adding"

Generate delegation prompts for the remaining issues.
"""
```

---

## Rule 5 — E2E evals: use real tools, follow -e2e.test.sudo naming

Given an e2e eval, use real tools (no mock preamble) and follow the
`-e2e.test.sudo` naming convention to mirror the project's existing unit/e2e
split:

```
ai-evals/<skill-name>/step-1-<description>-e2e.test.sudo
```

E2E evals run against live APIs. Only run them when the environment is
configured with the necessary credentials.

---

## Rule 6 — Fixture files: small, one condition per file

Given fixture files needed by an eval, keep them small (< 20 lines) with
**one clear bug or condition per file**. Fixtures live in:

```
ai-evals/<skill-name>/fixtures/<filename>
```

Example fixture (`add.js`):

```js
export const add = (a, b) => a - b; // bug: subtracts instead of adds
```

Do not combine multiple bugs in one fixture file. Each fixture must make the
assertion conditions unambiguous.

---

## Rule 7 — Assertions: derived from functional requirements only

Given assertions in a `.sudo` eval, derive them strictly from the functional
requirements of the skill under test using the `/aidd-functional-requirements`
format:

```
- Given <condition>, should <observable behavior>
```

Include only assertions that test **distinct observable behaviors**. Do not:

- Assert implementation details (e.g. internal variable names)
- Repeat the same observable behavior with different wording
- Assert things that are implied by another assertion already in the file

---

## Eval Authoring Checklist

Before saving a `.sudo` eval file, verify:

- [ ] One step per file (Rule 1)
- [ ] Unit evals include mock tool preamble (Rule 2)
- [ ] Step 1 asserts tool calls, not pre-supplied answers (Rule 3)
- [ ] Step N > 1 includes previous step output as context (Rule 4)
- [ ] E2E evals use `-e2e.test.sudo` suffix (Rule 5)
- [ ] Fixture files are small, one condition each (Rule 6)
- [ ] Assertions derived from functional requirements, no duplicates (Rule 7)

---

Commands {
  🧪 /aidd-riteway-ai - write correct riteway ai prompt evals for multi-step tool-calling flows
}
