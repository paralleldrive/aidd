# Review Feedback Standards

Team-encoded PR standards for the aidd-decompose skill.
Load this file during `analyzeBranch` to apply these constraints throughout the decomposition.

---

## PR Size Limits

- **Target**: 500-1000 lines per breakout PR
- **Hard max**: 2000 lines — split any group that exceeds this
- **Minimum**: no trivially small breakouts (< ~50 lines) unless they are true config-only changes

## Layer Dependency Order

Process and merge breakouts in this order — groups earlier in the list must not import from groups later:

```
config → types/utils → services → components → pages → integration → tests → docs
```

- `config`: environment, tooling, build configuration
- `types/utils`: shared types, constants, pure utility functions
- `services`: data fetching, API clients, business logic
- `components`: UI components and their colocated tests
- `pages`: page-level files and routes
- `integration`: cross-cutting wiring, middleware, auth flows
- `tests`: standalone test infrastructure, fixtures, helpers
- `docs`: documentation, README updates, markdown

## Test Colocation

- Every test file travels with its source file — in the same breakout PR
- Never create a breakout PR containing only test files
- Never create a breakout PR that leaves its source file's tests behind

## Branch Naming

- Breakout branches: `breakout/{descriptive-name}`
- Decomposition coordination branches: `decompose/{source-branch-name}`

## PR Body Requirements

- Every breakout PR body must include a link to the umbrella PR
- Every breakout PR body must include a "Review context" section (added/updated by `syncFeedback`)
  linking to the tracking epic's feedback ledger

## Breakout Grouping Rules

- No "misc", "cleanup", or "various" breakout names — every breakout must have a clear domain focus
- No "catch-all" breakouts that bundle unrelated files
- If files don't cleanly fit a layer, prefer splitting them into a smaller focused breakout
  over creating a vague grouping

## WIP Issues

- During `planDecomposition`, document any known cross-cutting concerns or unresolved questions
  in the tracking epic's WIP issues section
- WIP issues must be resolved or explicitly deferred before the umbrella PR is merged

## Merge Strategy Heuristics

**Use a consolidation branch** when:
- Breakout PRs have dependencies on each other (one imports from another)
- The target branch (`main`) is actively moving and rebase conflicts are likely
- There are 5+ breakout PRs — a consolidation branch reduces merge risk

**Merge direct to main** when:
- All breakout PRs are independent (no cross-imports)
- The PR is primarily additive (new files, new routes)
- The target branch is stable during the decomposition window

When unsure, default to a consolidation branch — it is always safer.
