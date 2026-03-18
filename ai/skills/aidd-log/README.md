# aidd-log — Changelog Reference

`/aidd-log` documents completed epics in a structured changelog using emoji
categorization, focusing on significant user-facing accomplishments.

## Format

```markdown
## 2026-03-18

- :rocket: - Epic Name - Brief description
```

## Emoji categories

| Emoji | Type |
| --- | --- |
| :rocket: | New feature |
| :bug: | Bug fix |
| :memo: | Documentation |
| :arrows_counterclockwise: | Refactor |
| :package: | Dependency update |
| :art: | Design |
| :iphone: | UI/UX |
| :bar_chart: | Analytics |
| :lock: | Security |

## What to log

**Log only completed epics** — major feature releases, user-impacting changes,
significant architecture decisions.

**Do not log**: config changes, file moves, minor bug fixes, documentation
updates, dependency updates, internal refactoring, test changes, or meta-work.

## Constraints

- Reverse chronological order (most recent at top)
- Descriptions under 50 characters
- Focus on epic-level accomplishments, not implementation details
- Omit the word "epic" from descriptions

## When to use `/aidd-log`

- After completing a significant feature or epic
- When the user asks to log changes or update the changelog
