# craft-skill RequiredSections Epic

**Status**: 🔧 IN PROGRESS
**Goal**: Keep `RequiredSections` in `ai/skills/aidd-craft-skill/references/types.md` accurate and minimal.

## Overview

The `RequiredSections` block in `types.md` lists five required sections that every generated `SKILL.md` must include. Three of them (`## When to use`, `## Examples`, `## Edge cases`) are not truly required and create unnecessary constraints on skill authors. Only `# Title` and `## Steps | ## Process` represent universal requirements.

---

## Trim RequiredSections to only truly required sections

**Requirements**:
- Given `RequiredSections` is defined in `ai/skills/aidd-craft-skill/references/types.md`, should list only `# Title` and `## Steps | ## Process` as required sections — `## When to use`, `## Examples`, and `## Edge cases` should not appear as required.
