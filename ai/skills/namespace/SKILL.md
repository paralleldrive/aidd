---
name: namespace
description: Ensures types and related functions are authored and consumed in a modular, discoverable, tree-shakeable pattern. Use when creating types, refactoring type folders, defining schemas, importing types, or when the user mentions type namespaces, constants, or Schema.ToType.
---

# Type namespace pattern

Single import surface per type: `<type-name>/<type-name>.ts`. Schema in `-schema.ts`, namespace re-export from `public.js`. Types live in the `types/` layer per [structure](../structure/SKILL.md).

## Constant types

| Visibility | Definition |
|------------|------------|
| private | Single-file only, not exported |
| exported | Sole export from eponymous file |
| public | Re-exported from public.ts |
| internal | Exported, not in public.ts |

## Constraints

- `<type-name>/<type-name>.ts` is the only public import surface
- Export a single type alias: `export type <type-name> = <type>`
- Schema-based types: schema in `<type-name>-schema.ts`, named `schema` (not `<type-name>Schema`), derive with `Schema.ToType<typeof schema>`
- Export namespace: `export * as <type-name> from "./public.js"`
- In public.ts, re-export every public constant file

## Consumers

**Never:**
- Import from `public.js` outside the type namespace folder
- Import from `<type-name>-schema.js` outside the type namespace folder

**Do:**
- `import { Volume } from "../../types/volume/volume.js"`
- For schema: `import { PlayerMark } from "../../types/player-mark/player-mark.js"`, then `PlayerMark.schema`

## Extending external types

When authoring helper functions for external types (e.g. String), use `StringX` as the discoverable extension namespace name.

## Schema pattern example

src/types/player-mark/player-mark-schema.ts
```ts
export const schema = { enum: ["X", "O"] } as const;
```

src/types/player-mark/public.ts
```ts
export { schema } from "./player-mark-schema.js";
```

src/types/player-mark/player-mark.ts
```ts
import { Schema } from "@adobe/data/schema";
import { schema } from "./player-mark-schema.js";
export type PlayerMark = Schema.ToType<typeof schema>;
export * as PlayerMark from "./public.js";
```

## Testing

Give each function file its own `<same-name>.test.ts` unit test.

## Execute

1. Identify constants in the current file.
2. Extract them into the standard pattern.
3. Identify all consumers of public namespaces.
4. Check each consumer: ensure imports use `<type-name>.ts` only, never public.js or -schema.js.
5. Ensure unit tests exist per function file, splitting as needed.
