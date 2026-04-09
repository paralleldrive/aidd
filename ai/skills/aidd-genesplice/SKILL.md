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
genesplice(context, n=2) {
  gatherContext(context)     // effect
    |> research              // effect → thinking
    |> runGenerations(n)     // effect → thinking, ×n
    |> summarize             // thinking
}
```

## Step 1 — Gather Context

gatherContext(userPrompt) => enrichedContext {  // effect
  1. Scan workspace for existing artifacts relevant to the prompt
     (prior candidates, specs, related files) — pull them into context
  2. Extract any fitness criteria the user included in their prompt
}

## Step 2 — Research

Isolated sub-stages so reasoning and I/O effects can be tested independently.

fetchBestPractices(enrichedContext) => rawFindings {  // effect
  (enrichedContext has sufficient criteria) => skip; pass existing criteria as rawFindings
  (no criteria) =>
    Use web search to find best practices for this class of artifact.
    Favor research papers, peer-reviewed studies, and authoritative industry
    findings over opinion pieces or blog posts.
}

synthesizeCriteria(rawFindings, enrichedContext) => criteria {  // thinking
  1. Lock in any user-supplied criteria from enrichedContext first — not overridable
  2. Synthesize researched findings into additional scored criteria (0–10 each)
     that fill gaps — one criterion per finding, no bundling
  3. Cite every researched criterion (author, title, URL or DOI) — reject uncitable criteria
  4. Always include (no citation needed):
     - *Information Efficiency* — does every element add NEW information?
     - *Narrative Structure* — does the reading order tell a story?
  5. For UI prototypes: add "A11y/Readability" (weighted ×2)

  output format:
    ## [Criterion Name] (weight: N)
    [One paragraph grounded in the research.]
    *Sources:* [Author, "Title", URL or DOI]
}

## Step 3 — Run Generations

Repeat n times. Each round produces 2 candidates and a splice seed for the next round.

buildCandidates(seed, context) => candidates {  // effect
  1. Generate 2 candidates with *distinct gene profiles* from the seed — not minor variations
  2. Save each to the prototypes folder (see references/candidate-output.md)
  3. For UI candidates: run quality gate (see references/quality-gate.md)
}

scoreAndSplice(candidates, criteria) => nextSeed {  // thinking
  1. Score each candidate against all criteria
  2. List pros and cons for each
  3. Identify best genes from each candidate
  4. Splice best genes into next generation seed
  5. Introduce 1 mutation (structurally novel idea) into the seed
}

## Step 4 — Summarize

scoreAllCandidates(generations[]) => scoringTable {  // thinking
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

suggestWinner(scoringTable) => winner {  // thinking
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
  Run autonomously by default — no mandatory user review steps.
}

Commands {
  🧬 /genesplice [-n=2] [context] — run full evolutionary optimization; n = number of generations
  /genesplice research [context] — gatherContext + research only; output criteria
  /genesplice score [candidates] — score existing candidates against criteria
  /genesplice splice [candidate-a] [candidate-b] — manually splice two candidates
}
