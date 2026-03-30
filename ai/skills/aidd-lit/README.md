# aidd-lit

Enforces Lit element authoring best practices with the binding element /
presentation split and `DatabaseElement` extension.

## Why

Separating data binding from pure rendering keeps Lit elements small, testable,
and predictable. Binding elements handle reactive subscriptions via
`useObservableValues`; presentations are pure functions that receive data and
action callbacks as props.

## Usage

Invoke `/aidd-lit` when creating or modifying Lit elements. Binding elements
extend `DatabaseElement<typeof myPlugin>` and use a single
`useObservableValues` call. Presentations export only `render` and are the
unit-tested layer. Action callbacks use `verbNoun` semantics, not
`onClick`/`onToggle` style.

## When to use

- Creating or modifying Lit elements
- Working with binding elements, presentations, or `DatabaseElement`
- Using `useObservableValues` or reactive binding patterns
