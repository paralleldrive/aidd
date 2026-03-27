# aidd-sudolang-syntax

Quick cheat sheet for SudoLang — the pseudocode language used throughout AIDD
skill definitions and dux object authoring.

## Why

SudoLang appears in SKILL.md files, Autodux dux objects, and agent prompts.
Familiarity with the syntax makes these artifacts readable and writable.

## Usage

Invoke `/aidd-sudolang-syntax` for a syntax reference. Key constructs:

- **Interfaces**: `User { id: String, displayName }` — types optional
- **Constraints**: inline (`constraint: rule`) or block (`Constraints { ... }`)
- **Functions**: `fn foo()`, `function bar()`, or just `bar() { ... }`
- **Template strings**: `"foo $bar"` or `` `foo $bar` ``
- **Pipe**: `rawData |> normalize |> filter |> sort`
- **Ternary**: `access = if (condition) "granted" else "denied"`

## When to use

- Writing or reading SudoLang pseudocode in skill definitions
- Authoring Autodux dux objects in SudoLang format
