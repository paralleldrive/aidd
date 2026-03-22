# aidd-react

Enforces React component authoring best practices using the binding component /
presentation split and `useObservableValues` from `@adobe/data-react`.

## Why

Separating data binding from pure rendering keeps components small, testable,
and predictable. Binding components handle reactive subscriptions;
presentations are pure functions that receive data and action callbacks as
props.

## Usage

Invoke `/aidd-react` when creating or modifying React components. Binding
components call `useDatabase` for the single service context and use one
`useObservableValues` call. Presentations export only `render` and are the
unit-tested layer. Action callbacks use `verbNoun` semantics, not
`onClick`/`onToggle` style.

## When to use

- Creating or modifying React components
- Working with binding components, presentations, or `useObservableValues`
- Using reactive binding or action callback patterns
