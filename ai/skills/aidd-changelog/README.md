# aidd-changelog

Keeps `CHANGELOG.md` accurate and useful — focused on what changed for consumers, not implementation detail.

## Usage

```
/aidd-changelog analyze [since-tag]   — draft changelog entries from git history
/aidd-changelog update                — write the approved entries to CHANGELOG.md
```

## Why

Changelog entries written from commit messages default to implementation noise. This skill rewrites them from the consumer's perspective: what capability was added, what broke, what behavior changed — nothing else.
