---
name: aidd-data
description: defines data modelling best practices. Use whenever we are defining data types in typescript or javascript, using `type` or `interface`.
---

# Independent Data

The information that we would use to save the current state of an application.
This data should always be modelled simply, easy to write, easy to read, without redundancy, without containing anything which could be computed and should avoid allowing invalid states but not at the expense of simplicity.

# Dependent Data

Can be deterministically derived directly or indirectly from "Independent Data".

# General Data Rules

Prefer simple, readonly JSON values as they are easy to inspect, serialize and deserialize.

Use simple, descriptive, readable camelCase names for properties on objects.

Use `null` to indicate empty or default values.

Prefer types which disallow invalid states.

## Variant sets and exhaustive maps

Use one canonical union per concept. For anything that exists per variant (settings, counts, labels), prefer `Record<ThatUnion, V>` so adding a variant forces new fields or values—**exhaustive keys** / a **total map** over the variant set. Tie outcomes to that same union (e.g. `{ type: "win"; winner: PlayerMark } | { type: "draw" }`) instead of introducing a second parallel union with different spellings for the same variants (e.g. `"X" | "O"` for marks and `"xWins" | "oWins"`).

If you must model large binary information then use a Blob.

Anything other than that should never be used for either independent or dependent data.

For performance reasons we may use other classes such as typed buffers, Sets or Maps within particular algorithms, but the external inputs and outputs from those algorithms should be standard data.

Prefer arrays or tuples over objects if the indices are integers starting at 0 and have no gaps.

## Example Types

type Vec3 = readonly [number, number, number]
type Line3 = { readonly a: Vec3, readonly b: Vec3 }
type User = { readonly id: number, readonly name: string }

type UserTypes = "normal" | "premium"
type UserSettings = Record<UserTypes, { featureOne: boolean, featureTwo: boolean }>

## Example Function

// data in, data out
function removeDuplicates<T>(input: readonly T[]): readonly T[] {
    // Set used internally for performance but doesn't escape function
    return [...new Set(input)]
}