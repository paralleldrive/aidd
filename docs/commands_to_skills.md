# Commands to Skills Parity Table

This document tracks the migration of AIDD commands to the Skills Protocol.

## Migration Status: COMPLETE

All legacy commands have been converted to skill definitions with full parity.

| Command | Skill File | Status |
|---------|------------|--------|
| `/help` | `ai/skills/aidd/help.md` | ✅ Migrated |
| `/log` | `ai/skills/aidd/log.md` | ✅ Migrated |
| `/commit` | `ai/skills/aidd/commit.md` | ✅ Migrated |
| `/plan` | `ai/skills/aidd/plan.md` | ✅ Migrated |
| `/discover` | `ai/skills/aidd/discover.md` | ✅ Migrated |
| `/task` | `ai/skills/aidd/task.md` | ✅ Migrated |
| `/execute` | `ai/skills/aidd/execute.md` | ✅ Migrated |
| `/review` | `ai/skills/aidd/review.md` | ✅ Migrated |
| `/user-test` | `ai/skills/aidd/user-test.md` | ✅ Migrated |
| `/run-test` | `ai/skills/aidd/run-test.md` | ✅ Migrated |

## Success Criteria

- [x] Every command has a corresponding skill definition with matching behavior
- [x] Runtime execution flows through skills protocol
- [x] Documentation explains skills-based invocation
- [x] All tests, linters, and build pipelines pass

## Architecture

### Skills Protocol Structure

```
ai/skills/aidd/
├── SKILL.md              # Main orchestrator skill
├── help.md               # /help command
├── log.md                # /log command
├── commit.md             # /commit command
├── plan.md               # /plan command
├── discover.md           # /discover command
├── task.md               # /task command
├── execute.md            # /execute command
├── review.md             # /review command
├── user-test.md          # /user-test command
├── run-test.md           # /run-test command
└── references/           # Reference implementation files
    ├── log.md
    ├── task-creator.md
    ├── tdd.md
    ├── product-manager.md
    ├── code-review.md
    ├── user-testing.md
    └── ... (other references)
```

### Skill Frontmatter Format

Each skill uses the Claude Code skills protocol with:

```yaml
---
name: <command>
description: <description with trigger keywords>
allowed-tools: <optional tool permissions>
---
```

### Invocation

Skills are invoked via:
- `/<command>` - Direct skill invocation (e.g., `/commit`, `/task`)
- Main AIDD skill triggers on keywords in description

## Legacy Commands Directory

The `ai/commands/` directory has been removed. All command implementations now live in `ai/skills/aidd/` with proper skill frontmatter.

## Verification

All skills have been verified to:
1. Have proper `name` field matching invocation pattern
2. Have `description` field with appropriate trigger keywords
3. Reference the correct reference files
4. Respect SKILL.md constraints
