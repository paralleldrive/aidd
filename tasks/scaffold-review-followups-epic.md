# Scaffold Review Follow-ups Epic

**Status**: 📋 PLANNED  
**Goal**: Address all actionable code-quality, test-quality, and UX findings from the review of the scaffold file-copy fix (PR branch `cursor/aidd-issue-139-5ed9`).

## Overview

The review of the scaffold copy fix (issue #139) identified several small but concrete issues: style-guide violations in the test file, weak E2E assertions that pass vacuously, a missing error-message assertion, undocumented implicit coupling in the implementation, and a missing user-facing warning when a scaffold step fails mid-run and leaves the project directory partially initialised.

---

## T1 + T2 — Test file: stray comment and missing type annotation

`lib/scaffold-create.test.js` has a `// --- new behaviour tests ---` section comment (style guide: comments must add value beyond what the code already says) and a `resolveCalls = []` declaration missing the `/** @type {any[]} */` annotation that every other tracking variable in the file uses.

**Requirements**:
- Given `lib/scaffold-create.test.js`, should not contain the `// --- new behaviour tests ---` comment
- Given `resolveCalls = []` in the folder-exists test, should have a `/** @type {any[]} */` annotation consistent with the rest of the file

---

## T3 — Missing error-message assertion in ScaffoldValidationError test

The unit test "throws ScaffoldValidationError if the destination folder already exists" only asserts `error?.cause?.code === "SCAFFOLD_VALIDATION_ERROR"`. The user-visible `message` (which includes the folder path) is not verified.

**Requirements**:
- Given a folder path of `"/abs/existing-project"`, the thrown error should have a `message` that includes that path
- Given the thrown error, should assert `error?.message` includes the folder path in addition to asserting the error code

---

## T4 — Weak exit-code assertions in E2E error-path tests

Four tests in `bin/create-e2e.test.js` use `actual: err?.code !== 0, expected: true`. When `err` is `undefined` (command did not throw), `undefined !== 0` is `true` — so the assertion passes vacuously and proves nothing.

**Requirements**:
- Given each error-path test in `describe("aidd create — error paths")`, should assert `actual: err?.code, expected: 1` instead of `actual: err?.code !== 0, expected: true`

---

## C1 + C2 — Implementation: undocumented `path.dirname` coupling and imprecise JSDoc

`lib/scaffold-create.js` line 76 uses `path.dirname(paths.manifestPath)` as the scaffold source directory without a comment explaining the assumption (manifest always lives at the scaffold root). The JSDoc for `runCreate` declares `folder?: string` (optional) but `folder` must always be provided; the `@ts-expect-error` on `path.join(folder, …)` exists only because the optional typing is wrong.

**Requirements**:
- Given `copyFn(path.dirname(paths.manifestPath), folder)`, should have a one-line comment stating that `SCAFFOLD-MANIFEST.yml` is expected at the scaffold source root (not a subdirectory)
- Given the `runCreate` JSDoc `@param`, should declare `folder: string` (non-optional) so the `@ts-expect-error` on `path.join(folder, "SCAFFOLD-MANIFEST.yml")` is no longer needed and can be removed

---

## A1 — UX: step-error message does not warn about partial initialisation

When a `runManifest` step fails (e.g. `npm install` exits non-zero), `handleScaffoldCommandError` in `lib/scaffold-commands.js` prints `❌ Step failed: …` but does not tell the user that `<folder>` was already created and may be partially initialised. The user is left guessing whether to retry or clean up first.

**Requirements**:
- Given a `ScaffoldStepError`, the CLI error output should include a note that the target directory may be partially initialised and should be removed before retrying (e.g. `💡 The project directory may be partially initialised — delete it before retrying.`)
