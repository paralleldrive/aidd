---
name: react
description: Enforces React component authoring best practices. Use when creating React components, binding components, presentations, useObservableValues, or when the user asks about React UI patterns, reactive binding, or action callbacks.
---

# React component authoring

React components live in the `components/` layer per [structure](../structure/SKILL.md). Consume Observe and void actions from plugins per [service](../service/SKILL.md). Use `@adobe/data-react` for `useDatabase`, `useObservableValues`, and `DatabaseProvider`.

---

## useDatabase — single context

Binding components **must** call `useDatabase` to obtain the main service context. Do **not** access any other React context. Additional contexts create a context waterfall and hurt performance. All other services and state are reachable from the database — e.g. `db.services`, `db.observe`, `db.transactions` — so a single context is sufficient.

---

## Binding component vs presentation

**Binding component** — the React component that:
- Injects observed values via `useObservableValues`
- Triggers re-render when those values change
- Binds action callbacks to the presentation

**Presentation** — a pure function (no hooks) that receives data and action callbacks as props and returns JSX. Keep reactive logic in the binding component; presentation stays pure.

---

## Props from parent

**Do not** pass values from parent except when needed to identify which entity in the database to bind to.

When multiple instances exist (e.g. table rows), the parent passes an identifying value such as `entity` so the child knows which record to observe.

```tsx
// Parent: passes entity so child knows which record to bind to
{values.sprites.map((entity) => (
  <Sprite key={entity} entity={entity} />
))}

// Child: uses entity prop to observe the right record
function Sprite({ entity }: { entity: Entity }) {
  const db = useDatabase();
  const values = useObservableValues(
    () => ({ sprite: db.observe.entity(entity, db.archetypes.Sprite) }),
    [entity],
  );
  // ...
}
```

---

## useObservableValues

*Most* binding components use a **single** `useObservableValues` call. Collect all observed values in one object.

**Observe only what you need** — the minimal values required for rendering. For values that may resolve slowly, wrap with `Observe.withDefault` so you can render a skeleton (or placeholder) immediately while waiting. See [observe](../observe/SKILL.md).

```tsx
function Counter() {
  const db = useDatabase(counterPlugin);
  const values = useObservableValues(() => ({
    count: db.observe.resources.count,
  }));

  if (!values) return null;
  return presentation.render({ ...values, increment: db.transactions.increment });
}
```

---

## Presentation exports

Presentation files ONLY export `render` (and localization bundles where appropriate). Nothing else. If you need render args type externally (storybook, testing), use `Parameters<typeof render>[0]`.

---

## Action callbacks (not events)

Presentation callbacks **are** action calls, not events. Use **verbNoun** semantics — not `onClick`/`onToggle`/`onSignOut` style.

- The binding component passes action callbacks (e.g. `toggleView`, `signOut`) as props
- The presentation invokes them when the user intent occurs

**Pass function references directly.** All actions are pure functions with no `this` binding. Do not wrap in arrow functions when the signature matches — pass the reference instead.

```tsx
// Binding component: pass the function reference (no arrow wrapper)
increment: db.transactions.increment

// When the action needs arguments, wrap to supply them
toggleSprite: () => db.transactions.toggleSpriteActive({ entity })

// Presentation: receives and invokes when user acts
<button onClick={props.increment}>Increment</button>
```

---

## Testing

**Presentation** — add a corresponding `*.test.tsx` when appropriate. Unit test the presentation.

**Binding component** — not unit tested. Binding components contain no business logic; they use computed values from a Database service (already unit tested).

---

## Execute

When creating or modifying a React component:
1. Call `useDatabase` for the main service context. Do not use any other React context.
2. Split into binding component (reactive) and presentation (pure).
3. Use a single `useObservableValues` in the binding component. Observe only minimal values; use `Observe.withDefault` for slow-resolving values.
4. Pass observed values and action callbacks to presentation. Pass function references directly when the signature matches (actions are pure, no `this`); wrap only when supplying arguments. Pass entity (or other identifying value) from parent only when the child must bind to a specific database record.
5. Keep presentation pure — no hooks.
6. Presentation exports only `render` (and localization bundles where appropriate).
7. Add `*-presentation.test.tsx` for presentation when appropriate; do not unit test binding components.
8. Never include business logic within binding components. Move into computed values or action handlers.
9. Good binding components should be extremely small.
