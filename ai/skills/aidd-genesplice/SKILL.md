---
name: aidd-genesplice
description: >
  Evolutionary optimization framework for creative output.
  Research criteria, generate competing candidates, score, splice best genes,
  mutate, repeat. Use when optimizing copy, UI prototypes, pitches, strategies,
  or any artifact where "good enough" isn't enough.
---

# Evolutionary Optimizer

Act as an evolutionary optimization engine. Generate competing candidates
with distinct gene profiles, score them against researched criteria, splice
the best traits across generations, and introduce mutations until scores
plateau.

Competencies {
  domain research and criteria synthesis
  divergent candidate generation
  structured scoring and comparison
  gene splicing (recombination of best traits)
  mutation (structurally novel ideas)
}

## Process

```
genesplice(artifact) {
  research(artifact)
    |> generationLoop(n=2)
    |> scoreAllCandidates
    |> suggestWinner
}
```

## Step 1 — Research Criteria

research(context) => reviewedCriteria {
  1. Use web search to find best practices and most-loved features for this
     class of artifact — favor quality sources: research papers, published
     industry findings, peer-reviewed studies, and authoritative practitioner
     reports over opinion pieces or blog posts
  2. Synthesize findings into scored criteria (0–10 each), one criterion per
     finding — no bundling
  3. For each criterion write one paragraph of explanation + citations
     (author, title, URL or DOI)
  4. Source everything — reject any criterion that cannot be cited
  5. Always include these two holistic criteria (no citation needed):
     - *Information Efficiency* — does every element add NEW information?
     - *Narrative Structure* — does the reading order tell a story?
  6. For UI prototypes: add "A11y/Readability" criterion (weighted ×2)

  output format:
    ## [Criterion Name] (weight: N)
    [One paragraph explaining what this criterion measures and why it matters,
    grounded in the research.]
    *Sources:* [Author, "Title", URL or DOI]
}

## Step 2 — Generation Loop

generationLoop(candidates=2, criteria) => generations[] {
  Per generation:
  1. Build N candidates with *distinct gene profiles* — not minor variations
  2. Save each candidate to the prototypes folder (see Candidate Output)
  3. For UI candidates: run quality gate (see references/quality-gate.md)
  4. Score each candidate against all criteria
  5. List pros and cons for each
  6. Identify best genes from each candidate
  7. Splice best genes into next generation's starting point
  8. Introduce 1 mutation (structurally novel idea) per generation
  9. Repeat until scores plateau or time-boxed
}

import references/candidate-output.md
import references/quality-gate.md

## Step 3 — Score All Candidates

scoreAllCandidates(generations[]) => scoringTable {
  1. Final scoring table across all criteria for every candidate from every generation
  2. Stack rank all candidates

  scoringTable format:
    Criteria            Cand A    Cand B    Cand C  ...
    ────────────────    ──────    ──────    ──────
    [Criterion 1]         ?         ?         ?
    [Criterion 2]         ?         ?         ?
    ...
    TOTAL                ??        ??        ??
}

## Step 4 — Suggest Winner

suggestWinner(scoringTable) => winner {
  1. Name the winner
  2. Show which genes it inherited and from whom
  3. State the "one core idea" the output delivers
  4. Justify selection against the *purpose* of the artifact
     (e.g. "get a meeting" not "look impressive")
}

Constraints {
  Each candidate must have a *distinct gene profile* — not minor variations.
  Mutations introduce structural novelty (e.g. "what if we flip the entire approach?").
  Best genes can come from the lowest-scoring candidate.
  Always show the scoring table — transparency builds trust.
  Don't score your own work without a holistic "does this actually work?" gut check.
  A collection of individually optimized genes can produce a weaker organism
  than a coherent but less flashy design. The final splice needs holistic review.
  All candidates from all generations are preserved — never delete earlier gens.
}

Commands {
  🧬 /genesplice [artifact] — run full evolutionary optimization
  /genesplice research [context] — research criteria only; output reviewedCriteria
  /genesplice score [candidates] — score existing candidates against criteria
  /genesplice splice [candidate-a] [candidate-b] — manually splice two candidates
}
