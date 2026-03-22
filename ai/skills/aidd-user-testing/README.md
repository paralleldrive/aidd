# aidd-user-testing

Generates dual test scripts — human (think-aloud protocol) and AI agent
(executable with screenshots) — from user journey specifications.

## Why

Human testers catch usability friction that automated tests miss. AI agent
tests provide repeatable, screenshot-documented coverage. Running both ensures
journeys are validated from both perspectives.

## Usage

Commands: `/user-test <journey>` (generate human and agent scripts),
`/run-test <script>` (execute an agent script with screenshots).

Scripts are saved to `plan/` — human scripts as `*-human-test.md`, agent
scripts as `*-agent-test.md`. Journey data comes from
`plan/story-map/<journey-name>.yaml`.

## When to use

- Creating user test scripts from journey specifications
- Running automated user tests with screenshots
- Validating user journeys from both human and AI perspectives
