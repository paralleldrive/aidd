# `npx aidd create` Remediation Epic

**Status**: 🚧 IN PROGRESS
**Goal**: Fix correctness, safety, and maintainability gaps found in the post-implementation review of the `create` subcommand.

## Overview

The initial implementation of `npx aidd create` passed all tests and covered the happy paths, but a systematic review surfaced issues ranging from silent incorrect behaviour (ambiguous manifest steps, unvalidated manifest existence) to developer experience gaps (slow pre-commit hook, relative path in cleanup tip, missing docs, CLAUDE.md not created on install). This epic remediates every open finding so the feature is production-quality.

---

## Fix pre-commit hook

The pre-commit hook runs `npm test`, which includes slow E2E tests (up to 180 s) and times out the release pipeline.

**Requirements**:
- Given a git commit, the pre-commit hook should run `npm run test:unit` (unit tests + lint + typecheck only, no E2E)
- Given a git commit is made by an AI agent, AGENTS.md should instruct the agent to run `npm run test:e2e` manually before committing

---

## Fix cleanup tip to use absolute path

The scaffold-complete message suggests `npx aidd scaffold-cleanup <relative-folder>`, which breaks if the user changes directory before running it.

**Requirements**:
- Given scaffold completes successfully, should suggest `npx aidd scaffold-cleanup` with the absolute `folderPath`, not the relative user input
- Given the tip is displayed, the suggested command should work regardless of the user's current working directory

---

## Reject ambiguous manifest step

A step with both `run` and `prompt` keys silently ignores `prompt`. Manifests that contain both keys should fail fast.

**Requirements**:
- Given a manifest step has both `run` and `prompt` keys simultaneously, `parseManifest` should throw `ScaffoldValidationError` identifying the step number and both keys found
- Given a manifest step has only `run` or only `prompt`, should parse normally without error

---

## Validate manifest exists before returning from `resolveExtension`

`resolveExtension` returns computed paths without verifying `SCAFFOLD-MANIFEST.yml` exists, producing a raw ENOENT later in `runManifest`.

**Requirements**:
- Given a named or `file://` scaffold whose `SCAFFOLD-MANIFEST.yml` does not exist, `resolveExtension` should throw `ScaffoldValidationError` with a message naming the missing file and the scaffold source
- Given an HTTP/HTTPS scaffold where the cloned repo contains no `SCAFFOLD-MANIFEST.yml`, should throw `ScaffoldValidationError` mentioning the URI and required files
- Given a valid scaffold where the manifest exists, should return paths normally

---

## Add e2e-before-commit instruction to AGENTS.md

Agents need to know to run E2E tests before committing even though the pre-commit hook no longer runs them automatically.

**Requirements**:
- Given AGENTS.md is created or appended by the installer, should include the instruction to run `npm run test:e2e` before committing
- Given an existing AGENTS.md that lacks the e2e instruction, `ensureAgentsMd` should append it along with any other missing directives

---

## Create CLAUDE.md on `npx aidd` install

Claude Code reads `CLAUDE.md` for project guidelines. The installer creates `AGENTS.md` but not `CLAUDE.md`, so Claude sessions miss the directives.

**Requirements**:
- Given `npx aidd` installs into a directory that has no `CLAUDE.md`, should create `CLAUDE.md` with the same content as `AGENTS.md`
- Given `CLAUDE.md` already exists, should leave it unchanged (graceful, no overwrite)
- Given the install completes, `ensureAgentsMd` (or a companion function) should handle both files

---

## Replace `matter.engines.yaml.parse` with `js-yaml` directly

`matter.engines.yaml.parse()` is an undocumented internal API of `gray-matter`. Parsing pure YAML should use `js-yaml` directly.

**Requirements**:
- Given a SCAFFOLD-MANIFEST.yml with or without a leading `---` document-start marker, should parse identically to the current behaviour
- Given `js-yaml` is used as the YAML parser, `gray-matter` should no longer be used in `scaffold-runner.js`
- Given `js-yaml` is listed as a direct dependency in `package.json`, the dependency is explicit

---

## Add scaffold authoring documentation

No documentation exists explaining how to author a scaffold or which files get included.

**Requirements**:
- Given a developer wants to create a custom scaffold, `ai/scaffolds/index.md` (or a dedicated `SCAFFOLD-AUTHORING.md`) should explain the scaffold directory structure (`SCAFFOLD-MANIFEST.yml`, `bin/extension.js`, `README.md`)
- Given a scaffold author wants to control which files are packaged, the docs should explain that the `files` array in the scaffold's `package.json` works like any npm package to control published contents

---

## Clarify git-clone approach in epic and code

The original epic requirement said "download the latest GitHub release tarball" but the implementation intentionally uses `git clone` (with a rationale comment) to support arbitrary repo structures. The requirement and implementation must agree.

**Requirements**:
- Given the epic requirement for HTTP/HTTPS URIs, should be updated to reflect that `git clone` is used (not tarball download) with the documented rationale (carries arbitrary files, works with any git host)
- Given the code comment in `scaffold-resolver.js`, should remain and be expanded to note that the default branch is cloned

---

## Factor `create` and `verify-scaffold` handlers out of `bin/aidd.js`

The `create` action (~82 lines) and `verify-scaffold` action (~46 lines) are inline in `bin/aidd.js`, making it harder to unit-test argument parsing and error handling independently.

**Requirements**:
- Given `bin/aidd.js` registers the `create` command, should delegate to a `runCreate({ type, folder, agent })` function exported from `lib/scaffold-create.js`
- Given `bin/aidd.js` registers the `verify-scaffold` command, should delegate to a `runVerifyScaffold({ type })` function exported from `lib/scaffold-verify-cmd.js`
- Given `runCreate` is a plain function, unit tests should cover: one-arg (folder only), two-arg (type + folder), missing folder error, absolute path in cleanup tip
- Given `runVerifyScaffold` is a plain function, unit tests should cover: valid scaffold, invalid scaffold, cancelled remote
