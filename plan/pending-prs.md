# Pending PR Analysis

**Generated:** 2026-04-08  
**Open PRs:** 29  
**Objective:** Identify the most load-bearing PRs, rank them for merge priority, and surface blockers and decomposition opportunities.

---

## 🎯 Executive Summary

Three PRs form the critical load-bearing spine of the backlog:

1. **#97** — `npx aidd create` manifest-driven scaffolding (the largest, most complex PR; unblocks scaffold-related work)
2. **#168** — `/aidd-pr` skill + eval infrastructure (unblocks CI/CD review automation and eval harness)
3. **#80** — Skills Protocol migration from commands/rules (resolves naming/path inconsistencies that make many other PRs conflict)

Nine additional PRs are high-value and near-ready. The remaining PRs fall into docs-only, planning, or stale/blocked categories.

---

## 🔴 Tier 1 — Merge First (Load-Bearing)

These PRs are depended on by the most subsequent work, touch runtime code, or resolve conflicts that make other PRs harder to merge.

### #97 — `npx aidd create` + `scaffold-cleanup`
- **Branch:** `claude/execute-aidd-create-epic-orEHx`
- **Size:** +5,911 / -153 lines (largest PR in backlog)
- **State:** Open (not draft)
- **Why load-bearing:** Implements the `create` and `scaffold-cleanup` CLI commands — the primary user-facing scaffolding feature. Multiple other PRs (#71, #178) depend on or patch this surface.
- **Files touched:** `bin/aidd.js`, `lib/scaffold-resolver.js`, `lib/agents-index.js`, `ai/scaffolds/`, `AGENTS.md`, `README.md`, e2e tests
- **Risk:** Large diff; e2e tests included. Needs review of `scaffold-resolver.js` URL-handling paths and remote tarball logic.
- **Decomposition opportunity:** Could split into (a) named scaffold support only, (b) file:// URI support, (c) HTTPS/remote URI + tarball handling. Each is independently testable.
- **Blocker:** None identified. Needs review pass.

### #168 — `/aidd-pr` skill, eval infrastructure, rename `/aidd-requirements`
- **Branch:** `cursor/aidd-config-json-support-24c1`
- **Size:** +1,098 / -48 lines
- **State:** Open (not draft)
- **Why load-bearing:** Adds the `/aidd-pr` skill (used by agents to create PRs), the `aidd-parallel` skill, the riteway-ai skill, and the eval test harness (`.github/workflows/ai-eval.yml`). The eval infrastructure directly supports CI quality gates for every subsequent skill PR.
- **Files touched:** `ai/skills/aidd-pr/`, `ai/skills/aidd-parallel/`, `ai/skills/aidd-requirements/`, `ai/skills/aidd-riteway-ai/`, `ai-evals/`, `.github/workflows/ai-eval.yml`
- **Risk:** Medium. Workflow permissions and `ANTHROPIC_API_KEY` secret required.
- **Decomposition opportunity:** Could extract the eval infrastructure (`.github/` + `ai-evals/`) as its own PR for faster merge of the CI piece.

### #80 — Migrate commands/rules → Skills Protocol
- **Branch:** `2witstudios:main`
- **Size:** +718 / -652 lines
- **State:** Open (not draft), external fork
- **Why load-bearing:** Removes `ai/commands/` and `ai/rules/` directories and migrates to `ai/skills/`. Many open PRs still reference the old paths — merging this will force resolution of those conflicts and establish the canonical directory structure.
- **Risk:** High conflict surface. All PRs adding to `ai/commands/` or `ai/rules/` will need rebasing after this merges.
- **Recommendation:** Review carefully for completeness; merge before the skills-adding PRs to reduce rework.

---

## 🟠 Tier 2 — Merge Next (High Value, Lower Risk)

These are focused, well-scoped PRs that add real capability with minimal conflict risk.

### #129 — `fix(tdd)`: add cross-reference to requirements.mdc
- **Size:** +1 / -0 lines
- **State:** Open
- **Why first:** Trivially small, closes #127, zero conflict risk. Merge immediately.

### #144 — Avoid user interaction in review
- **Size:** +1 / -1 lines
- **State:** Open
- **Why next:** One-line doc fix to `review.mdc`. No conflicts. Merge immediately.

### #26 — Add debug slash command
- **Size:** +20 / -0 lines
- **State:** Open
- **Assessment:** Small, high-utility command addition. Clean.

### #27 — Add brainstorm slash command
- **Size:** +35 / -0 lines
- **State:** Open
- **Assessment:** Small, widely useful command. Clean.

### #154 — CI: automated PR review with Claude
- **Branch:** `add-aidd-review-action`
- **Size:** +114 / -0 lines
- **State:** Open
- **Assessment:** Adds `.github/workflows/aidd-review-claude.yml`. Requires `ANTHROPIC_API_KEY` secret. Low conflict risk; high leverage once merged (reviews all subsequent PRs automatically).
- **Prerequisite:** Confirm secret is configured in repo settings.

### #178 — Fix `SCAFFOLD_MANIFEST.yml` (underscore) in tarball downloads
- **Branch:** `copilot/fix-aidd-create-url-failure` (DRAFT)
- **Size:** +135 / -2 lines
- **State:** Draft
- **Assessment:** Bug fix that patches #97's scaffold-resolver. Should be merged or cherry-picked alongside or immediately after #97. Unblock by promoting from draft.

### #165 — `aidd-data` skill + expand `aidd-namespace`
- **Branch:** `krisnye/aidd-data-namespace-skills`
- **Size:** +128 / -25 lines
- **State:** Open
- **Assessment:** Additive skill with clean scope. Low conflict risk.

### #170 — `aidd-review-rust` skill
- **Branch:** `pu/review-rust`
- **Size:** +347 / -0 lines
- **State:** Open
- **Assessment:** Additive, well-scoped, wires into existing `/aidd-review`. Low conflict risk.

### #171 — `aidd-review-agents` skill (OWASP Agentic AI Top 10)
- **Branch:** `pu/review-agentflow`
- **Size:** +497 / -0 lines
- **State:** Open
- **Assessment:** Additive with a reference doc (497 lines). Valuable for agentic security reviews. Low conflict risk.

### #179 — `aidd-delegate` and `aidd-pipeline` skills
- **Branch:** `pipeline`
- **Size:** +245 / -0 lines
- **State:** Open
- **Assessment:** Additive skills. Enables agent delegation patterns. Wires into orchestrator and please. Low conflict risk.

---

## 🟡 Tier 3 — Review Required (Substantial, Needs Work)

### #94 — `create-skill` command
- **Branch:** `claude/fix-issue-93-6x2Oq`
- **Size:** +1,619 / -0 lines
- **State:** Open
- **Assessment:** Large skill definition + CLI command. Overlap concern with `SKILL.md` format established in #80. Review for consistency with Skills Protocol before merging.

### #131 — `aidd-split-pr` skill
- **Branch:** `feat/aidd-split-pr-skill`
- **Size:** +716 / -14 lines
- **State:** Open
- **Assessment:** New skill + CLI surface that shells out to `git`. Medium risk. Needs security review (git command injection surface).

### #142 — New stack skill + ECS/structure improvements
- **Branch:** `knye/stack`
- **Size:** +252 / -307 lines
- **State:** Open
- **Assessment:** Simplifies ECS skill (delegates to `node_modules/@adobe/data/AGENTS.md`), adds `aidd-stack`. Net negative line count on ECS. Review the ECS simplification carefully — removing guidance is a breaking change for agents using that skill.

### #159 — GEO interview + technical SEO audit skills
- **Branch:** `sorcerai:feat/geo-seo-skills`
- **Size:** +1,087 / -0 lines
- **State:** Open (external fork)
- **Assessment:** Large, domain-specific skills. Valuable but not load-bearing for core framework. Review quality and format compliance.

### #71 — `create-next-shadcn` command
- **Branch:** `copilot/add-npx-create-next-shadcn-command` (DRAFT)
- **Size:** +1,444 / -1,322 lines
- **State:** Draft
- **Assessment:** Large rewrite of Next.js scaffolding. Depends on #97 (`aidd create`). Promote from draft after #97 merges.

---

## 🔵 Tier 4 — Docs / Planning / Stale

These PRs are documentation-only, planning epics, or have low urgency relative to the core framework work.

| PR | Title | Assessment |
|----|-------|-----------|
| #36 | Unified logger epic | Planning doc only; no runtime code. Low urgency. |
| #57 | Jiron support | Epic/planning doc. Stale (2025-12-12). Needs triage. |
| #63 | Security review template | Additive doc. Worth merging as quick win, but not load-bearing. |
| #78 | x402 payment middleware | Task doc only; no implementation. Low urgency. |
| #150 | Issue 149 fix (0 lines changed) | Empty diff. Close or update. |
| #164 | `aidd-security-review` epic doc | Planning only. |
| #169 | Add training video entry | One-liner content addition. Merge or close quickly. |
| #162 | `aidd-landing-page` skill (DRAFT) | Additive, promote from draft when ready. |
| #181 | `aidd-genesplice` skill (DRAFT) | Additive, experimental. Promote from draft when ready. |
| #128 | Code standards compliance (DRAFT) | Rebase needed; targets old file paths. |
| #167 | Symlink skills into `.agents/skills/` (DRAFT) | Depends on Skills Protocol structure from #80. |

---

## ⚡ Recommended Merge Order

```
1.  #129  (1 line, closes #127 — trivial win)
2.  #144  (1 line doc fix — trivial win)
3.  #26   (debug command — small, clean)
4.  #27   (brainstorm command — small, clean)
5.  #80   (Skills Protocol migration — resolves path conflicts for all skills PRs)
6.  #154  (CI auto-review — enables automation for remaining reviews)
7.  #97   (aidd create — largest, most load-bearing, unblocks #178 and #71)
8.  #178  (fix scaffold tarball bug — patches #97; merge immediately after)
9.  #168  (aidd-pr + eval infrastructure — CI/eval harness)
10. #165  (aidd-data + aidd-namespace — additive skills)
11. #170  (aidd-review-rust — additive skill)
12. #171  (aidd-review-agents — additive skill)
13. #179  (aidd-delegate + aidd-pipeline — additive skills)
14. #142  (stack + ECS improvements — review ECS change carefully)
15. #94   (create-skill command — review for Skills Protocol compliance)
16. #131  (aidd-split-pr — review git command security)
17. #159  (GEO/SEO skills — external fork, review format)
18. #63   (security review template — quick win)
19. #71   (create-next-shadcn — promote from draft after #97)
20. #167  (symlink skills — promote from draft after #80)
```

**Remaining (triage/close):** #36, #57, #78, #150, #164, #169, #162, #181, #128

---

## 🚧 Conflict Hotspots

| File | Touched By PRs |
|------|---------------|
| `ai/skills/index.md` | #80, #94, #131, #142, #159, #162, #165, #168, #170, #171, #179, #181 |
| `AGENTS.md` | #80, #97, #167, #168 |
| `README.md` | #80, #97, #168 |
| `bin/aidd.js` | #97, #94, #71 |
| `ai/skills/aidd-please/SKILL.md` | #168, #179, #171 |
| `ai/skills/aidd-agent-orchestrator/SKILL.md` | #168, #179 |

**Recommendation:** Merge #80 and #97 first to stabilize `ai/skills/index.md`, `AGENTS.md`, `README.md`, and `bin/aidd.js` before the remaining PRs rebase.

---

## 📋 PR Status Table

| # | Title | +/- | State | Tier | Priority |
|---|-------|-----|-------|------|----------|
| 97 | `npx aidd create` + scaffold-cleanup | +5911/-153 | Open | 1 | 🔴 Critical |
| 168 | `/aidd-pr` + eval infrastructure | +1098/-48 | Open | 1 | 🔴 Critical |
| 80 | Skills Protocol migration | +718/-652 | Open | 1 | 🔴 Critical |
| 129 | fix(tdd): requirements cross-ref | +1/-0 | Open | 2 | 🟢 Trivial win |
| 144 | Avoid user interaction in review | +1/-1 | Open | 2 | 🟢 Trivial win |
| 26 | Debug slash command | +20/-0 | Open | 2 | 🟢 Quick win |
| 27 | Brainstorm slash command | +35/-0 | Open | 2 | 🟢 Quick win |
| 154 | CI: automated PR review | +114/-0 | Open | 2 | 🟠 High value |
| 178 | Fix scaffold tarball underscore bug | +135/-2 | Draft | 2 | 🟠 High value |
| 165 | `aidd-data` + `aidd-namespace` | +128/-25 | Open | 2 | 🟠 High value |
| 170 | `aidd-review-rust` skill | +347/-0 | Open | 2 | 🟠 High value |
| 171 | `aidd-review-agents` (OWASP) | +497/-0 | Open | 2 | 🟠 High value |
| 179 | `aidd-delegate` + `aidd-pipeline` | +245/-0 | Open | 2 | 🟠 High value |
| 94 | `create-skill` command | +1619/-0 | Open | 3 | 🟡 Review needed |
| 131 | `aidd-split-pr` skill | +716/-14 | Open | 3 | 🟡 Review needed |
| 142 | Stack skill + ECS changes | +252/-307 | Open | 3 | 🟡 Review needed |
| 159 | GEO interview + technical SEO | +1087/-0 | Open | 3 | 🟡 Review needed |
| 71 | `create-next-shadcn` command | +1444/-1322 | Draft | 3 | 🟡 Review needed |
| 169 | Add training video entry | +1/-0 | Open | 4 | 🔵 Low urgency |
| 63 | Security review template | +98/-0 | Open | 4 | 🔵 Low urgency |
| 36 | Unified logger epic (docs) | +314/-4 | Open | 4 | 🔵 Low urgency |
| 57 | Jiron support (epic doc) | +527/-3 | Open | 4 | 🔵 Stale/triage |
| 78 | x402 payment middleware (doc) | +126/-0 | Open | 4 | 🔵 Low urgency |
| 150 | Issue 149 fix (empty diff) | +0/-0 | Draft | 4 | 🔵 Close/update |
| 164 | `aidd-security-review` epic (doc) | +64/-0 | Draft | 4 | 🔵 Low urgency |
| 162 | `aidd-landing-page` skill | +234/-0 | Draft | 4 | 🔵 Promote when ready |
| 181 | `aidd-genesplice` skill | +169/-0 | Draft | 4 | 🔵 Promote when ready |
| 128 | Code standards compliance | +867/-219 | Draft | 4 | 🔵 Needs rebase |
| 167 | Symlink skills → `.agents/skills/` | +474/-0 | Draft | 4 | 🔵 After #80 |
