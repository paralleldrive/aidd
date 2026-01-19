# AI Agent Guidelines

This project uses AI-assisted development with the AIDD Skills Protocol.

## Skills Location

All AI guidance is located in `ai/skills/aidd/`:

- `SKILL.md` - Main skill definition with commands and orchestration
- `references/` - Domain guidance files (TDD, code review, JS best practices, etc.)

## Commands

Commands are defined as skills in `ai/skills/aidd/` and invoked via slash commands:

| Command | Description |
|---------|-------------|
| `/help` | List available commands |
| `/log` | Log completed epics to activity-log.md |
| `/commit` | Commit using conventional format |
| `/plan` | Review plan.md and suggest next steps |
| `/discover` | Product discovery for user journeys |
| `/task` | Create and plan a task epic |
| `/execute` | Execute a task epic |
| `/review` | Conduct code review |
| `/user-test` | Generate test scripts from user journeys |
| `/run-test` | Execute AI agent test script |

## Progressive Discovery

Agents should only consume the root index until they need subfolder contents. For example:
- If the project is Python, there is no need to read JavaScript-specific folders
- If working on backend logic, frontend UI folders can be skipped
- Only drill into subfolders when the task requires that specific domain knowledge

This approach minimizes context consumption and keeps agent responses focused.

## Vision Document Requirement

**Before creating or running any task, agents must first read the vision document (`vision.md`) in the project root.**

The vision document serves as the source of truth for:
- Project goals and objectives
- Key constraints and non-negotiables
- Architectural decisions and rationale
- User experience principles
- Success criteria

## Conflict Resolution

If any conflicts are detected between a requested task and the vision document, agents must:

1. Stop and identify the specific conflict
2. Explain how the task conflicts with the stated vision
3. Ask the user to clarify how to resolve the conflict before proceeding

Never proceed with a task that contradicts the vision without explicit user approval.
