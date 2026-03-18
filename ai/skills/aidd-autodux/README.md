# aidd-autodux — Redux State Management Reference

`/aidd-autodux` creates and transpiles Autodux Redux state management dux objects,
providing a concise SudoLang-based authoring experience for Redux reducers, action
creators, and selectors.

## Why Autodux

Redux boilerplate — action types, action creators, reducers, selectors — is
repetitive and error-prone. Autodux lets you define a single `Dux` object in
SudoLang that captures all the essential state management concerns, then transpile
it to clean, functional JavaScript.

## Usage

### Define a Dux object

Describe your state slice in SudoLang format, specifying initial state, slice name,
actions, and selectors:

```sudolang
MyDux {
  initialState = { count: 0 }
  slice = "counter"
  actions = [increment, decrement, reset]
  selectors = [getCount]
}
```

### Transpile to JavaScript

```
MyDux |> transpile(JavaScript)
```

This produces separate files for the dux (reducer + actions + selectors), store,
container component, presentation component, and tests.

## Commands

| Command | Description |
| --- | --- |
| `/help` | Explain how to use Autodux and list commands |
| `/example` | Show example SudoLang source (see `/aidd-redux-example`) |
| `/save` | Return the Dux in SudoLang format |
| `/test cases` | List test cases in SudoLang format |
| `/add [prop] [value]` | Add a property to the Dux object |
| `/transpile` | Transpile Dux to JavaScript |

## Key conventions

- **Action types**: `"$slice/$actionName"` — defined inline, never as constants
- **Action creators**: arrow functions, default payload to `{}`, non-deterministic
  values (IDs, timestamps) generated in parameter position
- **Selectors**: select via `state[slice].*`, tested through the reducer (not in isolation)
- **Tests**: use RITEway assertions, set up state via reducer + action creators,
  read state via selectors only
- **File naming**: all-lowercase kebab-case with `-component`, `-dux`, `-container`
  extensions, all ending in `.js`

## When to use `/aidd-autodux`

- Building Redux state management for a new feature
- Defining reducers, action creators, or selectors
- You want a concise, spec-driven approach to Redux code
