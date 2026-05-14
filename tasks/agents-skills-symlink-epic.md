# Agents Skills Symlink Epic

**Status**: 🚧 IN PROGRESS
**Goal**: Symlink all aidd-* skills individually into `.agents/skills/` during installation so the AIDD framework plays nicely with the emerging cross-agent `.agents/` standard.

## Overview

Why: The `.agents/` folder is becoming the cross-agent standard for storing skills (see [cursor.com/docs/skills](https://cursor.com/docs/skills#skill-directories)). Without symlinking, consumers of the AIDD framework miss out on tool integration with agents that discover skills via `.agents/skills/`. By symlinking `ai/skills/aidd-*` into `.agents/skills/aidd-*` at install time, aidd installs become discoverable by any agent that follows the standard — without requiring consumers to manage two copies of the skill files.

---

## Create .agents/skills Symlinks

Adds a symlink step to the installation pipeline that creates `.agents/skills/aidd-*` symlinks pointing to `ai/skills/aidd-*`.

**Requirements**:
- Given a target directory with `ai/skills/aidd-*` folders, should create `.agents/skills/` directory if it does not exist
- Given an `aidd-*` skill folder in `ai/skills/`, should create a symlink at `.agents/skills/<skill-name>` pointing to the relative path `../../ai/skills/<skill-name>`
- Given an `.agents/skills/aidd-*` entry that is already a symlink, should skip (idempotent — do not recreate or error)
- Given an `.agents/skills/aidd-*` entry that is a real directory or file (not a symlink), should leave it untouched so consumers can override/disable individual skills
- Given a dry run, should report what symlinks would be created without modifying the filesystem
- Given verbose mode, should log each symlink operation result

---
