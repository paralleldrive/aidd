# aidd-structure

Enforces source code layering and interdependency rules to keep the codebase
maintainable and predictable.

## Why

Unchecked dependencies create circular imports and tangled modules. A strict
layer hierarchy — `types ← services ← plugins ← components` — ensures each
layer depends only on the layers below it.

## Usage

Invoke `/aidd-structure` when creating folders, moving files, or adding
imports. Components may depend on plugins (Observe, void actions) and types but
never on services directly. Services depend on other services and types.
Types depend only on other types.

## When to use

- Creating folders or moving files
- Adding imports between modules
- Planning module architecture or reviewing dependency violations
