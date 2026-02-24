# `npx aidd --claude` Symlink Epic

**Status**: 🔄 IN PROGRESS
**Goal**: Add `--claude` flag to `npx aidd` that creates a `.claude → ai/` symlink (mirroring `--cursor`), and refactor `createCursorSymlink` into a shared `lib/symlinks.js` to eliminate duplication.

## Overview

Claude Code discovers project commands from `.claude/commands/` and skills from `.claude/skills/`. Since `.claude/` is already in `.gitignore` (same as `.cursor/`), the right model is a generated symlink — identical to the existing `--cursor` integration. Refactoring into `lib/symlinks.js` lets both flags share one parameterized function instead of duplicating symlink logic.

---

## Refactor symlink logic into `lib/symlinks.js`

Extract `createCursorSymlink` from `lib/cli-core.js` into a generic, parameterized `createSymlink` in a new `lib/symlinks.js`.

**Requirements**:
- Given `createSymlink({ name, targetBase, force })`, should create a symlink at `targetBase/name` pointing to the relative path `ai`
- Given the symlink target already exists and `force` is false, should throw a `ValidationError` with code `"VALIDATION_ERROR"`
- Given the symlink target already exists and `force` is true, should remove the existing entry and create the symlink
- Given any unexpected filesystem error, should throw a `FileSystemError` with code `"FILESYSTEM_ERROR"` wrapping the original error
- Given `lib/cursor-symlink.test.js` is replaced by `lib/symlinks.test.js`, all existing cursor tests should continue to pass

---

## Add `--claude` flag to `npx aidd`

New `--claude` option that creates a `.claude → ai` symlink alongside (or instead of) `--cursor`.

**Requirements**:
- Given `npx aidd --claude`, should create a `.claude` symlink pointing to `ai` in the target directory
- Given `npx aidd --cursor --claude`, should create both `.cursor` and `.claude` symlinks
- Given `--claude` without `--force` and `.claude` already exists, should report a validation error
- Given `--claude --force` and `.claude` already exists, should replace it with the symlink
- Given `npx aidd --help`, should list `--claude` in the Quick Start section with an example

