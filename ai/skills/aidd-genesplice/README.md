# aidd-genesplice

Evolutionary optimization framework for creative output — copy, UI prototypes,
pitches, strategies, or any artifact where multiple viable approaches exist
and you need to find the optimal blend.

## Why

Generating a single "best attempt" leaves value on the table. Genesplice
borrows from genetic algorithms: competing candidates with distinct gene
profiles are scored against researched criteria, and the strongest traits are
spliced across generations. Mutations introduce structural novelty that no
single-pass approach would discover. The result compounds improvements across
generations — the winner rarely looks like any single parent.

## Commands

```
/genesplice [artifact]
```

Run the full evolutionary optimization pipeline: research criteria → generate
candidates → score → splice → mutate → repeat → pick winner.

```
/genesplice score [candidates]
```

Score existing candidates against the researched criteria without running a
new generation.

```
/genesplice splice [candidate-a] [candidate-b]
```

Manually splice two specific candidates, combining their best genes into a
new candidate.

## When to Use

- Optimizing creative output (pitches, copy, UI designs, strategies)
- When "good enough" isn't enough — need a provably best version
- When there are multiple viable approaches and you need the optimal blend
