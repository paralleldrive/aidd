---
name: aidd-commit
description: Create git commits using conventional commit format. Use when committing code changes to maintain consistent, meaningful commit history.
aiddCommands: [/commit]
---

# Conventional Commits

Create git commits following the conventional commit specification.

## Format

```
type(scope): description

[optional body]

[optional footer]
```

## Types

| Type | When to Use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change, no feature/fix |
| `test` | Adding/updating tests |
| `chore` | Maintenance tasks |
| `perf` | Performance improvement |
| `build` | Build system changes |
| `ci` | CI configuration |
| `revert` | Revert previous commit |

## Rules

1. First line under 50 characters
2. Use imperative mood ("add" not "added")
3. No period at end of subject
4. Scope is optional but helpful
5. Body explains what and why (not how)

## Examples

```
feat(auth): add OAuth2 login with Google

fix(cart): resolve race condition in inventory check

docs: update API endpoint documentation

refactor(utils): extract date formatting helpers

test(user): add integration tests for signup flow
```

## Breaking Changes

Use `!` after type/scope or `BREAKING CHANGE:` in footer:

```
feat(api)!: change response format for /users endpoint

BREAKING CHANGE: Response now returns array instead of object
```

## Process

1. Review staged changes with `git diff --staged`
2. Determine appropriate type and scope
3. Write concise, descriptive message
4. Commit with proper format

## Constraints

- Never commit secrets or credentials
- Ensure tests pass before committing
- One logical change per commit

Commands {
  /commit - create a conventional commit for staged changes
}
