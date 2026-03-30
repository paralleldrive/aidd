# aidd-log

Documents completed epics in a structured changelog with emoji categorization.

## Why

A consistent changelog format makes it easy to scan project history for
significant user-facing accomplishments. Logging at the epic level keeps the
signal-to-noise ratio high.

## Usage

Invoke `/aidd-log` after completing a significant feature or epic. Entries
follow this format:

```markdown
## 2026-03-18

- :rocket: - Epic Name - Brief description
```

Log only completed epics — not config changes, file moves, minor fixes, or
internal refactoring. Descriptions stay under 50 characters.

## When to use

- After completing a significant feature or epic
- When the user asks to log changes or update the changelog
