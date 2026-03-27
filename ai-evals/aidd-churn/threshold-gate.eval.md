---
skill: aidd-churn
title: Threshold gate and RTC composite-score recommendations
---

# AI eval: aidd-churn threshold gate and RTC analysis

## Purpose

Evaluates whether an agent correctly applies the **“diff pushed it over”** gate (`Cx > 9` on the current diff **relative to main / merge-base**) and the **>15% composite score** (`LoC × churn × Cx`) recommendation rule from `ai/skills/aidd-churn/SKILL.md`.

## Agent instructions (read first)

You are assisting with a pull request. The `npx aidd churn` CLI has **already been run**; **do not** run it or assume you can. Use **only** the pre-run output and the pre-provided RTC notes below. Follow `ai/skills/aidd-churn/SKILL.md`: cite specific files and metrics, and when the threshold gate applies, perform **full RTC analysis** (restate → ideate → reflect critically → expand orthogonally → score/rank/evaluate → respond) before recommending merge actions.

---

## Pre-run churn output (fixtures)

The excerpt below is the relevant portion of `npx aidd churn` for this PR. **Baseline-on-main** values were captured at the merge-base for the same paths (the CLI has already been run; here is the output).

**Fixture A — file pushed over threshold by this diff (`lib/agent-cli/config.js`)**

| | Main (baseline) | After this diff |
| --- | --- | --- |
| Cx | 7 | 11 |
| LoC | 113 | 170 |
| Churn (90d) | — | 5 |
| Composite score | — | **9,350** |

**Fixture B — pre-existing hotspot (`lib/scaffold-runner.js`)**

| | Main (baseline) | After this diff |
| --- | --- | --- |
| Cx | 20 | 26 |
| LoC | — | 184 |
| Churn (90d) | — | 6 |
| Composite score | — | **28,704** |

**Tabular summary (current branch metrics after diff)**

```
   Score  LoC  Churn  Cx   Density  File
   9350   170    5    11   (n/a)    lib/agent-cli/config.js
  28704   184    6    26   (n/a)    lib/scaffold-runner.js
```

---

## Pre-provided RTC analysis (fixtures)

**Fixture C — refactor path analysis for decision tests**

Target file (hypothetical, for scoring only): composite score **8,000** today.

- **Refactor path A (file-split):** projected composite score **6,500** (**18.75%** drop vs 8,000).
- **Refactor path B (inline helpers):** projected composite score **7,200** (**10%** drop vs 8,000).

Use these numbers as given; do not recompute churn or complexity from the repo.

**Scenario for rubric item 4 (separate from Fixture C path ranking):** For **`lib/hypothetical-module.js`**, RTC analysis (pre-provided) shows the **best available** refactor lowers the composite score from **8,000** to **7,200** only (**10%** reduction — **below** the 15% gate).

**Scenario for rubric item 5:** For **`lib/legacy-utils.js`**, there are **no** pre-computed projected scores — reason qualitatively about refactoring strategies.

---

## Task for the agent

1. For **Fixture A** and **Fixture B**, explain whether the **`Cx > 9` “diff pushed it over”** merge-blocking gate applies and what that implies for this PR.
2. Using **Fixture C**, state which refactor path meets the **>15% composite score reduction** rule and what you recommend before merge.
3. For **`lib/hypothetical-module.js`**, apply the **15%** rule to the pre-provided “best available” outcome.
4. For **`lib/legacy-utils.js`**, with no supplied scores, name **file-splitting** as a concrete strategy that reduces **LoC** and therefore the **composite score** without **increasing** cyclomatic complexity.

---

## Requirements (rubric)

1. Given pre-run churn output showing a file was at **Cx=7** on main (below the **Cx > 9** threshold) and the current diff raised it to **Cx=11**, should confirm the **diff crossed the threshold** and **run the full RTC analysis** before recommending merge actions for that file.

2. Given pre-run churn output showing **`lib/scaffold-runner.js`** was already at **Cx=20** on main before this diff, should note it as a **pre-existing hotspot** and **NOT** trigger the **merge-blocking “diff pushed it over”** gate for this file.

3. Given RTC analysis results (pre-provided) showing **file-splitting** drops the composite score from **8,000** to **6,500** — an **18.75%** reduction — should **recommend** that split **before merging** (per the **>15%** rule).

4. Given RTC analysis results (pre-provided) showing the **best available** refactor drops score from **8,000** to **7,200** — a **10%** reduction, **below** the **15%** gate — should **report findings** **without** issuing a **merge-blocking** recommendation.

5. Given a refactor scenario with **no** pre-computed scores, should identify **file-splitting** as a **concrete** strategy that **reduces LoC** and therefore the **composite score** **without increasing** cyclomatic complexity.
