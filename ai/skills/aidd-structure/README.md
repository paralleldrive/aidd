# aidd-structure — Source Code Structure Reference

`/aidd-structure` enforces source code layering and interdependency rules to
keep the codebase maintainable and predictable.

## Layer hierarchy

```
types ← services ← plugins ← components
```

## Dependency rules

| Layer | May depend on | Must not depend on |
| --- | --- | --- |
| **components** | plugins (Observe, void actions), types | services |
| **plugins** | services, types, other plugins | — |
| **services** | other services, types | components, plugins |
| **types** | other types | everything else |

## Layer responsibilities

- **components** — UI elements. From plugins: only `Observe<Data>` for reactive
  re-renders and void-returning action functions.
- **plugins** — ECS `Database.Plugin` declarations. Depend on services, types,
  and other plugins.
- **services** — Asynchronous data services. Immutable data only. External code
  depends on interfaces, never implementations.
- **types** — Pure functional types and associated pure functions.

## Nested structure

When a component has implementation-specific sub-parts, mirror the root structure:

```
components/my-component/
  components/
  plugins/
  types/
```

## When to use `/aidd-structure`

- Creating folders or moving files
- Adding imports between modules
- Planning module architecture or reviewing dependency violations
