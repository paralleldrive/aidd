# AI Agent Guidelines

This project uses AI-assisted development with structured guidance in the `ai/` directory.

## Directory Structure

Agents should examine the `ai/*` directory listings to understand the available commands, rules, and workflows.

## Index Files

Each folder in the `ai/` directory contains an `index.md` file that describes the purpose and contents of that folder. Agents can read these index files to learn the function of files in each folder without needing to read every file.

**Important:** The `ai/**/index.md` files are auto-generated from frontmatter. Do not create or edit these files manually—they will be overwritten by the pre-commit hook.

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

## Agent Skills

AIDD includes reusable skills in the `skills/` directory following the [agentskills.io](https://agentskills.io) specification. These skills work with any compatible agent (Claude Code, Cursor, etc.).

### Available Skills

| Skill | Purpose |
|-------|---------|
| `aidd-discover` | Product discovery, user journeys, personas |
| `aidd-task` | Plan and break down epics into tasks |
| `aidd-execute` | Implement using TDD |
| `aidd-review` | Code review with security focus |
| `aidd-log` | Document changes to activity-log.md |
| `aidd-commit` | Conventional commit formatting |
| `aidd-user-test` | Generate human and AI test scripts |

### Setup for Claude Code

Claude Code doesn't natively support `AGENTS.md`. To enable AIDD:

```bash
# Copy or symlink AGENTS.md to CLAUDE.md
cp AGENTS.md CLAUDE.md
# or: ln -s AGENTS.md CLAUDE.md

# Symlink skills directory
mkdir -p .claude
ln -s ../skills .claude/skills
```

### Setup for Cursor

```bash
# Symlink skills directory (Cursor also discovers .claude/skills)
mkdir -p .cursor
ln -s ../skills .cursor/skills
```

### Manual Invocation

Primary commands invoke their corresponding skill:
- `/task` - Plan a new epic
- `/execute` - Implement with TDD
- `/review` - Code review
- `/discover` - Product discovery
- `/commit` - Conventional commits
- `/log` - Activity logging
- `/user-test` - Generate test scripts

For the complete command reference including sub-commands, see `skills/index.md`.
