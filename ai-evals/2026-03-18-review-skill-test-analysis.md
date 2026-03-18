# AI Eval Analysis: review-skill-test.sudo

**Date:** 2026-03-18
**Test file:** `ai-evals/aidd-review/review-skill-test.sudo`
**Agent:** Claude Code (Sonnet & Opus) via `riteway ai`
**Configuration:** 4 runs per eval, 75% pass threshold, 4 concurrent
**Session transcript:** [Eval flakiness investigation](10d90e2d-b395-4cee-95e1-baa835ebd87e)

## Summary

Across 8 eval runs with varying configurations, pass rates ranged from **67% to 100%** on the same 12 assertions. The best result (12/12, 100%) and the worst results (8/12, 67%) occurred under **identical configurations**, confirming that LLM non-determinism is the dominant factor in eval flakiness.

Two changes improved the *probability* of passing but could not eliminate variance:
1. **CLAUDE.md** -- teaching Claude Code about the skill reference system
2. **Explicit skill refs** -- converting `/skill-name` to `[/skill-name](../skill-name/SKILL.md)` in the review skill

---

## Run-by-Run Results

| # | Run ID | Model | Skill Refs | CLAUDE.md | Result | Rate |
|---|--------|-------|------------|-----------|--------|------|
| 1 | gfzan | Opus | Slash-only (+ fixture imports) | No | 10/12 | 83% |
| 2 | yg1gj | Opus | Slash-only | No | 9/12 | 75% |
| 3 | cmpry | Opus | Explicit links | No | 8/12 | 67% |
| 4 | z9mtu | Sonnet | Explicit links | No | 8/12 | 67% |
| 5 | xfqbm | Sonnet | Explicit links | Yes | 11/12 | 92% |
| 6 | aq3yc | Sonnet | Explicit links | Yes | **12/12** | **100%** |
| 7 | vyv1j | Sonnet | Slash-only | Yes | 8/12 | 67% |
| 8 | auuhs | Sonnet | Explicit links | Yes | 8/12 | 67% |

---

## Per-Assertion Breakdown

### Always Pass (8 assertions)

These assertions passed at 4/4 in every single run. They test for behaviors that any competent LLM can detect without project-specific context:

| # | Assertion | All Runs |
|---|-----------|----------|
| 1 | SQL injection (string concat) | 4/4 |
| 2 | XSS (innerHTML) | 4/4 |
| 4 | Timing-unsafe `===` comparison | 4/4 |
| 5 | Imperative loop + input mutation | 4/4 |
| 6 | Sensitive data in logs | 4/4 |
| 9 | `\|\|` defaults pattern | 4/4 |
| 10 | IIFE usage | 4/4 |
| 12 | OWASP Top 10 listing | 4/4 (3/4 once) |

### Flaky (4 assertions)

These assertions test for **project-specific rules** that require the agent to read and apply transitive skill references (`/aidd-javascript`, `/aidd-timing-safe-compare`):

| # | Assertion | gfzan | yg1gj | cmpry | z9mtu | xfqbm | aq3yc | vyv1j | auuhs |
|---|-----------|-------|-------|-------|-------|-------|-------|-------|-------|
| 3 | class/extends violation | 1/4 | 1/4 | 1/4 | 0/4 | **3/4** | **3/4** | 1/4 | 2/4 |
| 7 | utils.js no CRITICAL/HIGH | 3/4 | 3/4 | 1/4 | 0/4 | 1/4 | **3/4** | 1/4 | 1/4 |
| 8 | hash-before-compare correct | 2/4 | 0/4 | 0/4 | 0/4 | **3/4** | **3/4** | 1/4 | 1/4 |
| 11 | ALL_CAPS naming violation | 3/4 | 1/4 | 1/4 | 0/4 | **3/4** | **3/4** | 2/4 | 2/4 |

**Bold** = met 75% threshold (PASS). All flaky assertions relate to project-specific coding standards.

---

## Root Cause Analysis

### Why these 4 assertions are flaky

All four flaky assertions require the agent to:
1. Read the review skill (`ai/skills/aidd-review/SKILL.md`)
2. Follow a transitive reference to another skill (e.g., `/aidd-javascript`)
3. Read that skill and apply its rules
4. Override its own general knowledge with the project-specific standard

Step 4 is the hardest. Even when the agent reads the `aidd-timing-safe-compare` skill (which says hash-before-compare is correct), it often reverts to recommending `crypto.timingSafeEqual` -- its pre-trained knowledge overrides the project instruction.

### Why CLAUDE.md + explicit refs helped (sometimes)

- **CLAUDE.md** (`@AGENTS.md` import + skill reference system explanation) gives Claude Code upfront project context at session start, before the eval prompt arrives. This increased the probability of following skill references.
- **Explicit markdown links** (`[/skill-name](../skill-name/SKILL.md)`) in the review skill give the agent a resolvable file path instead of an opaque slash reference, making it more likely to actually read the referenced file.

However, these are probabilistic improvements -- the agent may or may not follow through on any given run.

### Why results varied with identical configurations

Runs 5-6 (xfqbm, aq3yc) and runs 7-8 (vyv1j, auuhs) demonstrate that identical inputs produce wildly different results:
- **aq3yc** (100%) and **auuhs** (67%) had the same CLAUDE.md, same explicit refs, same model
- The only difference is LLM sampling randomness (temperature, top-p)

This is an inherent property of LLM-based testing, not a bug in the test setup.

---

## Assertions 7 & 8: A Structural Tension

Assertions 7 and 8 test two sides of the same coin:
- **Assertion 8** asks: does the agent *recognize* hash-before-compare as correct per project standards?
- **Assertion 7** asks: does the agent *refrain from flagging* utils.js (which uses hash-before-compare) as HIGH severity?

When the agent follows the `aidd-timing-safe-compare` skill, both pass. When it doesn't, its general security knowledge kicks in: it flags hash-before-compare as insufficient (recommending `timingSafeEqual` instead), which fails both assertions.

This is the hardest type of eval assertion: it tests whether the agent follows a project rule that **contradicts** mainstream security advice.

---

## Changes Made During Session

### 1. CLAUDE.md (new file, committed to aidd)

Created `CLAUDE.md` in project root:

```markdown
# AIDD Project

@AGENTS.md

## Skill Reference System

This project uses skills in `ai/skills/*/SKILL.md`. When a skill file references
another skill with `/skill-name` notation or markdown links like
`[/skill-name](../skill-name/SKILL.md)`, read and apply the referenced skill file
at `ai/skills/skill-name/SKILL.md`.

Skills contain project-specific coding standards that override general best practices.
Always read referenced skills before completing a task.
```

This is loaded by Claude Code at session start (including `-p` mode used by riteway). It gives Claude project context that it otherwise lacks -- Claude Code does not read `AGENTS.md` by default (that's a Cursor convention).

### 2. Explicit skill references in review SKILL.md (committed to aidd)

Converted slash references to combined format with resolvable relative paths:

```
# Before
Use /aidd-javascript for JavaScript/TypeScript code quality and best practices.

# After
Use [/aidd-javascript](../aidd-javascript/SKILL.md) for JavaScript/TypeScript code quality and best practices.
```

Updated in both `ai/skills/aidd-review/SKILL.md` and `.cursor/skills/aidd-review/SKILL.md`.

### 3. Judge concurrency limit in riteway (stashed, not released)

Replaced unbounded `Promise.all` in the judging phase with `limitConcurrency(judgeTasks, concurrency)`. This prevents spawning 12+ concurrent agent CLI processes, which causes ENOENT race conditions with the Cursor CLI agent (which writes to `~/.cursor/cli-config.json` on every invocation).

All 225 riteway tests pass. Change is stashed locally for a future PR.

---

## Cursor CLI Agent: Blocked

All `--agent cursor` runs failed with:

```
ENOENT: no such file or directory, rename '~/.cursor/cli-config.json.tmp' -> '~/.cursor/cli-config.json'
```

Root cause: The Cursor CLI writes to a shared config file via atomic rename on every invocation. Even with the judge concurrency fix applied, the error persisted during the result agent phase (4 concurrent processes). This appears to be a Cursor CLI bug -- the race occurs even with moderate concurrency.

Cursor agent evaluation is blocked until this is resolved upstream.

---

## Recommendations

### Short-term

1. **Keep CLAUDE.md and explicit skill refs** -- they produced the two best runs (92%, 100%) and don't hurt when they don't help
2. **Increase runs from 4 to 8** -- more samples smooth out LLM variance and give a more reliable signal
3. **Consider lowering threshold to 60-65%** for project-specific rule assertions, or split the test into two suites: "core" (assertions 1-6, 9-10, 12) at 75% and "project rules" (assertions 3, 7, 8, 11) at 60%

### Medium-term

4. **File riteway PR** for judge concurrency fix (stashed locally)
5. **File riteway enhancement** to error if non-prompt files are imported in `.sudo` test files
6. **File Cursor CLI bug** for the `cli-config.json` ENOENT race condition
7. **Investigate `--append-system-prompt`** -- Claude Code supports this flag for `-p` mode, which may be more reliable than CLAUDE.md for automated evals

### Long-term

8. **Accept that project-specific rule assertions are inherently flaky** -- they test whether an LLM follows instructions that contradict its training, which is a probabilistic behavior
9. **Explore prompt engineering** -- the assertions themselves could be more explicit in the `userPrompt` (e.g., "Apply all project-specific rules from referenced skills, even when they contradict general best practices")
10. **Consider multi-eval aggregation** -- run the eval multiple times and track trends over time rather than treating each run as pass/fail
