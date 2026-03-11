---
name: aidd-structure
description: Enforces source code structuring and interdependency best practices. Use when creating folders, moving files, adding imports, or when the user asks about architecture, layering, or module dependencies.
---

# File naming

Use lowercase filenames (e.g. `app.tsx`, `counter.tsx`, `counter-presentation.tsx`). When changing case of tracked files on case-insensitive filesystems, use a two-step rename: `git mv old.tsx temp.tsx && git mv temp.tsx new.tsx`.

# Barrel exports

Avoid `index.ts` / `index.js` barrel files. Prefer direct imports (e.g. `from "./components/counter/counter"`). Barrels add indirection, hurt tree-shaking, and create extra maintenance when renaming or removing exports.

# Standard folders

src/
├── components/
├── state/
└── types/

## Allowed Dependencies
components -> state, types
state -> types

if using typescript projects enforce with [aidd-ts-projects](../aidd-ts-projects/)

## UI Components
Sometimes named "elements"

if Lit-based then refer to [aidd-lit](../aidd-lit/SKILL.md)
if React-based then refer to [aidd-react](../aidd-react/SKILL.md)

composed of {
  binding element/function with constaints {
    - observes minimal application state needed to render
    - rerenders on changes
    - calls presentation function with {
      - current observed values
      - minimal action closures that are bound to application actions
    }
    - NEVER contains business logic, state or side effects
    - NEVER unit tested
    - NEVER uses returned results from called actions. They are fire and forget, ensuring bi-directional data flow to application state.
  }
  pure presentation function with constraints {
    - only accepts {
      - current, pure data values
      - action callbacks
    }
    - does not contain any "hooks"*
    - should only be unit tested if it contains non-trivial rendering logic and the user asks for it. No TDD.
    - NEVER exports anything except for 'render' function and optionally 'unlocalized' message bundle. If signature needed for unit testing, use `Parameters<typeof render>`
  }
}

*extremely rare cases for maximum performance may observe data and directly mutate the DOM in response

## Application State

preferred techs in order: [
  @adobe/data/ecs [aidd-ecs](../aidd-ecs/SKILL.md)
  autodux
  redux
  useState
]

data access should be reactive based upon observation/subscription and minimal. See [aidd-observe](../aidd-observe/SKILL.md)

may contain {
  - reactively observable {
    - independent state
    - computed (dependent) state
  }
  - atomic transactions between two valid states
  - ECS systems or other dynamic behavior
  - io service interactions
  - initialization logic
  - business logic but STRONGLY preferred to exist in functional types and just be invoked from here.
}

## functional types
folder named in order of preference "types"

if using typescript then Adhere to [namespace](../aidd-namespace/SKILL.md) guidelines.

may contain {
  - pure data types: immutable, readonly fields, JSON Values or Blobs: {
    - use `type` for these and NEVER `interface`
  }
  - other types: always prefer pure functional patterns with readonly inputs and outputs.
  - purely semantic types such as `type Id: string`
  - service interfaces. See [aidd-service](../aidd-service/SKILL.md)
  - associated utility declarations per [namespace](../aidd-namespace/SKILL.md) pattern
}


## Nested structure

**When to recurse:** Only when complexity warrants it—e.g. multiple sub-components with their own state/types, or a distinct feature area that would clutter the root. Do NOT recurse for simple components (e.g. small game board, single-purpose UI). Start flat; add nesting when the sub-feature grows.

When recursing, mirror the root structure:

```
components/my-component/
  components/
  state/
  types/
```

---

## Execute

```sudolang
fn whenAddingOrMovingCode() {
  Constraints {
    Place code in the correct layer (components, state, types)
    Check dependencies against the dependency rules
    Fix any violations (e.g. types importing components or state)
  }
}
```
