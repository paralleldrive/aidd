# aidd-namespace

Ensures types and related functions are authored in a modular, discoverable,
tree-shakeable namespace pattern.

## Why

Colocating a type with its associated functions in a namespace folder makes
the API discoverable via autocomplete and ensures unused functions are
tree-shaken at build time.

## Usage

Invoke `/aidd-namespace` with a file containing a type and its functions. The
skill restructures it into a namespace folder:

```
src/types/point.ts          →  src/types/point/point.ts    (type + re-export)
                                src/types/point/public.ts   (barrel)
                                src/types/point/length.ts   (one function per file)
                                src/types/point/add.ts
```

## When to use

- Creating types with associated functions
- Refactoring type folders into the namespace pattern
- Defining schemas or imports for types
