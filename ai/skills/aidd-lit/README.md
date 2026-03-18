# aidd-lit — Lit Element Authoring Reference

`/aidd-lit` enforces best practices for Lit element authoring, covering the
binding element / presentation split, `useObservableValues`, action callbacks,
and `DatabaseElement` extension.

## Extending DatabaseElement

Binding elements extend `DatabaseElement<typeof myPlugin>` — either directly or
via an intermediate base class. The plugin generic ensures services are extended
onto the database before the element renders.

```ts
export class HelloWorldElement extends DatabaseElement<typeof helloWorldPlugin> {
  get plugin() {
    return helloWorldPlugin;
  }
}
```

## Binding element vs presentation

| Concern | Binding element | Presentation |
| --- | --- | --- |
| Type | Class extending DatabaseElement | Pure function (no hooks) |
| Receives | Observed values via `useObservableValues` | Data and action callbacks as props |
| Returns | Delegates to presentation | `TemplateResult` |
| Logic | Minimal — reactive binding only | None — pure rendering |

## useObservableValues

Most binding elements use a **single** `useObservableValues` call. Observe only
the minimal values required for rendering. Use `Observe.withDefault` for
slow-resolving values.

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

## Action callbacks

- Semantics are `verbNoun` — not `onClick`/`onToggle` style
- Binding element passes action callbacks as props
- Presentation invokes them on user intent

## Key rules

- Presentation files export **only** `render` (and localization bundles)
- Use `@property` only when needed to bind to a specific entity (e.g., table rows)
- Unit test presentations (`*.test.ts`), not binding elements
- Keep binding elements extremely small — no business logic

## When to use `/aidd-lit`

- Creating or modifying Lit elements
- Working with binding elements, presentations, or `DatabaseElement`
- Using `useObservableValues` or reactive binding patterns
