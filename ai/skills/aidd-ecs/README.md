# aidd-ecs — ECS Plugin Authoring Reference

`/aidd-ecs` enforces best practices for `@adobe/data/ecs` Database.Plugin
authoring, covering composition, property ordering, naming conventions, and
type utilities.

## Why this matters

`Database.Plugin.create()` enforces a strict property order at runtime. Getting
it wrong throws immediately. This skill ensures plugins are authored correctly
the first time, with proper composition patterns and naming conventions.

## Plugin property order

Properties **must** appear in this exact order (all optional):

| # | Property | Purpose |
| --- | --- | --- |
| 1 | `extends` | Base plugin to extend |
| 2 | `services` | `(db) => ServiceInstance` — singleton service factories |
| 3 | `components` | Schema objects for ECS component data |
| 4 | `resources` | `{ default: value as Type }` — global resource schemas |
| 5 | `archetypes` | `['comp1', 'comp2']` — standard ECS archetypes |
| 6 | `computed` | `(db) => Observe<T>` — computed observables |
| 7 | `transactions` | `(store, payload) => void` — synchronous atomic mutations |
| 8 | `actions` | `(db, payload) => T` — general functions |
| 9 | `systems` | `{ create: (db) => fn | void }` — per-frame or init-only |

## Composition

- **Single extension**: `extends: parentPlugin`
- **Multiple parents**: `extends: Database.Plugin.combine(pluginA, pluginB)`
- **Final app plugin**: `Database.Plugin.combine(core, theme, data, auth, ui, feature)`

## Naming conventions

| Element | Convention | Example |
| --- | --- | --- |
| File | `*-plugin.ts` (kebab-case) | `layout-plugin.ts` |
| Export | `*Plugin` (camelCase) | `layoutPlugin` |
| System | `plugin_name__system` (snake_case, double underscore) | `layout_plugin__system` |
| Init system | `plugin_name_initialize` | `ui_state_plugin_initialize` |

## Type utilities

```ts
export type MyDatabase = Database.Plugin.ToDatabase<typeof myPlugin>;
export type MyStore = Database.Plugin.ToStore<typeof myPlugin>;
```

## When to use `/aidd-ecs`

- Creating or modifying `Database.Plugin` definitions
- Working with ECS components, resources, transactions, actions, systems, or services
- Any file that imports `@adobe/data/ecs`
