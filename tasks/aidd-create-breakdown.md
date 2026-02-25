# `aidd create` — PR #97 Breakdown Epic

**Status**: 📋 PLANNED
**Source PR**: [#97 — Add manifest-driven scaffolding with `create` and `scaffold-cleanup` commands](https://github.com/paralleldrive/aidd/pull/97)
**Already merged**: [PR #103](https://github.com/paralleldrive/aidd/pull/103) extracted the `/aidd-fix` skill (`ai/skills/fix/`, `ai/commands/aidd-fix.md`, `ai/rules/please.mdc`, `AGENTS.md` partial).

## Overview

PR #97 is a 58-file, +5,363-line feature that adds manifest-driven project scaffolding to AIDD:

- `npx aidd create [type|URI] <folder>` — scaffolds new projects from named, `file://`, or `https://` sources
- `npx aidd scaffold-cleanup [folder]` — removes temporary `.aidd/` working directories
- `npx aidd verify-scaffold [type]` — validates a manifest without executing it
- `npx aidd set <key> <value>` — persists config to `~/.aidd/config.yml`
- `--claude` flag on the root command — creates a `.claude` symlink (like `--cursor`)

This epic breaks the PR into **5 self-contained chunks**, each deployable to production without breaking existing workflows. Library code ships before CLI registration; command registration in `bin/aidd.js` is the feature toggle.

---

## Dependency Graph

```
error-causes (already in deps)
js-yaml (new dep → needed in PR 2)

lib/symlinks.js ← extracted from lib/cli-core.js (PR 1)
lib/agents-md.js (ensureClaudeMd) (PR 1)
lib/cli-core.js (uses symlinks.js, ensureClaudeMd) (PR 1)

lib/scaffold-errors.js (PR 2)
lib/aidd-config.js (uses js-yaml) (PR 2)

lib/scaffold-verifier.js (uses js-yaml, scaffold-errors) (PR 3)
ai/scaffolds/ content (PR 3)
docs/scaffold-authoring.md (PR 3)

lib/scaffold-resolver.js (uses scaffold-errors, aidd-config) (PR 4)
lib/scaffold-runner.js (uses js-yaml, scaffold-errors, scaffold-verifier) (PR 4)
lib/scaffold-verify-cmd.js (hidden — not registered in CLI) (PR 4)

lib/scaffold-create.js (uses scaffold-resolver, scaffold-runner) (PR 5)
lib/scaffold-cleanup.js (PR 5)
bin/aidd.js — registers: create, scaffold-cleanup, verify-scaffold, set (PR 5) ← FEATURE TOGGLE
```

---

## PR 1: `aidd-symlinks-refactor`

**Goal**: Extract the symlink utility, add `--claude` flag, add `CLAUDE.md` auto-generation. Improves existing install workflow; no new user-facing scaffold features.

**Why self-contained**: Pure refactor + two small additive features. All existing tests continue to pass. No incomplete workflows exposed.

**Files**:

| File | Change |
|---|---|
| `lib/symlinks.js` | New: generalized `createSymlink({ name, targetBase, force })` for both `.cursor` and `.claude` |
| `lib/symlinks.test.js` | New: unit tests for symlink creation |
| `lib/cli-core.js` | Modified: remove inline `createCursorSymlink()`, import from `symlinks.js`; call `ensureClaudeMd()` on install; fix error return to pass original `Error` object |
| `lib/cli-core.test.js` | Modified: updated tests for refactored error return |
| `lib/cursor-symlink.test.js` | Modified: test cleanup for extracted symlink logic |
| `lib/agents-md.js` | Modified: add `ensureClaudeMd()`, add Skills/Testing sections to `AGENTS_MD_CONTENT`, add `"test:e2e"` to `REQUIRED_DIRECTIVES` |
| `lib/agents-md.test.js` | Modified: +149 lines for `ensureClaudeMd()` tests |
| `lib/agents-index-e2e.test.js` | Modified: +1 line |
| `bin/aidd.js` | Modified: add `--claude` flag to root command only |
| `bin/cli-help-e2e.test.js` | Modified: update expected help text for `--claude` flag |
| `CLAUDE.md` | New: AI agent guidelines for Claude Code (mirrors AGENTS.md) |
| `.husky/pre-commit` | Modified: remove E2E tests from pre-commit hook (adds comment explaining why) |

**Requirements**:

- Given `npx aidd --claude [target]`, should create a `.claude` symlink pointing to the `ai/` directory
- Given `npx aidd` install, should create `CLAUDE.md` if absent, pointing to `AGENTS.md`
- Given `CLAUDE.md` already exists with an AGENTS.md reference, should leave it unchanged
- Given `CLAUDE.md` exists without an AGENTS.md reference, should append one
- Given `--cursor` flag, should continue to work exactly as before (no regression)
- Given `npm test`, all tests should pass

**Success Criteria**:

- [ ] `lib/symlinks.js` created with `createSymlink()` supporting both `.cursor` and `.claude`
- [ ] `lib/cli-core.js` uses `symlinks.js` — no inline cursor symlink code remains
- [ ] `ensureClaudeMd()` added to `agents-md.js` and called from `cli-core.js` on install
- [ ] `--claude` flag functional in `bin/aidd.js`
- [ ] All unit tests pass
- [ ] `bin/cli-help-e2e.test.js` passes with updated help text

**Dependencies**: None (builds on existing codebase only)

---

## PR 2: `aidd-scaffold-infrastructure`

**Goal**: Add foundational scaffold error classes and user config module. Pure library additions — nothing registered in the CLI.

**Why self-contained**: Tiny, low-risk additions. `error-causes` is already a dependency. Only new dep is `js-yaml`, added here since `aidd-config.js` needs it.

**Files**:

| File | Change |
|---|---|
| `lib/scaffold-errors.js` | New: 4 typed error causes — `ScaffoldCancelledError`, `ScaffoldNetworkError`, `ScaffoldStepError`, `ScaffoldValidationError` |
| `lib/aidd-config.js` | New: `readConfig()` / `writeConfig()` for `~/.aidd/config.yml` using `js-yaml` |
| `lib/aidd-config.test.js` | New: 179-line unit test suite |
| `package.json` | Modified: add `js-yaml ^4.1.1` to dependencies |
| `package-lock.json` | Modified: lockfile update |

**Requirements**:

- Given `readConfig()` called with no config file present, should return `{}`
- Given `readConfig()` called with a malformed YAML file, should return `{}`
- Given `writeConfig({ updates })`, should merge updates into existing config at `~/.aidd/config.yml`
- Given any scaffold operation fails, should be typeable via `error.cause.code` values
- Given `npm test`, all tests should pass

**Success Criteria**:

- [ ] `lib/scaffold-errors.js` exports 4 typed error classes
- [ ] `lib/aidd-config.js` exports `readConfig` and `writeConfig`
- [ ] `lib/aidd-config.test.js` passes fully
- [ ] `js-yaml` appears in `package.json` dependencies
- [ ] No new CLI commands registered

**Dependencies**: PR 1

---

## PR 3: `aidd-scaffold-verifier-and-content`

**Goal**: Add manifest validation library, scaffold authoring documentation, and the bundled scaffold fixtures. No execution logic — purely static analysis and content.

**Why self-contained**: Verifier is pure validation (no network, no shell). Scaffold content files are YAML/Markdown. Authoring docs are pure documentation. Zero CLI surface area added.

**Files**:

| File | Change |
|---|---|
| `lib/scaffold-verifier.js` | New: 34-line manifest validator — checks YAML parse, steps array, required fields |
| `lib/scaffold-verifier.test.js` | New: 151-line test suite |
| `ai/scaffolds/index.md` | New: auto-generated index |
| `ai/scaffolds/next-shadcn/README.md` | New: stub scaffold documentation |
| `ai/scaffolds/next-shadcn/SCAFFOLD-MANIFEST.yml` | New: placeholder prompt step |
| `ai/scaffolds/next-shadcn/index.md` | New: auto-generated index |
| `ai/scaffolds/scaffold-example/README.md` | New: example scaffold documentation |
| `ai/scaffolds/scaffold-example/SCAFFOLD-MANIFEST.yml` | New: 4-step npm init + install manifest |
| `ai/scaffolds/scaffold-example/bin/index.md` | New: auto-generated index |
| `ai/scaffolds/scaffold-example/index.md` | New: auto-generated index |
| `ai/scaffolds/scaffold-example/package.json` | New: example fixture package.json |
| `ai/index.md` | Modified: updated to include scaffolds entry |
| `docs/scaffold-authoring.md` | New: 146-line developer guide for scaffold authoring |

**Requirements**:

- Given a valid `SCAFFOLD-MANIFEST.yml`, `scaffold-verifier.js` should return `{ valid: true, errors: [] }`
- Given a manifest missing the `steps` array, should return `{ valid: false, errors: [...] }`
- Given a manifest step with unknown keys, should return errors with line numbers
- Given `scaffold-example` manifest, should define 4 `run` steps initializing an npm project
- Given `next-shadcn` manifest, should define a placeholder `prompt` step
- Given `npm test`, all tests should pass

**Success Criteria**:

- [ ] `lib/scaffold-verifier.js` validates YAML structure with error line numbers
- [ ] `lib/scaffold-verifier.test.js` passes fully
- [ ] Both `ai/scaffolds/` fixtures present and valid per the verifier
- [ ] `docs/scaffold-authoring.md` documents manifest syntax, step types, and security guidance
- [ ] No new CLI commands registered

**Dependencies**: PR 2

---

## PR 4: `aidd-scaffold-resolver-and-runner`

**Goal**: Add the scaffold resolution engine, manifest execution engine, and the hidden `verify-scaffold` command handler. Full scaffold logic is present in `lib/` but no new commands are registered in the CLI.

**Why self-contained**: All logic ships in `lib/`; `bin/aidd.js` is not touched. The `verify-scaffold` command handler exists in `lib/scaffold-verify-cmd.js` but remains hidden (not imported by `bin/aidd.js`) until PR 5.

**Files**:

| File | Change |
|---|---|
| `lib/scaffold-resolver.js` | New: 293-line resolver for named / `file://` / `https://` (GitHub latest release) sources; HTTPS-only enforcement; user confirmation before remote download; README display |
| `lib/scaffold-resolver.test.js` | New: 378-line test suite |
| `lib/scaffold-runner.js` | New: 131-line manifest step executor; `run` steps via `spawn`; `prompt` steps via agent CLI array; `json_schema` YAML parsing; optional `bin/extension.js` post-hook |
| `lib/scaffold-runner.test.js` | New: 329-line test suite |
| `lib/scaffold-verify-cmd.js` | New: 52-line CLI handler for `verify-scaffold` (not yet registered) |

**Requirements**:

- Given a named scaffold type (e.g., `next-shadcn`), resolver should return the path to `ai/scaffolds/next-shadcn/`
- Given a `file://` URI, resolver should use `fileURLToPath()` to resolve the local path
- Given an `https://` GitHub repo URI, resolver should fetch the latest release tarball via GitHub API
- Given an `http://` URI, resolver should reject it (HTTPS-only)
- Given a remote URI, resolver should prompt user for confirmation before downloading
- Given `GITHUB_TOKEN` env var, resolver should forward it only to known GitHub hostnames
- Given a `run` step, runner should execute it via `spawn` with `shell: true`
- Given a `prompt` step, runner should pass it as array arguments to the agent CLI (no shell injection)
- Given any step fails, runner should halt and throw `ScaffoldStepError`
- Given `bin/extension.js` present in scaffold, runner should execute it via Node.js after all steps
- Given YAML with `!!binary` or other type tags, runner should reject them (JSON_SCHEMA only)
- Given `npm test`, all tests should pass

**Success Criteria**:

- [ ] `lib/scaffold-resolver.js` handles all three source types with security controls
- [ ] `lib/scaffold-runner.js` executes `run` and `prompt` steps safely
- [ ] `lib/scaffold-resolver.test.js` passes fully (378 lines)
- [ ] `lib/scaffold-runner.test.js` passes fully (329 lines)
- [ ] `lib/scaffold-verify-cmd.js` exists but is NOT imported or registered in `bin/aidd.js`
- [ ] No new CLI commands exposed to users

**Dependencies**: PRs 2, 3

---

## PR 5: `aidd-scaffold-create-cli-integration`

**Goal**: Wire all scaffold modules into the CLI — the "feature toggle removal". Registers `create`, `scaffold-cleanup`, `verify-scaffold`, and `set` commands. Includes all E2E tests, README documentation, and task tracking updates.

**Why self-contained**: All library dependencies (PRs 1–4) are already merged. Every scaffold workflow is complete and tested end-to-end.

**Files**:

| File | Change |
|---|---|
| `lib/scaffold-create.js` | New: 78-line orchestrator; `resolveCreateArgs()` handles ambiguous Commander two-optional-arg pattern; `runCreate()` calls resolver → runner |
| `lib/scaffold-create.test.js` | New: 290-line unit test suite |
| `lib/scaffold-cleanup.js` | New: 19-line cleanup handler — removes `<folder>/.aidd/` |
| `lib/scaffold-cleanup.test.js` | New: 70-line test suite |
| `bin/aidd.js` | Modified: register `create`, `scaffold-cleanup`, `verify-scaffold`, `set` commands; wire `scaffold-create.js`, `scaffold-cleanup.js`, `scaffold-verify-cmd.js`, `aidd-config.js` |
| `bin/create-e2e.test.js` | New: 292-line E2E suite covering full scaffold lifecycle |
| `bin/cli-help-e2e.test.js` | Modified: update expected help output for new subcommands |
| `README.md` | Modified: +75 lines — document `create`, `scaffold-cleanup`, `set`, config file (`~/.aidd/config.yml`), customization patterns |
| `AGENTS.md` | Modified: add remaining entries not included in PR #103 |
| `activity-log.md` | Modified: log new scaffold features |
| `tasks/npx-aidd-create-epic.md` | Modified: mark tasks complete |
| `tasks/archive/2026-02-19-aidd-create-remediation-epic.md` | New: archived planning doc |
| `tasks/archive/2026-02-21-aidd-create-remediation-epic-2.md` | New: archived planning doc |

**Requirements**:

- Given `npx aidd create scaffold-example test-project`, should create `test-project/` with expected npm packages installed
- Given `npx aidd create file:///path/to/scaffold test-project`, should use local scaffold files
- Given `AIDD_CUSTOM_CREATE_URI` env var set, should use it as the default scaffold source
- Given `npx aidd scaffold-cleanup test-project`, should remove `test-project/.aidd/`
- Given `npx aidd scaffold-cleanup` with no `.aidd/` present, should report "Nothing to clean up"
- Given `npx aidd verify-scaffold next-shadcn`, should validate and report manifest validity
- Given `npx aidd set create-uri https://github.com/org/scaffold`, should persist to `~/.aidd/config.yml`
- Given `--agent claude` flag, should use `claude` as the agent CLI for `prompt` steps
- Given `npx aidd --help`, should list all new subcommands
- Given `npm run test:e2e`, all E2E tests should pass
- Given `npm test`, all unit tests should pass

**Success Criteria**:

- [ ] All 4 new subcommands registered and functional in `bin/aidd.js`
- [ ] `bin/create-e2e.test.js` passes end-to-end (covers full scaffold lifecycle)
- [ ] `bin/cli-help-e2e.test.js` passes with updated help text
- [ ] `lib/scaffold-create.test.js` and `lib/scaffold-cleanup.test.js` pass fully
- [ ] `README.md` documents all new commands and config
- [ ] All existing tests still pass (no regressions)

**Dependencies**: PRs 1, 2, 3, 4

---

## Merge Order

```
PR #103 (already done: aidd-fix skill)
    ↓
PR 1: aidd-symlinks-refactor          (standalone refactor)
    ↓
PR 2: aidd-scaffold-infrastructure    (errors + config + js-yaml)
    ↓
PR 3: aidd-scaffold-verifier-content  (validation + scaffold fixtures + docs)
    ↓
PR 4: aidd-scaffold-resolver-runner   (execution engine — hidden from CLI)
    ↓
PR 5: aidd-scaffold-create-cli        (feature toggle removal — all commands live)
```

Each PR passes all tests in `main` at merge time. No incomplete CLI workflows are visible to users until PR 5 is merged.

---

## Risk Assessment

| PR | Risk | Mitigation |
|---|---|---|
| PR 1 | Low-Medium — refactors existing `cli-core.js` | Existing test coverage; behavior-preserving extraction |
| PR 2 | Low — pure additions, one new dep | `js-yaml` is a stable, well-known library |
| PR 3 | Very Low — docs + YAML content only | No code logic |
| PR 4 | Medium — network I/O, subprocess execution | Comprehensive test mocks; HTTPS-only; array spawn |
| PR 5 | Low — wiring only, all logic pre-tested | Full E2E test suite; all deps merged |

## Notes

- **Feature toggle**: The CLI registration in `bin/aidd.js` (PR 5) is the only gating mechanism needed. No feature flag system required beyond simply not registering commands until dependencies are merged.
- **E2E tests**: Excluded from pre-commit hook (PR 1 change) — they run real `npm install` and can take up to 180s. Run `npm run test:e2e` manually before merging PR 5.
- **`http://` rejection**: The resolver enforces HTTPS-only — `http://` scaffold URIs are rejected by design. The `activity-log.md` in the original PR incorrectly states `http://` is supported; this should be corrected in PR 5.
- **Already handled by PR #103**: `ai/skills/fix/SKILL.md`, `ai/skills/fix/index.md`, `ai/skills/index.md`, `ai/commands/aidd-fix.md`, `ai/commands/index.md` (partial), `ai/rules/please.mdc`, `AGENTS.md` (partial).
