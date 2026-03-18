# aidd-sudolang-syntax — SudoLang Syntax Reference

`/aidd-sudolang-syntax` is a quick cheat sheet for SudoLang — the pseudocode
language used throughout AIDD skill definitions and dux object authoring.

## Interfaces

```sudolang
User {
  id: String
  displayName
  preferences
}
```

Properties can specify types or leave them inferred. Nested interfaces compose
naturally.

## Constraints

Inline or block form:

```sudolang
constraint: can be specified inline

Constraints {
  A constraint
  Another constraint
}
```

## Functions

```sudolang
fn foo();                    // inferred function
function bar();              // also valid

fn foo() {                   // with body
  Constraints {
    a constraint
  }
  for each (foo) bar()
}

anotherFunction() {          // block form can omit fn/function
  require user to be signed in
}
```

### Function modifiers

```sudolang
function simple():modifier = value

doSomethingMultiLine():{
  format = numbered markdown list
  this is a constraint
}
```

## Template strings

```sudolang
"foo $bar"
`foo $bar`
["nested $template"]
```

Avoid single quotes — they conflict with natural language apostrophes.

## Operators

- Logical: `&&`, `||`, `xor`, `!`
- Math: `+`, `-`, `*`, `/`, `^`, `%`
- Comparison: `==`, `!=`, `>`, `>=`, `<`, `<=`
- Set: `intersection`, `union`
- Pipe: `rawData |> normalize |> filter |> sort`
- Ternary: `access = if (condition) "granted" else "denied"`

## When to use `/aidd-sudolang-syntax`

- Writing or reading SudoLang pseudocode in skill definitions
- Authoring Autodux dux objects in SudoLang format
