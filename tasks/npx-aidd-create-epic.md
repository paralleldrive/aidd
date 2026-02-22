# `npx aidd create` Epic

**Status**: ✅ DONE
**Goal**: Add a `create` subcommand to `aidd` that scaffolds new apps from manifest-driven extensions with fresh `@latest` installs.

## Overview

Today there's no way to bootstrap a new project from the AIDD ecosystem — devs fall back to stale `create-*` templates or hand-roll setups. `npx aidd create <type|URI> <folder>` solves this by composing a declarative `SCAFFOLD-MANIFEST.yml` (with shell `run` steps and AI `prompt` steps) with live `@latest` installs, so every project starts with current security patches and an AI-guided setup workflow.

---

## Add `create` subcommand

New Commander subcommand `create [type] <folder>` added to `bin/aidd.js`.

**Requirements**:
- Given `npx aidd create [type] <folder>`, should create a new directory `<folder>` in cwd
- Given `<type>` matching a scaffold name, should resolve to `ai/scaffolds/<type>` in the package
- Given `<type>` as an HTTP/HTTPS URI, should treat it as a remote extension source
- Given no `<type>` and no `AIDD_CUSTOM_CREATE_URI`, should use the bundled `ai/scaffolds/next-shadcn` extension
- Given `AIDD_CUSTOM_CREATE_URI` env var is set and no `<type>` arg, should use the env URI (supports `http://`, `https://`, and `file://` schemes)
- Given `--agent <name>` flag, should use that agent CLI for `prompt` steps (default: `claude`)
- Given scaffold completes successfully, should suggest `npx aidd scaffold-cleanup` to remove downloaded extension files

---

## Extension resolver

Resolve extension source and fetch `README.md`, `SCAFFOLD-MANIFEST.yml`, and `bin/extension.js`.

**Requirements**:
- Given a named scaffold type, should read files directly from `ai/scaffolds/<type>` in the package
- Given an HTTP/HTTPS URI pointing to a GitHub repository, should download the latest GitHub release tarball (rather than git clone) and extract it to `<folder>/.aidd/scaffold/` — this gives versioned, reproducible scaffolds without fetching the full git history
- Given a `file://` URI, should read extension files from the local path it points to without copying them
- Given any extension, should display README contents to the user before proceeding
- Given a remote HTTP/HTTPS URI, should warn the user they are about to execute remote code and prompt for confirmation before downloading or running anything
- Given fetched extension files, should leave them in place at `<folder>/.aidd/scaffold/` after scaffolding completes

---

## SCAFFOLD-MANIFEST.yml runner

Parse and execute manifest steps sequentially in the target directory.

**Requirements**:
- Given a `run` step, should execute it as a shell command in `<folder>`
- Given a `prompt` step, should invoke the selected agent CLI (default: `claude`) with that prompt string in `<folder>`
- Given any step fails, should report the error and halt execution
- Given a `bin/extension.js` is present, should execute it via Node.js in `<folder>` after all manifest steps complete

### Manifest validation

`parseManifest` must validate the manifest structure before returning steps so that malformed manifests fail fast with a clear error rather than silently producing wrong output.

**Requirements**:
- Given `steps` is present but is not an array (e.g. a string or plain object), should throw `ScaffoldValidationError` with a message that includes `"steps"` and the actual type received
- Given a step item is not a plain object (e.g. a bare string, `null`, or nested array), should throw `ScaffoldValidationError` identifying the offending step number
- Given a step item has no recognized keys (`run` or `prompt`), should throw `ScaffoldValidationError` identifying the offending step number and the keys that were found
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
