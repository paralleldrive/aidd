---
description: Run a folder-based phase list (sequenced *.md phases) with optional nested delegation
---
# /aidd-phase-list

Load and execute the skill at `ai/skills/aidd-phase-list/SKILL.md`.

Run: `/aidd-phase-list --list <phase-list-dir> [--depth N] [--ancestor-paths p:p:...] [-debug]`

The `--list` directory is required (folder of `*.md` phase files under e.g. `ai/phase-lists/<name>/`). See [ai/phase-lists/README.md](../phase-lists/README.md).

Constraints {
  Before beginning, read and respect the constraints in /aidd-please.
  Nested lists: without -debug, only the subagent that receives a delegation phase file runs the full nested /aidd-phase-list on the child directory and emits d=parent+1 progress through run finished; the depth-D parent must not inline that child run. See ai/skills/aidd-phase-list/SKILL.md (Runner laws).
}
