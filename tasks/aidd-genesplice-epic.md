# aidd-genesplice Epic

**Status**: 📋 PLANNED
**Goal**: Wire genesplice pipeline to `/aidd-parallel` for isolated candidate generation, expose subcommands for testable reasoning steps, and auto-generate deterministic criteria tests.

## Overview

Genesplice currently runs the entire evolutionary pipeline in a single agent context — research bleeds into scoring, candidates can cross-contaminate, and no reasoning step is independently testable. Delegating effects to `/aidd-parallel` sub-agents isolates each concern, while decomposing the pipeline into subcommands makes every thinking step eval-testable in isolation.

## Critical Dependencies

- PR #168 (`cursor/aidd-config-json-support-24c1`) — `/aidd-parallel` skill required for sub-agent delegation

---

## Sub-agent isolation via /aidd-parallel

Delegate all effect steps to isolated sub-agent contexts using `/aidd-parallel delegate`.

**Requirements**:
- Given a `build` step, should delegate each candidate to a separate sub-agent via `/aidd-parallel delegate` with the gene profile seed, scored criteria, and output path as context
- Given a `research` step, should run in its own sub-agent context so research findings cannot bleed into scoring or candidate generation
- Given 2 candidates per generation, should spawn exactly 2 sub-agent workers per `build` step
- Given a candidate sub-agent completes, should write output to the prototypes folder path supplied in its delegation prompt

---

## Pipeline subcommands

Break the monolithic pipeline into independently invocable subcommands — effects and thinking separated.

**Requirements**:
- Given `/genesplice gather [context]`, should scan workspace and extract user-supplied fitness criteria (effect)
- Given `/genesplice research [context]`, should run gather then fetch best practices in an isolated sub-agent and output raw findings (effect)
- Given `/genesplice build [seed] [criteria]`, should delegate candidate generation to `/aidd-parallel delegate` (effect)
- Given `/genesplice criteria [findings]`, should synthesize raw findings into a scored rubric without performing any I/O (thinking)
- Given `/genesplice score [candidates] [criteria]`, should evaluate candidates against criteria without performing any I/O (thinking)
- Given `/genesplice splice [scored-candidates]`, should combine best genes and introduce one mutation into the next-gen seed without I/O (thinking)
- Given `/genesplice summarize [generations]`, should produce a scoring table across all generations and suggest a winner without I/O (thinking)
- Given any thinking subcommand, should be eval-testable in isolation by passing serialized inputs and asserting on structured outputs

---

## --output flag

Allow user to specify arbitrary output format.

**Requirements**:
- Given `--output=<description>` (e.g. "landing page HTML", "SudoLang skill file"), should pass the output description to each candidate sub-agent as part of its delegation context
- Given no `--output` flag, should use the default output spec from `references/candidate-output.md`
- Given a non-UI output type, should skip the a11y quality gate and adapt validation to the artifact type

---

## Deterministic criteria auto-testing

For mechanically verifiable criteria, generate and run Bun CLI tests instead of subjective 0–10 scores.

**Requirements**:
- Given a criterion that is deterministically verifiable (e.g. "must be <100 LoC", "WCAG AA contrast"), should generate a Bun CLI test script that checks the candidate artifact
- Given a generated test passes, should score the criterion 10; given it fails, should score 0
- Given a mix of deterministic and subjective criteria, should run deterministic tests first and include their binary results in the scoring table alongside subjective 0–10 scores
- Given the criterion "A11y/Readability" on a UI candidate, should delegate to the existing `a11y-score.ts` quality gate rather than generating a new test
