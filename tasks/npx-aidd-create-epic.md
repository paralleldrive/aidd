# `npx aidd create` Epic

**Status**: 📋 PLANNED
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
- Given no `<type>` and no `AIDD_CUSTOM_EXTENSION_URI`, should use the bundled `ai/scaffolds/next-shadcn` extension
- Given `AIDD_CUSTOM_EXTENSION_URI` env var is set and no `<type>` arg, should use the env URI (supports `http://`, `https://`, and `file://` schemes)
- Given `--agent <name>` flag, should use that agent CLI for `prompt` steps (default: `claude`)
- Given scaffold completes successfully, should suggest `npx aidd scaffold-cleanup` to remove downloaded extension files

---

## Extension resolver

Resolve extension source and fetch `README.md`, `SCAFFOLD-MANIFEST.yml`, and `bin/extension.js`.

**Requirements**:
- Given a named scaffold type, should read files directly from `ai/scaffolds/<type>` in the package
- Given an HTTP/HTTPS URI, should fetch `<uri>/README.md`, `<uri>/SCAFFOLD-MANIFEST.yml`, and `<uri>/bin/extension.js` into `<folder>/.aidd/scaffold/`
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
- Given the scaffold runs, should install `riteway`, `vitest`, `@playwright/test`, `error-causes`, and `cuid2` at `@latest`
- Given the scaffold runs, should leave a working project where `npm test` can be invoked

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
- Given `AIDD_CUSTOM_EXTENSION_URI` set to a `file://` URI, should use it over the default extension
- Given `aidd scaffold-cleanup test-project`, should remove `test-project/.aidd/`
- Given `--agent claude` flag, should pass the agent name through to `prompt` step invocations
