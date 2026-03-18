# aidd-user-testing — User Test Script Reference

`/aidd-user-testing` generates dual test scripts — human (think-aloud protocol)
and AI agent (executable with screenshots) — from user journey specifications.

## Why dual test scripts

Human testers catch usability friction that automated tests miss. AI agent
tests provide repeatable, screenshot-documented coverage. Running both ensures
journeys are validated from both perspectives.

## Test persona

Each test persona extends the base Persona from `/aidd-product-manager` with
testing-specific traits:

| Field | Description |
| --- | --- |
| `role` | User's role |
| `techLevel` | `"novice"`, `"intermediate"`, or `"expert"` |
| `patience` | 1–10 scale |
| `goals` | What the persona is trying to accomplish |

## Human test script

Follows think-aloud protocol with video recording:

1. **Pre-test** — start recording, clear state, prepare credentials
2. **Steps** — for each step: read goal aloud, perform action, think aloud about
   friction, verify success criteria
3. **Post-test** — stop recording, debrief (what was confusing, what worked,
   would you complete this in real life?)

## AI agent test script

Drives a real browser with no source code access:

1. Interact with the real UI
2. Narrate thoughts like a human tester
3. Validate rendered results against success criteria
4. Screenshot on checkpoints and failures
5. Record difficulty, duration, and unclear elements
6. Retry with backoff based on persona patience

## Commands

| Command | Description |
| --- | --- |
| `/user-test <journey>` | Generate human and agent scripts |
| `/run-test <script>` | Execute an agent script with screenshots |

## File locations

- Human scripts: `plan/<journey-name>-human-test.md`
- Agent scripts: `plan/<journey-name>-agent-test.md`
- Journey data: `plan/story-map/<journey-name>.yaml`

## When to use `/aidd-user-testing`

- Creating user test scripts from journey specifications
- Running automated user tests with screenshots
- Validating user journeys from both human and AI perspectives
