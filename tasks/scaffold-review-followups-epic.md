# Scaffold Create Review Follow-ups Epic

**Status**: 📋 PLANNED  
**Goal**: Address all five review issues found after the issue #139 fix PR on branch `cursor/aidd-fix-issue-resolution-8637`.

## Overview

The issue #139 fix introduced scaffold file copying and a folder-exists pre-flight check. A code review identified five issues: a semantic bug (manifest path still points to the original source after copy), a gap against the original issue requirements (download-destination guard), a missing e2e assertion explicitly called out in the issue, test style inconsistency, and misleading CLI error UX for the new validation path.

---

## C1 — Use copied manifest path in runManifest

After `copyFn` runs, the manifest has been copied into `<folder>`. `runManifest` should read from the local copy, not from the original scaffold source.

**Requirements**:
- Given scaffold files have been copied to `<folder>`, `runManifestFn` should be called with `manifestPath: path.join(folder, "SCAFFOLD-MANIFEST.yml")` instead of `paths.manifestPath`
- Given the unit test for `runManifest`, should assert that the `manifestPath` argument equals the folder-relative path (not the resolver-returned path)

---

## H1 — Throw when scaffold download destination already exists

`downloadExtension` in `scaffold-resolver.js` silently removes `~/.aidd/scaffold/` before downloading. Issue #139 explicitly requires a thrown error so users know to run the cleanup tool.

**Requirements**:
- Given `~/.aidd/scaffold/` already exists when `downloadExtension` is called, should throw `ScaffoldDestinationError` with a message that names the path and instructs the user to manually delete it (note: `npx aidd scaffold-cleanup` is no longer a public CLI command — auto-cleanup handles this in normal flows)
- Given `~/.aidd/scaffold/` does not exist, should proceed with the download as before
- Given the unit test suite in `scaffold-resolver.test.js`, should cover both the throw and the pass-through cases using an injectable `existsFn`
- Given the epic in `tasks/npx-aidd-create-epic.md`, should include this requirement under the issue #139 section

---

## H2 — Assert SCAFFOLD-MANIFEST.yml copied in e2e test

Issue #139 explicitly called out: *"add explicit checks for `SCAFFOLD-MANIFEST.yml` and `package.json` in the e2e tests."* `package.json` is already checked; `SCAFFOLD-MANIFEST.yml` is not.

**Requirements**:
- Given `aidd create scaffold-example test-project` completes, should assert that `SCAFFOLD-MANIFEST.yml` exists in the created project directory
- Given the assertion, should use the shared `scaffoldExampleCtx` so no extra `npm install` run is triggered

---

## M1 — Use shared noops consistently in scaffold-create.test.js

Three tests in the `runCreate` describe block use inline `async () => {}` / `async () => false` instead of the shared `noopCopy` and `noopExists` constants defined at the top of the block.

**Requirements**:
- Given the "passes agent and folder to runManifest" test, should use `noopCopy` instead of `async () => {}` and `noopExists` instead of `async () => false`
- Given the "throws ScaffoldValidationError if the destination folder already exists" test, should use `noopCopy` instead of `async () => {}`
- Given the "copies scaffold source files to the project folder" test, should use `noopExists` instead of `async () => false`

---

## M2 — Dedicated error type for destination-folder conflict

When `runCreate` throws `ScaffoldValidationError` because the destination folder already exists, the CLI handler displays `❌ Invalid scaffold:` and `💡 Run npx aidd verify-scaffold`, both of which are wrong for this error. A distinct error type removes the UX confusion.

**Requirements**:
- Given a new `ScaffoldDestinationError` added to `scaffold-errors.js` with code `SCAFFOLD_DESTINATION_ERROR`, should be exported alongside the existing error types
- Given `runCreate` detects the folder already exists, should throw `ScaffoldDestinationError` instead of `ScaffoldValidationError`
- Given `handleScaffoldCommandError` in `scaffold-commands.js`, should handle `ScaffoldDestinationError` with the message `❌ Destination conflict:` and hint `💡 Delete the folder or choose a different name before running aidd create`
- Given the unit test for `runCreate`, should assert `error?.cause?.code === "SCAFFOLD_DESTINATION_ERROR"` (update existing test)
- Given the e2e test for the folder-exists path, should remain passing with exit code 1

---

## N1 — downloadExtension should throw ScaffoldDestinationError, not ScaffoldValidationError

`downloadExtension` in `scaffold-resolver.js` was written (H1) before `ScaffoldDestinationError` existed (M2). Now that `ScaffoldDestinationError` is the canonical type for "destination already exists" errors, the download-dir conflict guard should use it.

**Requirements**:
- Given `scaffoldDownloadDir` already exists when `downloadExtension` is called, should throw `ScaffoldDestinationError` (not `ScaffoldValidationError`)
- Given the unit test for `downloadExtension`, should assert `cause.code === "SCAFFOLD_DESTINATION_ERROR"`

---

## N2 — downloadExtension is exported as a public API but is an internal helper

`downloadExtension` was exported from `lib/scaffold-resolver.js` solely to enable direct unit testing of the H1 behaviour (throwing when the download dir exists). Exporting it creates an unintended public bypass: callers can invoke it without the user-confirmation prompt, HTTPS guard, or GitHub release-resolution logic that `resolveExtension` provides.

The correct fix is to thread `existsFn` up through `resolveExtension` (the real public API) so the behaviour can be tested without exporting the internal helper.

**Requirements**:
- Given `downloadExtension` is no longer exported, no external caller can bypass the confirmation/HTTPS guard in `resolveExtension`
- Given `existsFn` is injectable via `resolveExtension`, the download-dir-exists guard is still fully testable without touching the real filesystem
- Given all existing tests, should continue to pass with no behaviour change

---
