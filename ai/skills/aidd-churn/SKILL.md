---
name: aidd-churn
description: >
  Hotspot analysis for codebases. Use when identifying high-risk files before
  splitting a PR, scoping a refactor, or preparing a code review. Explains the
  churn metrics and how to interpret the ranked output of `npx aidd churn`.
compatibility: Requires git history and Node.js. Complexity analysis covers JS/TS; other file types default to complexity 1.
---

# aidd-churn — Hotspot Analysis

`npx aidd churn` ranks every file in a git repo by a composite hotspot score so
you can find the highest-risk code before you open a PR or start a refactor.

## Why hotspot analysis matters

AI agents generate code fast. Without a signal for where complexity actually
lives, reviews miss the files most likely to harbour bugs, and PRs grow until
they're impossible to scope sensibly.

The three signals that predict future defects are well-established in empirical
software engineering research:

| Signal | What it captures |
| --- | --- |
| **Size (LoC)** | More code = more surface area for bugs and cognitive load |
| **Churn** | Frequently changed files attract bugs; instability is a defect predictor |
| **Cyclomatic complexity** | High branch count means harder to test, reason about, and review |

Multiplying them together produces a single score that surfaces the files where
all three risks overlap — the true hotspots.

## The score formula

```
score = LoC × churn × complexity
```

- **LoC** — raw line count of the file
- **Churn** — number of commits that touched the file in the configured window
  (default: last 90 days, `--days` flag)
- **Complexity** — cyclomatic complexity via `tsmetrics-core` (JS/TS only;
  non-JS/TS files default to 1)

A file ranked #1 is large, touched constantly, and full of branches. That is
where refactoring effort pays off most.

## Output columns

| Column | Description |
| --- | --- |
| **Score** | `LoC × churn × complexity` — primary sort key |
| **LoC** | Lines of code |
| **Churn** | Commit touch count in the window |
| **Cx** | Cyclomatic complexity |
| **Density** | Gzip ratio (`gzip size / raw size`) — a proxy for information density; high density = tightly packed logic |
| **File** | Relative path from project root |

**Gzip density** is a supplemental signal. A file with high density but
low complexity often contains generated or data-heavy code (e.g. fixtures,
translations) that is safe to ignore. A file with both high complexity and
high density is genuinely hard to reason about.

## Usage

```bash
npx aidd churn                  # top 20 files, 90-day window
npx aidd churn --days 30        # tighten the window
npx aidd churn --top 10         # fewer results
npx aidd churn --min-loc 100    # exclude small files
npx aidd churn --json           # machine-readable output
```

## Interpreting results

- **Before splitting a PR** — files in the top results that appear in your diff
  are the best candidates for extraction into a separate PR.
- **Before a refactor** — high-scoring files have the highest ROI for
  simplification; reducing complexity or size drops the score significantly.
- **During code review** — run `npx aidd churn` and cross-reference the output
  against the diff. Any changed file in the top 10 warrants extra scrutiny.
- **As a trend** — compare `--days 30` vs `--days 90` to see whether hotspots
  are growing or shrinking over time.

## How to reduce a hotspot score

1. **Lower LoC** — extract pure utility functions or constants into separate
   modules. Smaller files are easier to test and understand.
2. **Lower complexity** — flatten nested conditionals, extract named predicates,
   replace `switch` trees with lookup maps.
3. **Lower churn** — if a file changes constantly because it owns too many
   responsibilities, split it. Stable interfaces churn less.

## Agent usage

When running `/review`, agents should:

1. Run `npx aidd churn` at the start of the review.
2. Cross-reference the ranked list against the diff.
3. Call out any diff file that appears in the top results and explain why it
   scored high (size, churn, or complexity).
4. Suggest concrete extraction or simplification steps for high-scoring files.
