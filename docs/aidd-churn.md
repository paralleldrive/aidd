# Hotspot Analysis with `aidd churn`

A guide to identifying and prioritizing the highest-risk files in your codebase using composite hotspot scoring.

## What is Hotspot Analysis?

`npx aidd churn` ranks every tracked file in a git repository by a composite score that combines three well-established defect predictors: **size**, **churn**, and **cyclomatic complexity**. The result is a ranked list of the files most likely to harbour bugs, slow down reviews, and resist refactoring.

### Why it Matters

AI-assisted development generates code at unprecedented speed. Without an objective signal for where complexity actually lives, code reviews become guesswork and PRs grow until they're impossible to scope sensibly.

The three signals the command uses are well-established in empirical software engineering research:

| Signal | What it captures |
| --- | --- |
| **Size (LoC)** | More code = more surface area for bugs and higher cognitive load |
| **Churn** | Frequently changed files attract bugs; instability is a reliable defect predictor |
| **Cyclomatic complexity** | High branch count means harder to test, reason about, and review |

Multiplying them together produces a single score that surfaces the files where **all three risks overlap** — the true hotspots.

## The Score Formula

```
score = LoC × churn × complexity
```

- **LoC** — raw line count of the file
- **Churn** — number of commits that touched the file in the configured window (default: last 90 days, configurable with `--days`)
- **Complexity** — cyclomatic complexity via `tsmetrics-core` (JS/TS only; non-JS/TS files default to 1)

A file ranked #1 is large, touched constantly, and full of branches. That is where refactoring effort pays off most.

## CLI Usage

```bash
# Default: top 20 files, 90-day git window, minimum 50 LoC
npx aidd churn

# Adjust the time window
npx aidd churn --days 30

# Show fewer results
npx aidd churn --top 10

# Exclude small files
npx aidd churn --min-loc 100

# Machine-readable JSON output (useful for cross-referencing with a PR diff)
npx aidd churn --json

# Combine options
npx aidd churn --days 30 --top 10 --min-loc 100 --json
```

## Output Columns

| Column | Description |
| --- | --- |
| **Score** | `LoC × churn × complexity` — primary sort key |
| **LoC** | Lines of code |
| **Churn** | Commit touch count in the configured window |
| **Cx** | Cyclomatic complexity |
| **Density** | `gzip size / raw size` as a percentage — a supplemental code quality signal (see below) |
| **File** | Relative path from project root |

### Density: a Code Quality Signal

The Density column shows how well a file compresses — specifically `gzip_size / raw_size` expressed as a percentage.

Gzip (DEFLATE / LZ77) achieves compression by replacing repeated byte sequences with back-references. The more repetition a file contains, the smaller the compressed output and the lower the percentage. This makes gzip ratio a practical proxy for **information density** — the amount of unique, non-redundant content per line.

| Density % | Interpretation |
| --- | --- |
| **High (80–95%)** | File compresses poorly — content is non-repetitive. **Generally a good sign**: code is unique and not copy-pasted. |
| **Low (20–40%)** | File compresses heavily — lots of repeated patterns. A warning sign for copy-paste duplication, boilerplate, or bloated switch/if chains. |
| **Very high (95%+)** | May indicate minified, obfuscated, or auto-generated content. Worth inspecting, but not inherently a problem. |

Healthy application code typically falls in the **50–85%** range. A file with unusually low density in the hotspot list is doubly worth refactoring: it scores high on risk *and* contains structural repetition a refactor could eliminate.

**Important:** density is a supplemental display column only — it does **not** factor into the hotspot score. The score formula remains `LoC × churn × complexity`.

## Interpreting Results

### Dominant Signal Patterns

When you see a file ranked high, the columns tell you *why*:

| Pattern | Implication |
| --- | --- |
| High LoC, low churn, low Cx | Large but stable — probably fine unless LoC is extreme |
| Low LoC, high churn, low Cx | Small but constantly changing — interface instability or unclear ownership |
| Low LoC, low churn, high Cx | Dense branching logic — hard to test and reason about |
| High across all three | True hotspot — highest priority for refactoring |

Files scoring high on multiple signals simultaneously are the highest-priority targets. One high signal alone is not always a problem; the combination is what matters.

### Comparing Time Windows

Run the same command with different `--days` values to spot trends:

```bash
npx aidd churn --days 30   # Recent churn only
npx aidd churn --days 90   # Standard 90-day window
npx aidd churn --days 365  # Long-term view
```

A file that appears in the top 10 at `--days 30` but not at `--days 365` is a recently destabilised hotspot — a sign that something changed recently and deserves attention.

## Recommended Workflows

### Before Opening a PR

Run `npx aidd churn` and cross-reference the top results against the files in your diff. Any changed file that appears in the top 10 has a higher blast radius — changes there are more likely to introduce regressions.

If multiple hotspot files appear in a single PR, consider splitting the PR:
1. One PR for the stable/safe changes
2. A separate PR for the hotspot files, with extra review attention

### Before Starting a Refactor

Use the hotspot list to prioritise where to invest. Reducing complexity or size in a top-ranked file drops its score significantly and pays dividends on every future review.

### During Code Review

Run `npx aidd churn --json` and cross-reference against the PR diff programmatically. Any file appearing in both warrants:
- Extra scrutiny on the logic changes
- Discussion of whether the refactor is in scope or should be a follow-up

### As a Team Health Metric

Track whether your top-10 hotspots change over time. A shrinking top-10 score (especially the #1 entry) is a concrete signal that code quality is improving.

## How to Reduce a Hotspot Score

### Lower LoC

Extract pure utility functions or constants into separate modules. Smaller files are easier to test and reason about independently.

**Before:**
```typescript
// 500-line file mixing HTTP handling, business rules, and data transformation
export function processOrder(req, res) {
  // validation logic
  // pricing calculations
  // inventory checks
  // email notifications
  // response formatting
}
```

**After:** split into `validateOrder.ts`, `calculatePricing.ts`, `checkInventory.ts`, `notifyCustomer.ts` — each independently testable and with lower individual LoC.

### Lower Complexity

Flatten nested conditionals, extract named predicates, replace `switch` trees with lookup maps.

**Before:**
```typescript
if (user.role === 'admin') {
  if (resource.type === 'document') {
    if (resource.status === 'draft') { /* ... */ }
    else if (resource.status === 'published') { /* ... */ }
  } else if (resource.type === 'image') { /* ... */ }
} else if (user.role === 'editor') { /* ... */ }
```

**After:**
```typescript
const permissionHandlers = {
  admin: { document: handleAdminDocument, image: handleAdminImage },
  editor: { document: handleEditorDocument, image: handleEditorImage },
};
permissionHandlers[user.role]?.[resource.type]?.(resource);
```

### Lower Churn

If a file changes constantly because it owns too many responsibilities, split it. Stable interfaces churn less because changes can be contained to the implementation module rather than the shared surface area.

## Agent Integration

The `/aidd-churn` agent command runs the full hotspot analysis workflow automatically:

```
/aidd-churn
```

This collects hotspot data, interprets the dominant signals for each file, and proposes concrete refactoring strategies for the highest-risk files. See the [skill documentation](../ai/skills/aidd-churn/README.md) for details on how the agent interprets and recommends actions.
