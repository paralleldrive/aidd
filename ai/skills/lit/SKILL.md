---
name: lit
description: Enforces Lit element authoring best practices. Use when creating Lit elements, binding elements, presentations, DatabaseElement, useObservableValues, or when the user asks about Lit UI patterns, reactive binding, or action callbacks.
---

# Lit element authoring

Lit elements live in the `components/` layer per [structure](../structure/SKILL.md). Consume Observe and void actions from plugins per [service](../service/SKILL.md).

---

## Extending DatabaseElement

Binding elements extend `DatabaseElement<typeof myPlugin>` — either directly or via an intermediate base class. The required plugin must be specified in the generic.

This ensures the plugin's services are extended onto the main database **before** the element renders, so `this.service` exposes the correct Observe APIs and actions.

```ts
// Direct
export class HelloWorldElement extends DatabaseElement<typeof helloWorldPlugin> {
  get plugin() { return helloWorldPlugin; }
}

// Indirect — base extends DatabaseElement, leaf specifies plugin
export class LayoutElement<T extends MyApplicationPlugin = MyApplicationPlugin> extends CoreApplicationElement<T> { }
export class ToolbarElement extends LayoutElement<typeof toolbarPlugin> { }
```

---

## Binding element vs presentation

**Binding element** — the Lit custom element that:
- Injects observed values via `useObservableValues`
- Triggers re-render when those values change
- Binds action callbacks to the presentation

**Presentation** — a pure function (no hooks) that receives data and action callbacks as props and returns a `TemplateResult`. Keep reactive logic in the binding element; presentation stays pure.

---

## Testing

**Presentation** — add a corresponding `*.test.ts` when appropriate. Unit test the presentation.

**Binding element** — not unit tested. Binding elements contain no business logic; they use computed values from a Database service (already unit tested).

---

## useObservableValues

*Most* binding elements use a **single** `useObservableValues` call. Collect all observed values in one object.

**Observe only what you need** — the minimal values required for rendering. For values that may resolve slowly, wrap with `Observe.withDefault` so you can render a skeleton (or placeholder) immediately while waiting. See [observe](../observe/SKILL.md).

```ts
render() {
  const values = useObservableValues(() => ({
    visible: this.service.actions.isViewVisible(name),
    userProfile: this.service.services.authentication.userProfile,
  }));
  if (!values) return;

  return presentation.render({ ...values, toggleView: () => this.toggleView(name) });
}
```

---

## Presentation exports

Presentation files ONLY export `render` (and `unlocalized` bundles where appropriate). Nothing else is ever exported from a presentation file. Not even the type of the render args (which should be a single object with named values). If you need them externally for storybook or testing, use `Parameters<typeof render>[0]`.

---

## Action callbacks (not events)

Presentation callbacks **are** action calls, not events. Use **verbNoun** semantics — not `onClick`/`onToggle`/`onSignOut` style.

- The binding element passes action callbacks (e.g. `toggleView`, `signOut`) as props
- The presentation invokes them when the user intent occurs
- The callback is the action — it calls the service/transaction directly

```ts
// Binding element: binds the action (verbNoun)
toggleView: () => this.toggleToolbarChild(name)

// Presentation: receives and invokes when user acts
item.toggleView()
```

---

## Lit properties

**Almost never** use `@property` on binding elements.

**Exception:** Use properties ONLY when needed to bind to the correct entity in the database — e.g. `entity` for table rows, `layer` for view hosts. Multiple instances of the same element need a property to identify which entity they represent.

**Single-instance elements** have no properties. They observe values directly; re-render only when those values change.

---

## Execute

When creating or modifying a Lit element:
1. Extend `DatabaseElement<typeof myPlugin>` (directly or indirectly) with the required plugin specified. Ensures plugin services are available before render.
2. Split into binding element (reactive) and presentation (pure).
3. Use a single `useObservableValues` in the binding element. Observe only minimal values; use `Observe.withDefault` for slow-resolving values.
4. Pass observed values and action callbacks to presentation.
5. Keep presentation pure — no hooks.
6. Add `@property` only when entity binding requires it (multiple instances).
7. Presentation exports only `render` (and localization bundles where appropriate).
8. Add `*-presentation.test.ts` for presentation when appropriate; do not unit test binding elements.
9. Never include business logic within binding elements. Move into computed values or action handlers so they can be tested in isolation and reused.
10. Good binding elements should be extremely small, call them out otherwise.
