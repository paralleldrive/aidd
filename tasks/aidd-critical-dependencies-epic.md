# Critical Dependencies Epic

**Status**: 📋 PLANNED
**Goal**: Land the foundational PRs that unblock `/aidd-parallel`, `/aidd-genesplice`, and downstream work — in dependency order.

## Overview

Several open PRs form a dependency chain: downstream skills like `/aidd-genesplice` cannot be completed until the `/aidd-parallel` infrastructure in PR #168 merges. Landing these in the wrong order causes merge conflicts and duplicated effort. This epic tracks the critical path so each PR lands in sequence, unblocking the next.

---

## Merge PR #168 — `/aidd-parallel` foundation

PR #168 (`cursor/aidd-config-json-support-24c1`) delivers `/aidd-parallel` (including the `/aidd-parallel delegate` subcommand), updated `/aidd-pr`, `/aidd-requirements`, and `/aidd-riteway-ai`. 37 files, +1098 lines. This is the root blocker — nothing else lands until this merges.

**Requirements**:
- Given PR #168 is open, should complete review and merge to `main` before any dependent PR
- Given PR #168 delivers `/aidd-parallel delegate`, should verify the sub-agent delegation interface is stable before merging dependents

---

## Merge PR #181 — `/aidd-genesplice` base skill

PR #181 (`cursor/new-genesplice-skill-4389`) adds the base `/aidd-genesplice` evolutionary optimization skill. Depends on PR #168 for sub-agent delegation via `/aidd-parallel`.

**Requirements**:
- Given PR #168 is merged, should rebase PR #181 onto `main` and resolve any conflicts
- Given the base genesplice skill, should verify it integrates with the `/aidd-parallel delegate` interface delivered by PR #168

---

## Merge PR #184 — `/aidd-genesplice` task epic and functional requirements

PR #184 (`cursor/genesplice-skill-epic-dc29`) adds the task epic with functional requirements for remaining genesplice work: sub-agent isolation, pipeline subcommands, `--output` flag, and deterministic CLI tests. Depends on PR #181.

**Requirements**:
- Given PR #181 is merged, should rebase PR #184 onto `main` and resolve any conflicts
- Given the genesplice epic defines pipeline subcommands and `--output` flag, should verify requirements do not conflict with the `/aidd-parallel` interface from PR #168
