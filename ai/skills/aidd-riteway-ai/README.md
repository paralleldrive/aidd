# aidd-riteway-ai

`/aidd-riteway-ai` teaches agents how to write correct `riteway ai` prompt evals (`.sudo` files) for multi-step agent flows that involve tool calls.

## Usage

```
/aidd-riteway-ai   — write riteway ai prompt evals for a multi-step tool-calling skill
```

## How it works

1. Splits the eval into one `.sudo` file per step, named `step-N-<description>-test.sudo` — never collapses multiple steps into a single file
2. Adds a mock-tool preamble to unit evals so the agent uses stub return values instead of calling real APIs
3. For step 1, asserts that the agent makes the correct tool calls — never pre-supplies the answers those calls would return
4. For steps N > 1, includes the previous step's output as context so each file runs independently without replaying earlier steps live
5. Names e2e evals `-e2e.test.sudo` and omits the mock preamble so they run against live APIs with real credentials
6. Keeps fixture files under 20 lines with exactly one bug or condition per file to keep assertion outcomes unambiguous
7. Derives all assertions strictly from functional requirements using the `Given X, should Y` format, testing only distinct observable behaviors with no duplicates

See [SKILL.md](./SKILL.md) for the full rule set and the eval authoring checklist.
