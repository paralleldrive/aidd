# aidd-react — React Component Authoring Reference

`/aidd-react` enforces React component authoring best practices using the
binding component / presentation split, `useObservableValues` from
`@adobe/data-react`, and a single-context architecture.

## useDatabase — single context

Binding components **must** call `useDatabase` to obtain the main service context.
Do not access any other React context — additional contexts create a context
waterfall and hurt performance. All services and state are reachable from the
database (`db.services`, `db.observe`, `db.transactions`).

## Binding component vs presentation

| Concern | Binding component | Presentation |
| --- | --- | --- |
| Type | React component with hooks | Pure function (no hooks) |
| Receives | Observed values via `useObservableValues` | Data and action callbacks as props |
| Returns | Delegates to presentation | JSX |
| Logic | Minimal — reactive binding only | None — pure rendering |

## useObservableValues

Most binding components use a **single** `useObservableValues` call. Observe only
the minimal values required for rendering. Use `Observe.withDefault` for
slow-resolving values.

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

## Props from parent

Only pass props when needed to identify which database entity to bind to (e.g.,
`entity` for table rows). Single-instance components observe values directly.

## Action callbacks

- Semantics are `verbNoun` — not `onClick`/`onToggle` style
- Pass function references directly when the signature matches
- Wrap only when you need to supply arguments

## Key rules

- Presentation files export **only** `render` (and localization bundles)
- Unit test presentations (`*-presentation.test.tsx`), not binding components
- Keep binding components extremely small — no business logic

## When to use `/aidd-react`

- Creating or modifying React components
- Working with binding components, presentations, or `useObservableValues`
- Using reactive binding or action callback patterns
