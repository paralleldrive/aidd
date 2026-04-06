---
name: aidd-example-dedup
description: Example skill used to test deduplication detection. Use when running dedup eval tests.
---

# aidd-example-dedup

## Skill Structure

Skills follow this directory layout:

```
ai/skills/aidd-<verbOrRoleBasedNoun>/
├── SKILL.md          # Required: frontmatter + instructions
├── scripts/          # Optional: CLI tools
├── references/       # Optional: detailed reference docs
└── assets/           # Optional: templates, data files
```

Frontmatter must include `name` and `description`. The `name` field must be
lowercase alphanumeric with hyphens, 1-64 characters, prefixed with `aidd-`,
and must match the parent directory name.

import ai-evals/aidd-upskill/fixtures/dedup-reference.md
