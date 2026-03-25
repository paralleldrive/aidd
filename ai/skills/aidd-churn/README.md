# aidd-churn

Hotspot analysis: ranks files by `LoC × churn × complexity` so you can find the
highest-risk code before opening a PR or starting a refactor.

## Why

The three signals that predict future defects are size, change frequency, and
cyclomatic complexity. Multiplying them surfaces files where all three risks
overlap — the true hotspots worth refactoring or reviewing first.

## Usage

```bash
npx aidd churn                  # top 20 files, 90-day window
npx aidd churn --days 30        # tighten the window
npx aidd churn --top 10         # fewer results
npx aidd churn --min-loc 100    # exclude small files
npx aidd churn --json           # machine-readable output
```

Output columns: **Score**, **LoC**, **Churn** (commit count), **Cx**
(cyclomatic complexity), **Density** (gzip ratio — higher means less
repetition), **File**.

## When to use

- Before splitting a PR — high-scoring files in your diff are extraction candidates
- Before a refactor — highest ROI for simplification
- During code review — cross-reference hotspots against the diff
