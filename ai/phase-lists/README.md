# Phase lists (storage convention)

A **phase-list** is a **directory** of phase instruction files. Execution is handled by the [`aidd-phase-list`](../skills/aidd-phase-list/SKILL.md) skill, which **must** be given the list directory path (it does not pick a default list).

## Layout

- One subdirectory per list, for example `ai/phase-lists/onboarding/`, `ai/phase-lists/context/`.
- **Phases** are individual Markdown files: `*.md` in that directory.
- **Ordering:** lexicographic sort on **file basename** (e.g. `10-welcome.md` before `20-next.md`). Only `*.md` files are phases; do not rely on non-`.md` files for ordering.

## Naming

- Prefer numeric prefixes so sort order matches intent: `10-...md`, `20-...md`.
- Use descriptive slugs after the prefix.

## Optional `pack.json`

You may add a **minimal** `pack.json` in the same folder **only** for metadata that does not enumerate every phase, for example:

```json
{ "schema": 1, "order": "lexical" }
```

Future non-lexical order could be documented here. **Do not** list every phase path in one file if you want to avoid leaking the full roadmap into a single artifact; prefer discovery via sorted directory listing at run time.

## Nesting another phase-list

A phase file in list **A** may delegate by instructing the agent to run the same skill on list **B**:

1. Finish any inline work for the current phase.
2. The **subagent** for that phase file runs `/aidd-phase-list --list <path-to-B> --depth <parent-depth-plus-one> --ancestor-paths …` as a **full** nested checklist (see [Delegation phases vs inline phases](../skills/aidd-phase-list/SKILL.md#delegation-phases-vs-inline-phases) in the skill).
3. When the nested run finishes, append a short outcome for this phase to the run summary.

Nested runs **must not** delete or truncate the project summary file; they only append (see skill). The parent list **must not** splice list **B**’s files into its own lexical loop; only the nested invocation walks **B**.

**Delegation boundary (summary):** Without `-debug`, the depth-`D` runner for **A** must not emit nested progress (`d > D`) or walk **B**’s phases itself. The subagent that holds the delegation phase owns the full nested run through `[phase-list d=D+1] run finished`. Full rules: [Runner laws](../skills/aidd-phase-list/SKILL.md#runner-laws-non-negotiable) in the skill.

## Example lists

- [`onboarding/`](onboarding/) — short outer flow.
- [`context/`](context/) — inner flow invoked from onboarding for copy-paste reference.

## Invoking the runner

From the repo root (example):

```text
/aidd-phase-list --list ai/phase-lists/onboarding
```

Optional: set `PHASE_LIST_SUMMARY` to override the summary file path (default: `<project-root>/phase-summary.md`).
