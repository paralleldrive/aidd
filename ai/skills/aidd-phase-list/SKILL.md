---
name: aidd-phase-list
description: >
  Execute a folder-based phase list given an explicit directory path.
  Runs phases in lexical order, one subagent per parent-list phase; a
  single phase file may delegate an entire nested list by having that
  subagent run this same skill on the child directory. Non-negotiable:
  the parent runner never emits progress with d greater than its own
  --depth unless -debug; nested d+1 progress and child phase files belong
  to the subagent that received the delegation phase. Use for onboarding
  checklists, sequenced workflows, or delegated sub-pipelines without a
  default list.
---

options {
  -debug: do not execute each phase in a subagent; log what you would send to each subagent in the user chat instead.
  --list <dir>: required. Path to the phase-list directory (repo-relative or absolute). May also be passed as the first positional argument after options.
  --depth <n>: nesting depth for this invocation; default 0. Nested calls must pass parent depth + 1. If depth > 5, abort before running any phase.
  --ancestor-paths <paths>: optional. Colon-separated canonical (or normalized) directory paths of lists already active in the outer stack; used only to emit a preflight warning when the current `--list` path matches one of them (intentional recursion).
}

## Runner laws (non-negotiable)

These rules exist because **inlining nested work in the parent thread** breaks the delegation contract: nested slices must be owned by the **subagent** that received the **delegation** phase file. Users and logs rely on that boundary. Treat violations as **incorrect runs**, not speed optimizations.

### Identity law (progress tags)

- For this invocation, every `[phase-list d=…]` line you emit **must use `d` equal to this run's `--depth` (`D`)**. You are the runner for **`D` only** on this checklist.
- **Without `-debug`:** the depth-`D` parent **must not** emit `[phase-list d=D+1]` (or any `d > D`) while acting as the parent; deeper tags belong to the **nested** runner (typically the subagent whose sole payload is the delegation phase file).
- **With `-debug`:** the same assistant may emit successive depths as it executes nested lists in order, but each nested segment must still follow this skill (correct `--depth` on each nested `/aidd-phase-list`).

### Execution-scope law (child list directories)

- While **executing** the checklist for `--list` at depth `D`, you **must not** replace a delegation with your own lexical walk of another directory's `*.md` phases. The child list is run only via **`/aidd-phase-list --list <child> --depth D+1 …`** inside the **subagent** that received the delegation phase (unless `-debug`).
- **Harmless:** opening or searching files under nested `phase-lists/` for **authoring or review** does not violate this law; it applies to **acting as the nested runner** from the parent identity.

### Named anti-pattern

**Parent inlines the child checklist** — the depth-`D` parent walks child `*.md` in order and/or emits nested `[phase-list d>D]` lines as if it were the child runner, instead of spawning one subagent for the delegation file that reruns this skill on the child directory — is **forbidden**.

### Decision tree

1. **Depth-`D` parent (default `-debug` off):** Only orchestrate phases under **your** `--list`. Each step = one subagent + one phase file body. You emit only `[phase-list d=D] …`. You do **not** execute the child directory's phases yourself.
2. **Your payload is a delegation phase file:** Your first structural obligation is a **full** nested `/aidd-phase-list` on the child path with `--depth D+1` and extended `--ancestor-paths`. You own `[phase-list d=D+1] run started` through `[phase-list d=D+1] run finished` for that child list (including per-phase subagents inside the child list).
3. **`-debug`:** Same obligations, one assistant; still pass correct `--depth`/`--ancestor-paths` on each nested invocation.

### Canonical wording

The **authoritative** rules for delegation are **this section** plus **Delegation phases vs inline phases** below. README snippets, command stubs, and `.cursor/rules` may repeat **one sentence** and must **link here** instead of inventing parallel definitions.

### Verification

A compliant nested delegation produces a completed child run: **`[phase-list d=D+1] run started` … `run finished`** for the child `--list`. Silence on the parent is not enough if no nested runner actually finished the child checklist.

# aidd-phase-list

You execute a **sequenced checklist** from a **phase-list directory** passed by the user. There is **no default list**: if `--list` / positional directory path is missing or not a directory, **stop immediately** and send **one assistant line** (user-visible transcript), exactly:

`[phase-list] error: missing or invalid --list <phase-list-dir>`

## Storage contract

- Phase lists live as **folders of `*.md` files** (see [ai/phase-lists/README.md](../../phase-lists/README.md)).
- **Order:** sort matching basenames **lexicographically**. Ignore `pack.json` for ordering unless you later extend this skill to read a different `order` value from `pack.json` (v1: lexical only).

## Context isolation

- **Do not read ahead:** load **only** the next phase file when you are about to execute that phase (for the list whose turn it is). Do not preload bodies of later phases in the same list.
- Do **not** paste the full sorted filename list into the subagent prompt; subagents receive **this overview (short)** plus the **full contents of that single phase file**.
- **Child lists stay behind delegation:** the parent runner walks **only** the `*.md` files in its own `--list` directory. It **must not** merge or inline another directory's phases into that loop. When a phase delegates to a child list, the **subagent for that phase** runs a **nested** `/aidd-phase-list` on the child path (see **Delegation phases vs inline phases** and **Runner laws**).

## Progress (assistant transcript)

Do **not** rely on shell `printf` for runner progress: in many environments each shell invocation opens a separate terminal, which is noisy and not the same stream as the chat.

Use this **progress tag** (include depth) in **your assistant replies** so the user sees a clear timeline in the conversation (see **Runner laws** — `d` must match this invocation's `--depth` unless you are that nested run's runner or using `-debug`):

`[phase-list d=<depth>]`

After resolving the sorted list of **phase basenames** (for counting only; do not preload file bodies), emit **one line** in the assistant transcript (plain text, own line or inline block), using the real count for `<N>`, numeric `--depth` for `<depth>`, and the phase-list directory path for `<path>`:

`[phase-list d=<depth>] run started: <N> phases list=<path>`

## Delegation phases vs inline phases

A **single lexical phase** in a list can mean either:

1. **Inline phase** — The subagent does the work in that one file (author types, copy, local commands) and does **not** treat a whole directory as the unit of work.
2. **Delegation phase (nested list)** — The file's main job is to run another **phase-list directory** (a slice or sub-pipeline). The subagent **must** execute the **`aidd-phase-list` skill** on that child directory: run `/aidd-phase-list --list <child-dir> --depth <current-depth+1> --ancestor-paths …` and follow this same document for the nested run (per-phase subagents inside the child list, progress tags at **that** depth, summary append rules). **Do not** hand-run each child `*.md` outside the skill or skip depth/ancestor handling. **Runner laws** above state the same contract in "do not parent-inline" form.

This keeps **one subagent per parent-list step** while still allowing one outer "phase" (one `*.md`) to represent an **entire nested checklist**.

For each phase file in sorted order:

1. Emit one assistant line: `[phase-list d=<depth>] phase start: <basename>`
2. Spin a **subagent** (unless `-debug`) whose instructions are:
   - A short **aidd-phase-list** runner overview: **Runner laws** through **Recursion preflight**, plus **Delegation phases vs inline phases** (so nested delegation is unambiguous).
   - The **full contents** of that single phase file.
   - If the file delegates to a child list, an explicit line that the subagent **runs `/aidd-phase-list` on that directory** with the correct `--depth` and `--ancestor-paths`, then fulfills any "return a short paragraph" / summary asks in the phase body.
3. When the phase finishes, append a concise summary of outcomes to the summary file (see below).
4. Emit one assistant line: `[phase-list d=<depth>] phase complete: <basename>`

After the last phase, emit one assistant line: `[phase-list d=<depth>] run finished`

Phase **content** may still instruct shell commands (e.g. a project script); this section applies only to **runner** progress, not to individual phase bodies.

## Depth and nesting

- **`--depth`:** outermost user invocation uses `--depth 0` (or omit; treat as 0).
- **Nested invocation:** when a phase instructs running another phase-list, the **subagent handling that phase file** (or the same assistant if `-debug`) invokes **`/aidd-phase-list`** again with `--list <child-dir>` and **`--depth <current-depth+1>`** and the appropriate **`--ancestor-paths`**. The nested invocation is a **full** phase-list run (lexical child phases, their subagents, and any deeper delegation), not a one-off read of a single child file.
- **Hard cap:** if `--depth` is **greater than 5**, send one assistant line  
  `[phase-list] error: max nesting depth exceeded (depth > 5)`  
  and **do not** run any phase.

## Recursion preflight (warning, not blocking)

If `--ancestor-paths` is provided and the canonical/normalized `--list` path equals **any** segment in `--ancestor-paths`, emit **before** the `run started` line (assistant transcript):

`[phase-list d=<depth>] preflight: warning list re-enters ancestor path (intentional recursion?)`

Nested invocations **should** extend `--ancestor-paths` by appending the parent list path (colon-separated) so repeated entry can be flagged. If not provided, still enforce **depth cap** only.

## Summary file (nesting-safe)

- **Default path:** `<project-root>/phase-summary.md` unless the environment variable **`PHASE_LIST_SUMMARY`** sets another path.
- **Never delete or truncate** this file at the start of a run (nested runs must preserve outer content).
- **Append** a section per run, for example:

```markdown
## phase-list depth=<depth> list=<path> started <ISO-8601>

(concise per-phase bullets or paragraphs)
```

Nested runs append **below** the same file (deeper sections or continuation), never clearing prior sections.

## Pseudocode

```sudo
fn executePhase(phaseFilePath, depth, progressTag) {
    basename = basename(phaseFilePath)
    assistantLine(progressTag + " phase start: " + basename)
    instructions = read(phaseFilePath)
    // follow() may be inline work or a nested runPhaseList(childDir, depth+1, ...) per delegation phases
    phaseSummary = follow(instructions)
    append(phaseSummary, to: summaryFile)
    assistantLine(progressTag + " phase complete: " + basename)
}

fn runPhaseList(listDir, depth, ancestorPaths) {
    progressTag = "[phase-list d=" + depth + "]"
    if depth > 5 { assistantLine("[phase-list] error: max nesting depth exceeded (depth > 5)"); return }
    if listDir missing or not directory { assistantLine("[phase-list] error: missing or invalid --list <phase-list-dir>"); return }
    if ancestorPaths contains canonical(listDir) { assistantLine(progressTag + " preflight: warning list re-enters ancestor path (intentional recursion?)") }
    phasePaths = sort(filter(listFiles(listDir), endsWith .md))
    assistantLine(progressTag + " run started: " + phasePaths.length + " phases list=" + listDir)
    for path in phasePaths {
        executePhase(join(listDir, path), depth, progressTag)
    }
    assistantLine(progressTag + " run finished")
}
```

## Delegation snippet for phase authors

To run a **child** list from a phase file, end the phase instructions with an explicit block, for example:

```markdown
## Subagent execution (required)

The agent that receives **this file** as its phase payload must run the **aidd-phase-list** skill on the child directory below (full nested run with correct `--depth` and `--ancestor-paths`), not manually iterate child `*.md` files outside `/aidd-phase-list`.

Delegate to phase list `ai/phase-lists/context` at depth **D+1**:

Run `/aidd-phase-list --list ai/phase-lists/context --depth <D+1> --ancestor-paths <parent:...>`.

Then summarize what the nested run produced in one short paragraph for this phase.
```

Replace `<D+1>` with the numeric depth and `<parent:...>` with the accumulated ancestor paths as colon-separated normalized paths.

**Reference:** see [`onboarding/20-run-context-sublist.md`](../../phase-lists/onboarding/20-run-context-sublist.md) for a delegation phase that runs a nested list under `ai/phase-lists/context/`.
