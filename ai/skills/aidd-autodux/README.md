# aidd-autodux

Creates and transpiles Autodux Redux state management dux objects using a
concise SudoLang-based authoring experience.

## Why

Redux boilerplate — action types, action creators, reducers, selectors — is
repetitive and error-prone. Autodux lets you define a single `Dux` object in
SudoLang that captures all state management concerns, then transpile it to
clean, functional JavaScript.

## Usage

Define a Dux object in SudoLang, then transpile:

```sudolang
MyDux {
  initialState = { count: 0 }
  slice = "counter"
  actions = [increment, decrement, reset]
  selectors = [getCount]
}
```

Commands: `/help`, `/example`, `/save`, `/test cases`, `/add [prop] [value]`,
`/transpile`.

## When to use

- Building Redux state management for a new feature
- Defining reducers, action creators, or selectors
