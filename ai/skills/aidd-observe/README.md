# aidd-observe

Enforces best practices for the `Observe<T>` reactive pattern from
`@adobe/data/observe` — the foundation for reactive data flow in services and
UI components.

## Why

`Observe<T>` provides a lightweight, composable subscription model. Consistent
use of creation and transformation helpers keeps reactive code predictable and
avoids subscription leaks.

## Usage

Invoke `/aidd-observe` when working with observables. Key helpers:

- **Create**: `Observe.fromConstant`, `Observe.fromProperties`,
  `Observe.fromPromise`, `Observe.createState`
- **Transform**: `Observe.withMap`, `Observe.withFilter`,
  `Observe.withDefault`, `Observe.withLazy`
- **Convert**: `Observe.toPromise`

Always call `unobserve()` on cleanup (e.g., component unmount).

## When to use

- Working with observables or reactive data flow
- Creating derived or computed observables
- Using Observe helpers in services or components
