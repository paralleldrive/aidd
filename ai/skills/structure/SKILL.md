---
name: structure
description: Enforces source code structuring and interdependency best practices. Use when creating folders, moving files, adding imports, or when the user asks about architecture, layering, or module dependencies.
---

# Standard folder structure

```
types ← services ← plugins ← components
  ↑         ↑         ↑
  └─────────┴─────────┘ (types only depend on types)
```

## Dependency rules

| Layer | May depend on | Must NOT depend on |
|-------|---------------|--------------------|
| components | plugins (Observe<Data>, void actions), types | services |
| plugins | services, types, other plugins | — |
| services | other services, types | components, plugins |
| types | other types | everything else |

**Never:** components → services | services → components/plugins | types → anything except types

---

## components

UI components or elements (also called "elements").

**From plugins:** only Observe<Data> for reactive re-renders and void-returning action functions.

## plugins (if using @adobe/data/ecs for state)

ECS Database.Plugin declarations. Usually depend on services, types, and other plugins.

## services

Asynchronous data services, each in its own folder. Immutable data only. Adhere to [namespace](../namespace/SKILL.md) guidelines.

**Async patterns only:** Observe<Data>, Promise<Data>, AsyncGenerator<Data>, void actions.

**External code** depends only on interfaces, never on implementations.

## types

Pure functional types and associated pure functions. Adhere to [namespace](../namespace/SKILL.md) guidelines.

## Nested structure

When a component has implementation-specific sub-parts, mirror the root structure inside it:

```
components/my-component/
  components/
  plugins/
  types/
```

---

## Execute

When adding or moving code:
1. Place it in the correct layer (components, plugins, services, types).
2. Check dependencies against the table above.
3. Fix any violations (e.g., components importing services).
