# Changelog Guidelines

## What to Write

Each entry answers: **what does this mean for someone using the tool?**

Write the benefit or impact, not the implementation:

```
✅ `aidd-please`, `aidd-review` now use `/aidd-rtc --compact` to save thinking tokens
❌ replace inline RTC emoji pipelines with `import /aidd-rtc` and `/aidd-rtc --compact`

✅ `/aidd-upskill` skill — authoring and upskilling AIDD skills
❌ `/aidd-upskill` — restore `/aidd-rtc --compact` in both pipelines; add `import /aidd-rtc`

✅ Stale `/aidd-functional-requirements` references updated to `/aidd-requirements`
❌ fix(skills): update stale aidd-functional-requirements references to aidd-requirements
```

## Scoping Rules

```
(skill is new in this release)     => ### Added only; never ### Changed or ### Fixed
(behavior changed for consumers)   => ### Changed
(bug existed in a prior release)   => ### Fixed
(consumer must update their code)  => ### Breaking Changes
(internal-only change)             => omit
```

## Consolidation

Group related changes into a single entry when the user benefit is the same:

```
✅ `aidd-please`, `aidd-task-creator`, `aidd-review`, `aidd-churn` now use `/aidd-rtc --compact`
❌ four separate bullet points describing each skill individually
```

## Section Order

```
### Breaking Changes   ← consumer action required
### Added              ← new capabilities
### Changed            ← existing behavior that works differently
### Fixed              ← bugs that were broken for consumers
### Deprecated         ← things being phased out
### Removed            ← things that are gone
```
