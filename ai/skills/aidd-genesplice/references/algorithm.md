# Genesplice Algorithm

## Pipeline

```
genesplice(artifact, n=2) {
  researchCriteria(artifact)
    |> generationLoop(n)
    |> scoreAllCandidates
    |> suggestWinner
    |> justifySelection
}
```

## Steps

### researchCriteria(artifact)
- Search for domain-specific best practices for the artifact type
- Synthesize findings into scored criteria (0–10 each)
- Source everything — no unsourced criteria
- Always include these two holistic criteria in every scoring matrix:
  1. *Information Efficiency* — does every element add NEW information?
  2. *Narrative Structure* — does the reading order tell a story?
- For UI prototypes: also include "A11y/Readability" criterion (weighted ×2)

### generationLoop(n)
Repeat until scores plateau or time-box is reached:

```
a. Build n candidates with distinct gene profiles
b. Save each candidate to the prototypes folder (see Candidate Output below)
c. Run quality gate per-candidate (see main SKILL.md)
d. Score each (post-fix) against all criteria
e. List pros and cons for each candidate
f. Identify best genes from each candidate
g. Splice best genes into next generation
h. Introduce 1 mutation (novel structural idea) per generation
```

### scoreAllCandidates
- Final scoring table across all criteria
- Stack rank all candidates from all generations

### suggestWinner + justifySelection
- Name the winner
- Show which genes it inherited and from which parent
- State the "one core idea" the output delivers

## Candidate Output

Every candidate is saved to a real file in the project's prototypes folder. Never keep candidates only in chat.

```
projects/{project}/prototypes/{artifact}/gen{N}-{short_id}/
├── index.html   # The candidate itself
├── preview.png  # Screenshot for quick comparison
└── full.png     # Full-page screenshot
```

- `{short_id}` = 8-char random alphanumeric, e.g. `gen3-a7k2m9p1`
- Generation number increments across the whole evolutionary run
- All candidates from all generations are preserved — never delete earlier gens
- `SCORES.md` at the `{artifact}/` level tracks all candidates across generations

## Scoring Template

```
Criteria               Cand X    Cand Y
───────────────────    ──────    ──────
[Criterion 1]            ?         ?
[Criterion 2]            ?         ?
Information Efficiency   ?         ?
Narrative Structure      ?         ?
TOTAL                   ??        ??
```

## Learnings (April 2026)

- 2 candidates per generation is the sweet spot — enough diversity, manageable scope
- Mutations (structurally novel ideas) often contribute the strongest genes
- The winning candidate rarely looks like any single parent — it's the splice that wins
- Always render/preview each candidate before scoring — catch layout issues early

### Emergent Redundancy Problem

Scoring individual criteria can miss problems that only emerge in the *combination*. Example: a giant stat (scored 9 on Typography) + italic punchline (scored 9 on Copy Punch) = the punchline restated the stat. Redundancy that no single criterion caught.

This is why *Information Efficiency* and *Narrative Structure* are mandatory holistic criteria in every run.
