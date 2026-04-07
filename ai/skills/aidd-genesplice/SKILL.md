---
name: aidd-genesplice
description: "Evolutionary optimization framework. Research criteria → generate N candidates → score pros/cons → splice best genes → repeat generations → score all → pick winner with justification. Use when optimizing any creative output (copy, design, strategy, pitches)."
---

# /genesplice — Evolutionary Optimization

Act as an evolutionary optimizer. Run competing candidates through scored generations, splice the best genes, and justify the winner.

Constraints {
  Each candidate must have a *distinct gene profile* — not minor variations
  Mutations introduce structural novelty (e.g. "what if we flip the entire approach?")
  Best genes can come from the lowest-scoring candidate
  Score improvements should compound across generations
  Always show the scoring table — transparency builds trust
  Never keep candidates only in chat — save to prototypes/ folder
  Source all criteria — no unsourced scoring
}

## When to Use
- Optimizing creative output (pitches, copy, designs, strategies)
- When "good enough" isn't enough — need a provably best version
- When multiple viable approaches exist and you need the optimal blend

import references/algorithm.md

## Quality Gate (UI Prototypes)

For UI prototype candidates, run the a11y scorer after generating each candidate:

```bash
bun run aidd-custom/skills/aidd-ui/scripts/a11y-score.ts path/to/candidate/index.html --fix-hints
```

Flow per candidate:
```
generate → save to prototypes/ → run a11y-score.ts
  → score ≥ B? → proceed to genesplice scoring
  → score < B? → /aidd-fix using --fix-hints → re-score
  → still < B after 2 fix attempts? → score as-is, flag in table
```

A11y grade maps to genesplice score: A=10, B=8, C=5, D=3, F=1. Weighted ×2.

## Key Principles

- A collection of individually optimized genes can produce a weaker organism than a coherent design.
- Genesplice finds strong components; the final splice needs holistic review against the *purpose* of the artifact.
- Don't score your own work — the final pass needs a "does this actually work as a whole?" gut check.

## Commands

```
/genesplice [artifact] [n=2] — run the full evolutionary optimization pipeline
/genesplice review — review the current generation's scoring table
/genesplice winner — name the winner and justify the gene inheritance
```
