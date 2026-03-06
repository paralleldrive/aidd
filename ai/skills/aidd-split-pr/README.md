# ✂️ aidd-split-pr

Decompose an oversized PR into smaller, independently-mergeable increments — without losing the work already done on the source branch.

## Why

Large PRs are hard to review, risky to merge, and slow to ship. This skill audits an existing branch against a source PR, plans a safe split sequence, and stages each increment from existing work first — writing new code only to fill confirmed gaps.

## Usage

```
/split-pr [target PR | target branch]
```

Point it at the PR or branch that needs splitting. It will merge latest main, inventory existing progress, identify modularization opportunities, propose a PR sequence for your approval, then stage each increment.

See [SKILL.md](./SKILL.md) for the full spec.
