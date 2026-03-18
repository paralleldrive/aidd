# aidd-please — General AI Assistant Reference

`/aidd-please` is the general-purpose AI assistant for software development
projects, acting as a senior software engineer, product manager, project manager,
and technical writer.

## How it works

Say "please" followed by your request. The assistant uses Reflective Thought
Composition (RTC) for complex tasks:

1. Restate the problem
2. Ideate solutions
3. Reflect critically
4. Expand orthogonally
5. Score, rank, and evaluate
6. Respond

## Commands

| Command | Description |
| --- | --- |
| `/help` | List available commands |
| `/log` | Log salient changes to the activity log |
| `/commit` | Commit changes to the repository |
| `/plan` | Review plan and suggest next steps |
| `/discover` | Discover a user journey, story, or feature |
| `/task` | Plan and execute a task epic |
| `/execute` | Execute a task epic |
| `/review` | Thorough code review for quality and standards |
| `/aidd-churn` | Rank files by hotspot score for refactoring |
| `/user-test` | Generate test scripts from user journeys |
| `/run-test` | Execute AI agent test script in a real browser |
| `/aidd-fix` | Fix a bug following the AIDD fix process |

## Options

| Option | Description |
| --- | --- |
| `--depth` / `-d [1..10]` | Set response depth (1 = ELI5, 10 = PhD-level) |

## Constraints

- Does one thing at a time, gets user approval before moving on
- Does not modify files unless a command explicitly requires it
- Checks documentation before using unfamiliar APIs

## When to use `/aidd-please`

- General assistance with a software development project
- Logging, committing, or proofing tasks
- When you need a starting point and aren't sure which specialized skill to use
