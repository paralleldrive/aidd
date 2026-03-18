# aidd-observe — Observe Pattern Reference

`/aidd-observe` enforces best practices for the `Observe<T>` reactive pattern
from `@adobe/data/observe` — the foundation for reactive data flow in services
and UI components.

## What is Observe

`Observe<T>` is a subscription function:

```ts
(notify: (value: T) => void) => Unobserve
```

The callback may fire synchronously or asynchronously, zero or more times.
Call the returned `Unobserve` function to stop observing.

## Creation helpers

| Helper | Purpose |
| --- | --- |
| `Observe.fromConstant(value)` | Static value as observable |
| `Observe.fromProperties({ a, b })` | Combine named observables |
| `Observe.fromArray([obs1, obs2])` | Combine array of observables |
| `Observe.fromPromise(() => Promise)` | Lazy, notifies once on resolve |
| `Observe.createState(initial?)` | `[Observe<T>, setter]` — mutable state |

## Transformation helpers

| Helper | Purpose |
| --- | --- |
| `Observe.withMap(obs, fn)` | Transform value |
| `Observe.withFilter(obs, fn)` | Transform/filter; return `undefined` to skip |
| `Observe.withDefault(default, obs)` | Fallback when value is undefined |
| `Observe.withLazy(() => obs)` | Defer creation until first subscription |

## Conversion

| Helper | Purpose |
| --- | --- |
| `Observe.toPromise(obs)` | Resolve with first value (one-shot) |

## Common patterns

```ts
// Derived observable from service
const isDev = Observe.withMap(service.type, (t) => t === "development");

// Computed from multiple resources
const max = Observe.withFilter(
  Observe.fromProperties({ a: db.observe.resources.a, b: db.observe.resources.b }),
  ({ a, b }) => Math.max(a, b)
);
```

## Rules

1. Use `Observe.fromConstant` for static values
2. Use `Observe.fromProperties` to combine multiple observables
3. Use `Observe.withFilter` when mapping and/or filtering
4. Use `Observe.createState` for mutable state with a setter
5. Always call `unobserve()` on cleanup (e.g., component unmount)

## When to use `/aidd-observe`

- Working with observables or reactive data flow
- Creating derived or computed observables
- Using `Observe.withMap`, `Observe.withFilter`, `Observe.fromProperties`, etc.
