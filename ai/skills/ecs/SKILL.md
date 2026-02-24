---
name: ecs
description: Enforces @adobe/data/ecs best practices. Use this whenever @adobe/data/ecs is imported, when creating or modifying Database.Plugin definitions, or when working with ECS components, resources, transactions, actions, systems, or services.
---

# Database.Plugin authoring

Plugins are created with `Database.Plugin.create()` from `@adobe/data/ecs`.

## Property order (enforced at runtime)

Properties **must** appear in this exact order. All are optional.

| # | Property | Signature | Purpose |
|---|----------|-----------|---------|
| 1 | `extends` | `Plugin` | Base plugin to extend |
| 2 | `services` | `(db) => ServiceInstance` | Singleton service factories |
| 3 | `components` | schema object | ECS component schemas |
| 4 | `resources` | `{ default: value as Type }` | Global resource schemas |
| 5 | `archetypes` | `['comp1', 'comp2']` | Standard ECS archetypes; storage tables for efficient insertions |
| 6 | `computed` | `(db) => Observe<T>` | Computed observables |
| 7 | `transactions` | `(store, payload) => void` | Synchronous, deterministic atomic mutations |
| 8 | `actions` | `(db, payload) => T` | General functions |
| 9 | `systems` | `{ create: (db) => fn \| void }` | Per-frame (60fps) or init-only |

**Wrong order throws at runtime.** If you define `transactions` before `components`, it will error.

---

## Composition

**Single extension** — one plugin extends another:
```ts
export const authPlugin = Database.Plugin.create({
  extends: environmentPlugin,
  services: {
    auth: db => AuthService.createLazy({ services: db.services }),
  },
});
```

**Combine** — `extends` accepts only one plugin. To extend from multiple use Database.Plugin.combine:
```ts
export const generationPlugin = Database.Plugin.create({
  extends: Database.Plugin.combine(aPlugin, bPlugin),
  computed: {
    max: db => Observe.withFilter(
        Observe.fromProperties({
            a: db.observe.resources.a,
            b: db.observe.resources.b
        }),
        ({ a, b }) => Math.max(a, b)
    )
  },
});
```

**Final composition** — combine all plugins into the app plugin:
```ts
export const studioPlugin = Database.Plugin.combine(
  scheduler, spectrumPlugin, projectDataPlugin,
  authPlugin, uiStatePlugin, generationPlugin
);

export type StudioPlugin = typeof studioPlugin;
export type StudioDatabase = Database.Plugin.ToDatabase<StudioPlugin>;
```

---

## Property details

### services

Factory functions creating singleton services. Extended plugin services initialize first, so `db.services` has access to them.

```ts
services: {
  environment: _db => EnvironmentService.create(),
}
```

### components

Schema objects defining ECS component data. Use schema imports from type namespaces or inline schemas. See [data-modeling.md](data-modeling.md) for a simple example.

```ts
components: {
  layout: Layout.schema,
  layoutElement: { default: null as unknown as HTMLElement, transient: true },
  layoutLayer: F32.schema,
},
```

Non-persistable values (e.g. HTML elements, DOM refs) must use `transient: true` — excluded from serialization.

### resources

Global state not tied to entities. Use `as Type` to provide the compile-time type — without it the value is treated as a const literal. See [data-modeling.md](data-modeling.md) for patterns.

```ts
resources: {
  spectrumColor: { default: 'dark' as SpectrumColor },
  spectrumScale: { default: 'medium' as SpectrumScale },
},
```

Use `null as unknown as Type` for resources initialized later in a system initializer:

```ts
resources: {
  connection: { default: null as unknown as WebSocket },
},
```

### archetypes

Standard ECS archetypes. Used for querying and inserting related components. See [data-modeling.md](data-modeling.md) for a simple example.

```ts
archetypes: {
  Layout: ['layout', 'layoutElement', 'layoutLayer'],
},
```

### computed

Factory returning `Observe<T>` or `(...args) => Observe<T>`. Receives full db.

```ts
computed: {
  max: db => Observe.withFilter(
    Observe.fromProperties({
      a: db.observe.resources.a,
      b: db.observe.resources.b,
    }),
    ({ a, b }) => Math.max(a, b)
  ),
},
```

### transactions

Synchronous, deterministic atomic mutations. Receive `store` and a payload. Store allows direct, immediate mutation of all entities, components, and resources.

```ts
transactions: {
  updateLayout: (store, { entity, layout }: { entity: Entity; layout: Layout }) => {
    store.update(entity, { layout });
  },
  setSpectrumColor: (store, color: SpectrumColor) => {
    store.resources.spectrumColor = color;
  },
},
```

- `store.update(entity, data)` — update entity components
- `store.resources.x = value` — mutate resources
- `store.get(entity, 'component')` — read component value
- `store.read(entity)` - read all entity component values
- `store.read(entity, archetype)` - read entity component values in archetype
- `store.select(archetype.components, { where })` — query entities

### actions

General functions with access to the full db. Can return anything or nothing.
UI components that call actions MUST never consume returned values — call for side effects only. Consuming return values violates unidirectional flow (data down via Observe, actions up as void).
Call at most one transaction per action; multiple transactions corrupt the undo/redo stack.

```ts
actions: {
  generateNewName: async (db) => {
    const generatedName = await db.services.nameGenerator.generateName();
    db.transactions.setName(generatedName);
  },
  getAuth: db => db.services.auth,
},
```

### systems

`create` receives db and may optionally return a per-frame function (60fps) or just initialize values. Always called synchronously when `database.extend(plugin)` runs.

```ts
systems: {
  ui_state_plugin_initialize: {
    create: db => {
      db.transactions.registerViews(views);
    },
  },
  layout_plugin__system: {
    create: db => {
      const observer = new ResizeObserver(/* ... */);
      Database.observeSelectDeep(db, db.archetypes.Layout.components)(entries => {
        // react to entity changes
      });
    },
  },
},
```

**System scheduling** (optional):
```ts
systems: {
  physics: {
    create: db => () => { /* per-tick work */ },
    schedule: {
      before: ['render'],
      after: ['input'],
      during: ['simulation'],
    },
  },
},
```

- `before` / `after` — hard ordering constraints
- `during` — soft preference for same execution tier

---

## Naming conventions

| Item | Convention | Example |
|------|-----------|---------|
| File | `*-plugin.ts` (kebab-case) | `layout-plugin.ts` |
| Export | `*Plugin` (camelCase) | `layoutPlugin` |
| System | `plugin_name__system` (snake_case, double underscore) | `layout_plugin__system` |
| Init system | `plugin_name_initialize` | `ui_state_plugin_initialize` |

---

## Type utilities

```ts
export type MyDatabase = Database.Plugin.ToDatabase<typeof myPlugin>;
export type MyStore = Database.Plugin.ToStore<typeof myPlugin>;
```

---

## Execute

When creating or modifying a plugin:
1. Verify property order matches the table (extends, services, components, resources, archetypes, computed, transactions, actions, systems).
2. Use `extends` for single-parent, `Database.Plugin.combine()` for multiple peers.
3. Ensure services only access `db.services` from extended plugins (not forward references).
4. Export `type *Database = Database.Plugin.ToDatabase<typeof *Plugin>` when consumers need typed db access.
5. Follow naming conventions for files, exports, and systems.

## Additional resources

- [data-modeling.md](data-modeling.md) — Components, resources, and archetypes (particle simulation example)
