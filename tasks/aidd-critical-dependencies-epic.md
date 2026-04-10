# Critical Dependencies Epic

**Status**: 📋 PLANNED
**Goal**: Land the foundational PRs that unblock `/aidd-parallel`, `/aidd-genesplice`, and downstream work — in dependency order.

## Overview

Several open PRs form a dependency chain and some bundle multiple skills that must be split before merging. PR #94 contains 27 files spanning `/aidd-rtc`, `/aidd-upskill`, modified existing skills, and infrastructure — all need separate PRs. PR #168 bundles `/aidd-parallel`, `/aidd-pr`, and eval infrastructure. Landing these in the wrong order causes merge conflicts and duplicated effort. This epic tracks the critical path so each skill lands as its own PR, in sequence.

## Design Decisions

- `/aidd-parallel delegate` (from PR #168) is the canonical delegate design
- PR #179's standalone `/aidd-delegate` is superseded — only `/aidd-pipeline` from that PR is needed
- One skill per PR rule — multi-skill PRs must be split before merge

---

## Split and merge `/aidd-rtc` from PR #94

Split the 3 `/aidd-rtc` files out of PR #94 into a standalone PR. Zero dependencies — merge first.

**Files**: `ai/commands/aidd-rtc.md`, `ai/skills/aidd-rtc/SKILL.md`, `ai/skills/aidd-rtc/README.md`

**Requirements**:
- Given `/aidd-rtc` has zero dependencies on other unmerged PRs, should land first in the sequence
- Given PR #94 bundles 27 files across multiple skills, should split `/aidd-rtc` into its own PR before merging

---

## Split and merge `/aidd-pipeline` from PR #179

Split `/aidd-pipeline` out of PR #179 into a standalone PR. PR #179's standalone `/aidd-delegate` is superseded by `/aidd-parallel delegate`.

**Requirements**:
- Given `/aidd-rtc` is merged, should split and land `/aidd-pipeline` next
- Given PR #179 also contains a standalone `/aidd-delegate`, should exclude `/aidd-delegate` — it is superseded by `/aidd-parallel delegate` from PR #168

---

## Split and merge `/aidd-parallel` (with `delegate` subcommand) from PR #168

Split `/aidd-parallel` (including `/aidd-parallel delegate`) out of PR #168 into its own PR. This is the canonical sub-agent delegation interface.

**Requirements**:
- Given `/aidd-pipeline` is merged, should split and land `/aidd-parallel` next
- Given `/aidd-parallel delegate` is the canonical delegate design, should verify the delegation interface is stable before merging dependents

---

## Split and merge `/aidd-pr` from PR #168

Split `/aidd-pr` out of PR #168 into its own PR.

**Requirements**:
- Given `/aidd-parallel` is merged, should split and land `/aidd-pr` next

---

## Split and merge eval infrastructure from PR #168

Split the eval infrastructure files out of PR #168 into their own PR.

**Requirements**:
- Given `/aidd-pr` is merged, should split and land eval infrastructure next
- Given eval infrastructure supports downstream skills, should verify eval harness works before merging `/aidd-upskill`

---

## Split and merge `/aidd-upskill` from PR #94

Split the remaining `/aidd-upskill` files (11 files) out of PR #94. Depends on `/aidd-rtc`.

**Files**: `ai/commands/aidd-upskill.md`, `ai/skills/aidd-upskill/` (SKILL.md, README.md, index.md, references/\*, scripts/\*), `ai-evals/aidd-upskill/` (4 eval files + 3 fixtures)

**Requirements**:
- Given `/aidd-rtc` and eval infrastructure are merged, should split and land `/aidd-upskill` next
- Given PR #94 modifies 3 existing skills (`aidd-agent-orchestrator`, `aidd-please`, `aidd-review`), should triage each modification to determine if it belongs with `/aidd-rtc` or `/aidd-upskill` and include accordingly

---

## Triage modified existing skills from PR #94

PR #94 modifies `ai/skills/aidd-agent-orchestrator/SKILL.md`, `ai/skills/aidd-please/SKILL.md`, and `ai/skills/aidd-review/SKILL.md`. These changes must be assigned to the correct split PR.

**Requirements**:
- Given 3 existing skills are modified in PR #94, should review each diff to determine whether the change is rtc-related or upskill-related
- Given the one-skill-per-PR rule, should include each modified skill in the PR whose feature it supports

---

## Triage infrastructure files from PR #94

PR #94 modifies `ai/commands/index.md`, `ai/skills/index.md`, `package.json`, and `.gitignore`. These go with whichever split PR they support.

**Requirements**:
- Given infrastructure files are shared across skills, should include each file in the earliest PR that requires the change

---

## Merge PR #181 — `/aidd-genesplice` base skill

PR #181 adds the base `/aidd-genesplice` evolutionary optimization skill. Depends on `/aidd-parallel` for sub-agent delegation.

**Requirements**:
- Given `/aidd-upskill` is merged, should rebase PR #181 onto `main` and resolve any conflicts
- Given the base genesplice skill, should verify it integrates with the `/aidd-parallel delegate` interface

---

## Merge PR #184 — `/aidd-genesplice` task epic and functional requirements

PR #184 adds the task epic with functional requirements for remaining genesplice work. Depends on PR #181.

**Requirements**:
- Given PR #181 is merged, should rebase PR #184 onto `main` and resolve any conflicts
- Given the genesplice epic defines pipeline subcommands and `--output` flag, should verify requirements do not conflict with the `/aidd-parallel` interface

---

## Full Landing Order

1. `/aidd-rtc` — split from PR #94
2. `/aidd-pipeline` — split from PR #179
3. `/aidd-parallel` (includes `delegate` subcommand) — split from PR #168
4. `/aidd-pr` — split from PR #168
5. Eval infrastructure — split from PR #168
6. `/aidd-upskill` — split from PR #94
7. `/aidd-genesplice` — PR #181 + PR #184
