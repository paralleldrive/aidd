# craft-skill RequiredSections Epic

**Status**: 🔧 IN PROGRESS
**Goal**: Keep `RequiredSections` in `ai/skills/aidd-craft-skill/references/types.md` accurate and minimal.

## Overview

The `RequiredSections` block in `types.md` lists five required sections that every generated `SKILL.md` must include. Three of them (`## When to use`, `## Examples`, `## Edge cases`) are not truly required and create unnecessary constraints on skill authors. Only `# Title` and `## Steps | ## Process` represent universal requirements.

---

## Trim RequiredSections to only truly required sections

**Requirements**:
- Given `RequiredSections` is defined in `ai/skills/aidd-craft-skill/references/types.md`, should list only `# Title` and `## Steps | ## Process` as required sections — `## When to use`, `## Examples`, and `## Edge cases` should not appear as required.

---

## Eliminate duplicate threshold numbers from prose files

**Requirements**:
- Given `ai/skills/aidd-craft-skill/SKILL.md` line 51 states "Keep `SKILL.md` under 150 lines", should instead direct readers to run `validate-skill` to check thresholds — no hard-coded number.
- Given `ai/skills/aidd-craft-skill/references/process.md` line 52 states "If body will exceed 150 LoC", should instead direct readers to run `validate-skill` to check thresholds — no hard-coded number.
- Given `ai/skills/aidd-craft-skill/references/types.md` `SizeMetrics` block contains numeric threshold comments, should keep field names but remove numeric values and note that the validator is the source of truth.

---

## Add CLI entry point and compiled binary to validate-skill.js

**Requirements**:
- Given `ai/skills/create-skill/scripts/validate-skill.js` is imported as a module only, should also expose a `main` block that reads the skill path from `process.argv[2]`, runs all validations, and prints results — so it can be used as a standalone CLI tool.
- Given `validate-skill.js` has a `main` block, should be compilable via `bun build --compile` into a binary named `validate-skill` in the `scripts/` directory.
- Given `ai/skills/aidd-craft-skill/references/process.md` validate step references `node validate-skill.js`, should instead reference the compiled `validate-skill` binary.
