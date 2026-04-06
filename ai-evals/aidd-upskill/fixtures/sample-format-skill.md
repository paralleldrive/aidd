---
name: aidd-format-changelog
description: Format a list of git commits into a structured markdown changelog. Use when generating release notes or changelogs from commit history.
---

# aidd-format-changelog

Given a list of raw git commit messages, produce a markdown changelog grouped
by conventional commit type (feat, fix, chore, etc.) with each entry on its
own line.

## Steps

1. Parse each commit message to extract type, scope, and description.
2. Group entries by type.
3. Render the grouped entries as a markdown changelog.

## Example

Input: `["feat(auth): add OAuth login", "fix(api): handle 429 rate limit"]`

Output:

```md
## Features
- **auth**: add OAuth login

## Bug Fixes
- **api**: handle 429 rate limit
```
