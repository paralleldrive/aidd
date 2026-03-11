---
name: aidd-ts-projects
description: Enforces TypeScript project references and tsconfig best practices. Use when setting up or modifying TypeScript configuration, project references, or when asked about tsconfig structure.
---

# TypeScript Project Configuration

Enforce [aidd-structure](../aidd-structure/SKILL.md) dependency rules using TypeScript project references. Keep tsconfigs minimal and consistent.

## When to use this skill

- Setting up a new TypeScript project
- Adding or modifying tsconfig files
- Explaining or validating project reference structure

## Hierarchy

```
<root>/
├── tsconfig.base.json          # Common base; include: []
├── tsconfig.json               # Root aggregator; references src only
└── src/
    ├── tsconfig.json           # Aggregates components, state, types
    ├── components/
    │   └── tsconfig.json       # extends base; references state, types
    ├── state/
    │   └── tsconfig.json       # extends base; references types
    └── types/
        └── tsconfig.json       # extends base; no references
```

## Rules

### Base config (`tsconfig.base.json`)

- Shared compiler options for the whole project
- `include: []` — no files compiled directly
- No `references`

### Root aggregator (`tsconfig.json`)

- `references: ["./src"]` — includes only the src project
- No `include` (or minimal; aggregation only)

### src aggregator (`src/tsconfig.json`)

- `references: ["./components", "./state", "./types"]`
- No `include` — aggregates child projects only

### Folder configs (`components/`, `state/`, `types/`)

Each folder tsconfig must be **extremely simple**:

1. **extends** — `"extends": "../../tsconfig.base.json"` (or appropriate path to base)
2. **include** — `["**/*.ts", "**/*.tsx"]` — glob patterns only, never specific files
3. **references** — ONLY the allowed dependencies per [aidd-structure](../aidd-structure/SKILL.md):

   | Folder       | references                          |
   |--------------|-------------------------------------|
   | `components` | `["../state", "../types"]`          |
   | `state`      | `["../types"]`                      |
   | `types`      | `[]` (none)                         |

## Constraints

- **NEVER** use specific file paths in `include` (e.g. `"include": ["foo.ts"]`)
- **NEVER** reference folders that violate dependency rules
- **NEVER** add `include` to base or aggregator configs beyond what is needed for aggregation

## AI Agent Rules

**NEVER touch or modify tsconfig files without explicit user permission.**

- Do not add, remove, or change tsconfig files unless the user explicitly requests it
- Do not "fix" or "improve" tsconfigs as part of other tasks
- Do not violate these rules when making any tsconfig changes.
