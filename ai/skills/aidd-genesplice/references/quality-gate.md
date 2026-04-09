# Quality Gate (Per-Candidate)

For UI prototype candidates, run the automated a11y scorer after generating
each candidate:

```bash
bun run aidd-custom/skills/aidd-ui/scripts/a11y-score.ts path/to/candidate/index.html --fix-hints
```

## Flow

```
generate → save to prototypes/ → run a11y-score.ts
  → score ≥ B? → proceed to genesplice scoring
  → score < B? → /aidd-fix using --fix-hints output → re-score
  → still < B after 2 fix attempts? → score as-is but flag in scoring table
```

## A11y Score Mapping

The a11y score maps to genesplice criteria as:

| Grade | Score |
|-------|-------|
| A     | 10    |
| B     | 8     |
| C     | 5     |
| D     | 3     |
| F     | 1     |

This criterion is weighted ×2 in the scoring table.
