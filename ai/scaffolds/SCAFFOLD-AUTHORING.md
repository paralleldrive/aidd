---
title: Scaffold Authoring Guide
description: How to create a custom AIDD scaffold for npx aidd create
---

# Scaffold Authoring Guide

This guide explains how to create a custom scaffold that can be used with `npx aidd create`.

## Directory Structure

A scaffold is a self-contained directory (or Git repository) with this layout:

```
my-scaffold/
├── SCAFFOLD-MANIFEST.yml   # Required — step definitions
├── README.md               # Optional — displayed to user before scaffolding
├── bin/
│   └── extension.js        # Optional — Node.js script run after all steps
└── package.json            # Recommended — for publishing and release workflow
```

## `SCAFFOLD-MANIFEST.yml`

The manifest defines the steps executed in the target directory:

```yaml
steps:
  - run: npm init -y
  - run: npm install vitest --save-dev
  - prompt: Set up the project structure and add a README
  - run: npm test
```

### Step types

| Key      | Behaviour |
|----------|-----------|
| `run`    | Executed as a shell command in `<folder>` |
| `prompt` | Passed as a prompt to the agent CLI (default: `claude`) |

Each step must have **exactly one** of `run` or `prompt` — a step with both keys is rejected as ambiguous.

## `bin/extension.js`

If present, `bin/extension.js` is executed via `node` after all manifest steps complete. Use it for any programmatic setup that is awkward to express as shell commands.

## `package.json` and the `files` array

The `files` array in `package.json` works exactly like a standard npm package: it controls which files are included when you publish the scaffold to npm. It does **not** directly affect what is downloaded when a user runs `npx aidd create <url>` — that depends on what is committed to your Git repository and tagged in a release.

```json
{
  "name": "my-scaffold",
  "version": "1.0.0",
  "files": [
    "SCAFFOLD-MANIFEST.yml",
    "README.md",
    "bin/"
  ],
  "scripts": {
    "release": "release-it"
  }
}
```

### What to include in `files`

- Always include `SCAFFOLD-MANIFEST.yml` and `README.md`
- Include `bin/extension.js` if you use it
- Exclude test files, CI configs, and editor dotfiles — they aren't needed at scaffold time

## Distributing a scaffold

### Named scaffold (bundled in aidd)

Named scaffolds live in `ai/scaffolds/<name>/` inside the aidd package itself. To add one, open a PR to this repository.

### Local development (file:// URI)

Point `npx aidd create` at a local directory for rapid iteration:

```sh
npx aidd create file:///path/to/my-scaffold my-project
```

Or set the environment variable:

```sh
AIDD_CUSTOM_EXTENSION_URI=file:///path/to/my-scaffold npx aidd create my-project
```

### Remote scaffold (GitHub release)

Tag a release in your scaffold repository. Users reference the release tarball URL directly:

```sh
npx aidd create https://github.com/your-org/my-scaffold/archive/refs/tags/v1.0.0.tar.gz my-project
```

`npx aidd create` downloads the release tarball and extracts it to `<project>/.aidd/scaffold/` before running the manifest. After scaffolding, run `npx aidd scaffold-cleanup <project>` to remove the temporary files.

## Validation

Run `npx aidd verify-scaffold` to validate your manifest before distributing:

```sh
npx aidd verify-scaffold file:///path/to/my-scaffold
```

This checks that:
- `SCAFFOLD-MANIFEST.yml` is present
- `steps` is an array of valid step objects
- Each step has exactly one recognised key (`run` or `prompt`)
- The steps array is not empty
