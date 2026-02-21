# `npx aidd create` Remediation Epic 2

**Status**: 🚧 IN PROGRESS
**Goal**: Fix the remaining safety, correctness, and UX gaps found in the second post-implementation review of the `create` subcommand.

## Overview

A second systematic review of the `create` implementation surfaced eleven open issues spanning security (HTTPS enforcement, path traversal, unsafe YAML parsing), error-handling correctness (unhandled pipe errors, hanging readline, wrong exit code on cancellation), DX gaps (cleanup tip shown for non-HTTP scaffolds, wrong help example URL), and a broken E2E test fixture. This epic closes every finding so the feature is production-quality and the test suite is green.

---

## Fix E2E test fixture missing `test:e2e`

The "does not overwrite existing AGENTS.md with all directives" test has a fixture that does not include `test:e2e`, so `hasAllDirectives()` returns false and the installer appends content, breaking the assertion.

**Requirements**:
- Given the test fixture represents an AGENTS.md with all required directives, should include a `test:e2e` mention so `hasAllDirectives()` returns true
- Given the updated fixture, the test should pass with content unchanged after install

---

## Enforce HTTPS-only for remote scaffold URIs

`isHttpUrl` in `scaffold-resolver.js` accepts both `http://` and `https://`. Downloading executable scaffold code over plain HTTP exposes developers to on-path tampering.

**Requirements**:
- Given an HTTP (non-TLS) scaffold URI, `resolveExtension` should throw `ScaffoldValidationError` before any network request is made
- Given an HTTPS scaffold URI, should proceed normally
- Given the error message, should name the rejected URI and instruct the user to use `https://`

---

## Only show cleanup tip for HTTP/HTTPS scaffolds

The cleanup tip is printed after every successful `create`, including named and `file://` scaffolds that never create a `.aidd/scaffold/` directory, making the tip misleading.

**Requirements**:
- Given a named scaffold (`next-shadcn`), `runCreate` should not suggest `scaffold-cleanup`
- Given a `file://` scaffold, `runCreate` should not suggest `scaffold-cleanup`
- Given an `https://` scaffold, `runCreate` should suggest `scaffold-cleanup`
- Given `resolveExtension` returns a `downloaded` flag (true for HTTP, false otherwise), `runCreate` uses it to conditionally include `cleanupTip` in the result

---

## Use safe YAML schema in `parseManifest`

`yaml.load(content)` with no schema option allows JS-specific types in the YAML. Scaffold manifests can come from untrusted remote URIs.

**Requirements**:
- Given a SCAFFOLD-MANIFEST.yml with only plain strings, arrays, and objects, should parse successfully with `yaml.JSON_SCHEMA`
- Given a SCAFFOLD-MANIFEST.yml that uses JS-specific YAML constructs (e.g. `!!js/regexp`), should throw a parse error rather than silently executing
- Given the schema option is applied, the test suite should still pass for all existing valid manifests

---

## Wrap `fs.readFile` in `ensureClaudeMd` with `try/catch`

`agents-md.js:254` reads CLAUDE.md without error handling. A permission or I/O error would throw a raw Node error instead of a wrapped `AgentsFileError`.

**Requirements**:
- Given CLAUDE.md exists but cannot be read (e.g. permission error), `ensureClaudeMd` should throw `AgentsFileError` with the path and original error as cause
- Given the read succeeds, behaviour is unchanged

---

## Fix ad-hoc error handling in main install path and scaffold-cleanup

`bin/aidd.js` lines 148–193 manually construct a `new Error()` before calling `handleCliErrors`, and `scaffold-cleanup` at line 366 has no typed handler at all.

**Requirements**:
- Given the main install action encounters a `CloneError`, `FileSystemError`, or `ValidationError`, should handle it via `handleCliErrors` without manually constructing a wrapper `Error`
- Given `scaffold-cleanup` throws, should display a clear typed error message rather than a raw `err.message` fallback

---

## Validate `type` in `resolveNamed` to prevent path traversal

`resolveNamed` passes `type` directly to `path.resolve()` without checking that the result stays within the `ai/scaffolds/` directory.

**Requirements**:
- Given a `type` containing path-traversal segments (e.g. `../../etc`), `resolveNamed` should throw `ScaffoldValidationError` before accessing the filesystem
- Given a valid named type (e.g. `next-shadcn`), should resolve normally

---

## Auto-resolve bare GitHub repo URLs to latest release tarball

`bin/aidd.js` line 227 shows `https://github.com/org/scaffold my-project` as an example. The implementation should detect a bare `https://github.com/owner/repo` URL and automatically resolve it to the latest release tarball via the GitHub API, then download that. Users should not need to know the tarball URL format.

**Requirements**:
- Given a bare `https://github.com/owner/repo` URL (no path beyond the repo name), `resolveExtension` should fetch the latest release tag from the GitHub API and construct the tarball URL
- Given the resolved tarball URL, should download and extract it normally via `defaultDownloadAndExtract`
- Given a URL that is already a direct tarball link (contains `/archive/`), should download it directly without hitting the API
- Given the GitHub API returns no releases, should throw `ScaffoldNetworkError` with a clear message naming the repo
- Given the help text example, should show a bare `https://github.com/org/repo` URL consistent with the actual supported usage
- Given `ai/scaffolds/SCAFFOLD-AUTHORING.md`, should document both bare repo URL and direct tarball URL options

---

## Add error and close handlers to `defaultConfirm` readline

`defaultConfirm` in `scaffold-resolver.js` wraps `rl.question` in a promise with no `error` or `close` event handlers. If stdin is closed or not a TTY, the promise hangs forever.

**Requirements**:
- Given stdin is closed before the user answers, the readline promise should reject with a `ScaffoldCancelledError`
- Given a readline error event fires, the promise should reject with a `ScaffoldCancelledError`
- Given the user answers normally, behaviour is unchanged

---

## Add `stdin` error handler for `tar` spawn in `defaultDownloadAndExtract`

`child.stdin.write(buffer)` and `child.stdin.end()` have no error listener on `child.stdin`. A broken pipe (tar exits early) crashes Node with an unhandled error event.

**Requirements**:
- Given the tar process exits before consuming all stdin, the promise should reject with a descriptive error rather than crashing Node
- Given the tar process consumes all stdin successfully, behaviour is unchanged

---

## Exit with code 0 on user cancellation

`bin/aidd.js` calls `process.exit(1)` unconditionally after `ScaffoldCancelledError` in both `create` (line 295) and `verify-scaffold` (line 341). Cancellation is a graceful abort, not a failure.

**Requirements**:
- Given the user declines the remote scaffold confirmation, `create` should exit with code 0
- Given the user declines on `verify-scaffold`, should exit with code 0
- Given any other error (network, validation, step failure), should still exit with code 1
