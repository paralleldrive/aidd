# aidd-ecs

Enforces best practices for `@adobe/data/ecs` Database.Plugin authoring,
covering composition, property ordering, and naming conventions.

## Why

`Database.Plugin.create()` enforces a strict property order at runtime. Getting
it wrong throws immediately. This skill ensures plugins are authored correctly
the first time.

## Usage

Invoke `/aidd-ecs` when creating or modifying Database.Plugin definitions. The
skill enforces the required property order (`extends`, `services`, `components`,
`resources`, `archetypes`, `computed`, `transactions`, `actions`, `systems`) and
guides composition via `Database.Plugin.combine()`.

Files: `*-plugin.ts` (kebab-case). Exports: `*Plugin` (camelCase).

## When to use

- Creating or modifying `Database.Plugin` definitions
- Working with ECS components, resources, transactions, actions, systems, or services
- Any file that imports `@adobe/data/ecs`
