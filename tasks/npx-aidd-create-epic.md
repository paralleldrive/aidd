# `npx aidd create` Epic

**Status**: 🔄 IN REVIEW — code review fixes required before merge
**Goal**: Add a `create` subcommand to `aidd` that scaffolds new apps from manifest-driven extensions with fresh `@latest` installs.

## Overview

Today there's no way to bootstrap a new project from the AIDD ecosystem — devs fall back to stale `create-*` templates or hand-roll setups. `npx aidd create <type|URI> <folder>` solves this by composing a declarative `SCAFFOLD-MANIFEST.yml` (with shell `run` steps and AI `prompt` steps) with live `@latest` installs, so every project starts with current security patches and an AI-guided setup workflow.

---

## Node.js engine requirement

**Requirements**:
- Given a user is on Node < 18, should receive a clear version constraint error from npm/node at install or run time — not a confusing runtime `ReferenceError`

---

## CLAUDE.md stability on repeated installs

Ensure `ensureClaudeMd` does not modify a `CLAUDE.md` that was created by a previous install.

**Requirements**:
- Given `npx aidd` is run a second time on a project where `CLAUDE.md` was created by the first run, should return `action: "unchanged"` and not modify the file

---

## Add `create` subcommand

New Commander subcommand `create [type] <folder>` added to `bin/aidd.js`.

**Requirements**:
- Given `npx aidd create [type] <folder>`, should create a new directory `<folder>` in cwd
- Given `<type>` matching a scaffold name, should resolve to `ai/scaffolds/<type>` in the package
- Given `<type>` as an HTTP/HTTPS URI, should treat it as a remote extension source
- Given no `<type>` and no `AIDD_CUSTOM_CREATE_URI`, should use the bundled `ai/scaffolds/next-shadcn` extension
- Given `AIDD_CUSTOM_CREATE_URI` env var is set and no `<type>` arg, should use the env URI (supports `https://` and `file://` schemes only — `http://` is rejected)
- Given `--agent <name>` flag, should use that agent CLI for `prompt` steps (default: `claude`)
- Given scaffold completes successfully, should suggest `npx aidd scaffold-cleanup` to remove downloaded extension files
- Given only a single `https://` or `file://` URI argument with no folder, should print `error: missing required argument 'folder'` and exit 1 (not silently create a directory with a mangled URL path)
- Given `resolveExtension` rejects for any reason (e.g. user cancels remote code confirmation, network failure), should not create any directory on disk

---

## Extension resolver

Resolve extension source and fetch `README.md` and `SCAFFOLD-MANIFEST.yml`.

**Requirements**:
- Given `AIDD_CUSTOM_CREATE_URI` was not set before a test, should be fully absent from `process.env` after the test completes — even if the test throws
- Given a named scaffold type, should read files directly from `ai/scaffolds/<type>` in the package
- Given an HTTP/HTTPS URI pointing to a GitHub repository, should download the latest GitHub release tarball (rather than git clone) and extract it to `<folder>/.aidd/scaffold/` — this gives versioned, reproducible scaffolds without fetching the full git history
- Given a `file://` URI, should read extension files from the local path it points to without copying them
- Given any extension, should display README contents to the user before proceeding
- Given a remote HTTP/HTTPS URI, should warn the user they are about to execute remote code and prompt for confirmation before downloading or running anything
- Given fetched extension files, should leave them in place at `<folder>/.aidd/scaffold/` after scaffolding completes

---

## Scaffold verifier

Pre-flight checks that a resolved scaffold is structurally valid before any steps are executed.

**Requirements**:
- Given a missing manifest, should return an error message that includes the full `manifestPath` so the user knows exactly where the file was expected

---

## SCAFFOLD-MANIFEST.yml runner

Parse and execute manifest steps sequentially in the target directory.

**Requirements**:
- Given a `run` step, should execute it as a shell command in `<folder>`
- Given a `prompt` step, should invoke the selected agent CLI (default: `claude`) with that prompt string in `<folder>`
- Given any step fails, should report the error and halt execution

### Manifest validation

`parseManifest` must validate the manifest structure before returning steps so that malformed manifests fail fast with a clear error rather than silently producing wrong output.

**Requirements**:
- Given `steps` is present but is not an array (e.g. a string or plain object), should throw `ScaffoldValidationError` with a message that includes `"steps"` and the actual type received
- Given a step item is not a plain object (e.g. a bare string, `null`, or nested array), should throw `ScaffoldValidationError` identifying the offending step number
- Given a step item has no recognized keys (`run` or `prompt`), should throw `ScaffoldValidationError` identifying the offending step number and the keys that were found
- Given a step item where `run` or `prompt` is not a string (e.g. `run: 123` or `prompt: [a, b]`), should throw `ScaffoldValidationError` with a message identifying the step number, key name, and actual type received
- Given `steps` is absent or `null`, should return an empty array (backward-compatible default)

---

## Add `verify-scaffold` subcommand

New Commander subcommand `verify-scaffold [type]` that validates a scaffold conforms to all structural requirements before it is run.

**Requirements**:
- Given a valid named scaffold, should print `✅ Scaffold is valid` and exit 0
- Given a named scaffold whose manifest is missing, should print a descriptive error and exit 1
- Given a scaffold whose `steps` is not an array, should print a validation error and exit 1
- Given a scaffold with a step that has no recognized keys, should print a validation error and exit 1
- Given a scaffold with an empty steps array, should report that the scaffold would do nothing and exit 1
- Given a `file://` URI or HTTP/HTTPS URI, should resolve and validate the same as named scaffolds

---

## Add `scaffold-cleanup` subcommand

New Commander subcommand `scaffold-cleanup [folder]` that removes the `.aidd/` working directory.

**Requirements**:
- Given `npx aidd scaffold-cleanup <folder>`, should delete `<folder>/.aidd/`
- Given no `<folder>` arg, should delete `.aidd/` in the current working directory
- Given `.aidd/` does not exist, should report that there is nothing to clean up

---

## Create `scaffold-example` extension

Minimal fast-running scaffold at `ai/scaffolds/scaffold-example` used as the e2e test fixture.

**Requirements**:
- Given the scaffold runs, should initialize a new npm project in `<folder>`
- Given the scaffold runs, should install `riteway`, `vitest`, `@playwright/test`, `error-causes`, `@paralleldrive/cuid2`, and `release-it` at `@latest`
- Given the scaffold runs, should configure `scripts.test` as `vitest run`
- Given the scaffold runs, should configure `scripts.release` as `release-it` so the generated project can publish GitHub releases
- Given the scaffold runs, should leave a working project where `npm test` can be invoked

### Scaffold author release workflow

Each scaffold lives in its own repository and is distributed as a **GitHub release** (versioned tarball), not via raw git clone.

**Requirements**:
- Each scaffold directory should include a `package.json` with a `release` script (`release-it`) so scaffold authors can cut a tagged GitHub release with one command
- The `files` array in the scaffold's `package.json` controls which files are included when publishing to **npm** — it does NOT affect GitHub release assets (those are controlled by the release workflow and what is committed to the repository)
- Scaffold consumers reference a released scaffold by its bare GitHub repo URL (`https://github.com/owner/repo`); the aidd resolver auto-resolves this to the latest release tarball via the GitHub API and downloads it instead of cloning the repo

---

## Create `next-shadcn` scaffold stub

Stub scaffold at `ai/scaffolds/next-shadcn` as the named default, for future full implementation.

**Requirements**:
- Given the scaffold is selected, should display a README describing the intended Next.js + shadcn/ui setup
- Given the scaffold is selected, should have a `SCAFFOLD-MANIFEST.yml` with placeholder steps

---

## E2E tests for `create` command

End-to-end tests using `scaffold-example` as the test fixture.

**Requirements**:
- Given `aidd create scaffold-example test-project`, should create `test-project/` with expected packages installed
- Given `AIDD_CUSTOM_CREATE_URI` set to a `file://` URI, should use it over the default extension
- Given `aidd scaffold-cleanup test-project`, should remove `test-project/.aidd/`
- Given `--agent claude` flag, should pass the agent name through to `prompt` step invocations

---

## Rename `AIDD_CUSTOM_EXTENSION_URI` → `AIDD_CUSTOM_CREATE_URI`

Rename the environment variable everywhere it appears for consistency with the `create` subcommand name.

**Requirements**:
- Given any reference to `AIDD_CUSTOM_EXTENSION_URI` in source, tests, or docs, should be replaced with `AIDD_CUSTOM_CREATE_URI`

---

## Fix `resolveNamed` path traversal check edge case

The existing `!typeDir.startsWith(scaffoldsRoot + path.sep)` check incorrectly allows `type = ""` or `type = "."` to pass: `path.resolve(scaffoldsRoot, "")` returns `scaffoldsRoot` itself, which does not start with `scaffoldsRoot + sep` and was being rejected with a misleading "resolved outside" error. The fix uses `path.relative()` which cleanly separates the two failure modes.

**Requirements**:
- Given `type` containing path-traversal segments (e.g. `../../etc/passwd`), `resolveNamed` should throw `ScaffoldValidationError` (unchanged existing behavior)
- Given `type = ""` (empty string), the `||` fallback chain treats it as falsy and uses the default scaffold — this is correct, not a bug
- Given `type = "."`, `resolveNamed` should throw `ScaffoldValidationError`; the error message must not say "outside the scaffolds directory" (`.` resolves to the scaffolds root itself, not outside it)
- Given a valid named type (e.g. `next-shadcn`), should resolve normally (unchanged existing behavior)
- Implementation: use `path.relative(scaffoldsRoot, typeDir)` — throw if the relative path starts with `..`, is absolute, or is empty

---

## Strip `.git` suffix in `defaultResolveRelease` API URL construction

`isGitHubRepoUrl` accepts URLs ending in `.git` (e.g. `https://github.com/org/repo.git`) by stripping the suffix during validation only. `defaultResolveRelease` does not strip the suffix before constructing the GitHub API URL, so passing a `.git` URL produces `https://api.github.com/repos/org/repo.git/releases/latest` — an invalid URL that returns a 404 with a misleading "no releases found" error.

**Requirements**:
- Given a GitHub repo URL ending with `.git` (e.g. `https://github.com/org/repo.git`), `defaultResolveRelease` should strip the `.git` suffix before constructing the API URL, producing `https://api.github.com/repos/org/repo/releases/latest`

---

## Support `GITHUB_TOKEN` for private repos and higher rate limits

`defaultResolveRelease` and `defaultDownloadAndExtract` currently make unauthenticated requests, limiting usage to public repos and 60 API requests/hr per IP. Adding optional `GITHUB_TOKEN` support covers private-repo scaffold authors and avoids spurious rate-limit failures in busy environments.

**Requirements**:
- Given `GITHUB_TOKEN` is set in the environment, `defaultResolveRelease` should include an `Authorization: Bearer ${GITHUB_TOKEN}` header on the GitHub API request
- Given `GITHUB_TOKEN` is set in the environment, `defaultDownloadAndExtract` should include an `Authorization: Bearer ${GITHUB_TOKEN}` header only when the download URL's hostname is `api.github.com`, `github.com`, or `codeload.github.com` — never for third-party hosts
- Given the GitHub API returns 403 (rate limited), the error should say "GitHub API rate limit exceeded — set GITHUB_TOKEN for 5,000 req/hr" regardless of whether a token is set
- Given the GitHub API returns 404 and `GITHUB_TOKEN` is **not** set, the error should include the hint: "If the repo is private, set GITHUB_TOKEN to authenticate"
- Given the GitHub API returns 404 and `GITHUB_TOKEN` **is** set, the error should not include that hint (the token is set; the repo simply doesn't exist or has no releases)

---

## Fix `verify-scaffold` HTTP/HTTPS scaffold download location and cleanup

`verify-scaffold` downloaded remote scaffolds to `.aidd/scaffold/` in the current working directory and never cleaned them up — a silent filesystem side effect for a read-only validation command.

### Architectural decision

Because the project directory may not yet exist at verification time, downloaded scaffold files belong in `~/.aidd/scaffold/` (the user-level aidd home directory), not in the project directory. Cleanup must happen unconditionally (in a `finally` block) whether verification succeeds or fails.

**Requirements**:
- Given an HTTP/HTTPS scaffold URI, `verify-scaffold` should download scaffold files to `~/.aidd/scaffold/` (not the current working directory)
- Given successful verification, `verify-scaffold` should remove `~/.aidd/scaffold/` after the result is returned
- Given a verification error or resolution error (cancelled, network failure, validation error), `verify-scaffold` should still remove `~/.aidd/scaffold/` before propagating the error
- Given a named (`next-shadcn`) or `file://` scaffold, cleanup is a no-op (nothing was downloaded)

---

## Add `set` subcommand and user-level config (`~/.aidd/config.yml`)

### Architectural decision

The extension URI priority chain is:

```
CLI <type> arg  >  AIDD_CUSTOM_CREATE_URI env var  >  ~/.aidd/config.yml  >  default (next-shadcn)
```

The user config file (`~/.aidd/config.yml`) is read **directly** by `resolveExtension` as a third-level fallback — it is NOT applied to `process.env` at startup. The env var remains a distinct, higher-priority override (useful for CI and one-off runs). The `set` command provides a convenient way to write to `~/.aidd/config.yml` without hand-editing YAML.

YAML is used for the config file because it is token-friendly for AI context injection.

### `npx aidd set <key> <value>`

**Requirements**:
- Given `npx aidd set create-uri <uri>`, should write `create-uri: <uri>` to `~/.aidd/config.yml`, creating the directory and file if they don't exist
- Given an existing `~/.aidd/config.yml`, should merge the new value without losing other keys
- Given an unknown `<key>`, should print a clear error and exit 1
- Given `npx aidd create` with no `<type>` arg and no `AIDD_CUSTOM_CREATE_URI` env var, should fall back to the `create-uri` value from `~/.aidd/config.yml`
- Given `AIDD_CUSTOM_CREATE_URI` env var is set, should take precedence over `~/.aidd/config.yml`
- Given a CLI `<type>` arg, should take precedence over both the env var and `~/.aidd/config.yml`
- Given a config file containing a YAML-specific tag (e.g. `!!binary`), `readConfig` should return `{}` (unsafe YAML types are rejected by `yaml.JSON_SCHEMA`)

---

## Copy scaffold files to project directory (issue #139)

After validation, before running the manifest, scaffold source files must be copied
into the project folder so manifest steps can reference them as local files.

**Requirements**:
- Given the destination folder already exists on disk, `runCreate` should throw `ScaffoldValidationError` with a message that includes the folder path
- Given the destination folder already exists, `runCreate` should not proceed to resolve or download the extension
- Given scaffold source files are resolved (named, `file://`, or remote), `runCreate` should copy them to the project folder before running the manifest
- Given a scaffold source with files alongside the manifest, all files should be available in `<folder>` when manifest steps execute

---

## Code review fixes (from PR #124 review)

### C1 — `createError` not used in `defaultResolveRelease` and `defaultDownloadAndExtract`

`scaffold-resolver.js` throws plain `new Error()` in three places inside `defaultResolveRelease` (403, non-ok status, missing `tarball_url`) and one place inside `defaultDownloadAndExtract` (non-ok HTTP response) and one inside the tar `close` handler. Raw errors bypass `handleScaffoldErrors`, causing them to fall silently through to the generic fallback.

**Requirements**:
- Given `defaultResolveRelease` encounters a 403 response, should throw a `createError` with `ScaffoldNetworkError` shape (not a plain `new Error`)
- Given `defaultResolveRelease` encounters any non-ok non-403 response, should throw a `createError` with `ScaffoldNetworkError` shape
- Given `defaultResolveRelease` finds no `tarball_url` in the release, should throw a `createError` with `ScaffoldNetworkError` shape
- Given `defaultDownloadAndExtract` receives a non-ok HTTP response, should throw a `createError` with `ScaffoldNetworkError` shape
- Given `tar` exits with a non-zero code, should throw a `createError` with `ScaffoldNetworkError` shape

---

### C2 — `defaultConfirm` builds ad-hoc error objects with `Object.assign` instead of `createError`

**Requirements**:
- Given stdin closes before the user answers the confirmation prompt, should throw a `createError` with `ScaffoldCancelledError` shape (not `Object.assign(new Error(...), { type: "close" })`)
- Given stdin errors before the user answers, should throw a `createError` with `ScaffoldCancelledError` shape

---

### C3 — `scaffold-verifier.js` uses `instanceof Error` check

The project's `error-causes` rules explicitly prohibit `instanceof` for error type checking. Line 24 uses `err instanceof Error ? err.message : String(err)`.

**Requirements**:
- Given `parseManifest` throws for any reason inside `verifyScaffold`, should extract the error message without using `instanceof` (use `err?.message ?? String(err)`)

---

### H1 — ALL_CAPS constant names violate JS naming guide

The JS guide states: *"Avoid ALL_CAPS for constants."* The naming convention applies to all constants regardless of whether they are module-level.

**Requirements**:
- Given any constant in new scaffold modules, should be named in camelCase, not SCREAMING_SNAKE_CASE
- Affected names: `SCAFFOLD_DOWNLOAD_DIR`, `DEFAULT_SCAFFOLD_TYPE`, `KNOWN_STEP_KEYS`, `GITHUB_DOWNLOAD_HOSTNAMES`, `AIDD_HOME`, `CONFIG_FILE`

---

### H2 — `scaffold-resolver.js` exceeds 200 LoC and mixes 4 distinct concerns

The file contains URL-type detection, GitHub API release resolution, tarball download + `tar` extraction, readline confirmation prompt, and path resolution. Per "one concern per file".

**Requirements**:
- Given the download/network concerns (GitHub release resolution, tarball download+extract, readline confirm), should live in a dedicated `lib/scaffold-downloader.js` module
- Given `scaffold-resolver.js` after extraction, should be ≤ 200 LoC and concern itself only with path resolution (named, `file://`, `https://`)

---

### M1 — Dead `folder` parameter still passed in `scaffold-resolver.test.js`

After removing `folder` from `resolveExtension`'s signature, many test call-sites still pass `folder: "/tmp/..."` which is silently ignored.

**Requirements**:
- Given any test call to `resolveExtension`, should not pass a `folder` property (it is no longer part of the API)

---

### M0 — `prompt` step passes full text as a CLI arg without E2BIG guard

`runManifest` calls `execStep([agent, step.prompt], folder)` which spawns the agent binary with the full prompt text as a single argument. Very long prompts can exceed OS `ARG_MAX` limits and produce a cryptic `E2BIG` spawn error with no scaffold context.

**Requirements**:
- Given a `prompt` step whose text would cause `spawn` to fail with `E2BIG` or `ENOBUFS`, should throw a `ScaffoldStepError` with a clear message identifying the step (including prompt length in chars), rather than letting the raw OS error propagate

---

### M2 — Excessively verbose test files block the ≤1000 LoC per-PR budget

- `scaffold-resolver.test.js`: 1147 lines for a 304-line implementation — dozens of tests repeat the same `error?.cause?.code === "SCAFFOLD_VALIDATION_ERROR"` pattern with trivially different inputs
- `scaffold-runner.test.js`: 535 lines for a 133-line implementation — 8+ tests repeat the identical error-code assertion with minor input variation
- `scaffold-create.test.js`: 334 lines for a 78-line implementation

**Requirements**:
- Given multiple test cases that differ only in input and all assert the same error code, should use a table-driven or parameterized pattern instead of repeating the full `let error = null; try/catch; assert` block
- Given the total diff for any single PR, should not exceed +1000 LoC
- Given multiple `assert` calls in one test that each check a different property of the same return value from the same operation, should be collapsed into a single `assert` on a composite `actual` / `expected` object

---

### M3 — `scaffold-cleanup.test.js` third test is vacuous

The test "targets ~/.aidd/scaffold by default (not the project directory)" never calls `scaffoldCleanup`. It constructs a path manually and asserts `startsWith(os.homedir())` on a string it built itself — proving nothing about the implementation.

**Requirements**:
- Given the default `scaffoldDir` behavior of `scaffoldCleanup`, should be verified by a test that calls `scaffoldCleanup()` with no arguments (possibly against a real temp dir, or by inspecting the exported `SCAFFOLD_DOWNLOAD_DIR` constant)

---

### M4 — `defaultLog` is a pointless wrapper

`const defaultLog = (msg) => console.log(msg)` adds an indirection with zero value.

**Requirements**:
- Given the `log` parameter default in `resolveExtension`, should default directly to `console.log` without an intermediate wrapper

---

### L1 — `let paths` mutable variable in `resolveExtension`

The `let paths` / `if-else if-else` assignment pattern in `resolveExtension` uses mutable state unnecessarily.

**Requirements**:
- Given the three resolution branches (http, file://, named), should be expressed as early-return branches or a helper that returns a value, avoiding mutable `let`

---

### L2 — Duplicate `handleScaffoldErrors` blocks in `scaffold-commands.js`

The `create` and `verify-scaffold` handlers each contain a nearly identical `handleScaffoldErrors` call mapping the same four error types to the same display patterns.

**Requirements**:
- Given shared error display logic across scaffold CLI handlers, should be extracted into a single reusable helper to eliminate duplication

---

### L3 — Test quality issues in `scaffold-commands.test.js`

**Requirements**:
- Given `scaffold-commands.test.js`, should not suppress TypeScript errors with `@ts-nocheck`; fix each surfaced type error directly or use a targeted `// @ts-ignore` on the specific line with an explanatory comment
- Given the test for the `--agent` option existence, should assert `agentOption?.long === "--agent"` (identity) rather than `agentOption !== undefined` (boolean existence)

---

## PR splitting plan

Current diff is +4414 LoC. Split into four PRs (≤ +1000 LoC each after test verbosity reduction):

| PR | Contents |
|----|----------|
| **A** | `lib/aidd-config.js` + tests, `lib/scaffold-errors.js`, `package.json` (`js-yaml` dep + `engines`) |
| **B** | `lib/scaffold-runner.js` + trimmed tests, `lib/scaffold-verifier.js` + tests, `ai/scaffolds/` fixtures, `docs/scaffold-authoring.md` |
| **C** | Extract `lib/scaffold-downloader.js`, `lib/scaffold-resolver.js` (slimmed) + trimmed tests |
| **D** | `lib/scaffold-cleanup.js` + tests, `lib/scaffold-create.js` + tests, `lib/scaffold-verify-cmd.js` + tests, `lib/scaffold-commands.js` + tests, `bin/aidd.js` changes, `bin/create-e2e.test.js` |
