# agents-md TypeScript Declarations Epic

**Status**: 🔧 IN PROGRESS
**Goal**: Keep `lib/agents-md.d.ts` in sync with the runtime exports of `lib/agents-md.js`.

## Overview

After the `appendDirectives` function was refactored to accept a third
`missingDirectives` parameter, and `DIRECTIVE_APPEND_SECTIONS` was added as an
exported constant, the TypeScript declaration file was not updated. This
creates two categories of bugs for TypeScript consumers:

1. **Silent runtime crash**: A caller who relies on the old two-argument
   signature will pass `undefined` as `missingDirectives`, causing a `TypeError`
   when the function calls `missingDirectives.map(...)`.
2. **Missing constant**: `DIRECTIVE_APPEND_SECTIONS` is invisible to TypeScript
   consumers, preventing them from using or extending the section table.

---

## Fix `appendDirectives` type signature

Update the declared signature to require the third parameter.

**Requirements**:
- Given `appendDirectives` is declared in `lib/agents-md.d.ts`, should include
  `missingDirectives: string[]` as a required third parameter so TypeScript
  callers cannot omit it.

---

## Export `DIRECTIVE_APPEND_SECTIONS` in type declarations

Add the missing constant declaration to `lib/agents-md.d.ts`.

**Requirements**:
- Given `DIRECTIVE_APPEND_SECTIONS` is exported from `lib/agents-md.js`, should
  be declared in `lib/agents-md.d.ts` with the correct shape
  `ReadonlyArray<{ content: string; keywords: readonly string[] }>` so
  TypeScript consumers can import and use it.

---

## Test coverage for `appendDirectives`

Add direct unit tests for `appendDirectives` that exercise the three-argument
signature.

**Requirements**:
- Given `appendDirectives` is called with `targetBase`, `existingContent`, and
  `missingDirectives`, should append only the sections whose keywords match an
  entry in `missingDirectives`.
- Given `appendDirectives` is called with an empty `missingDirectives` array,
  should append a block with no section content (i.e. sections string is empty).

---

## Pre-commit sync of AGENTS.md and CLAUDE.md

Keep `AGENTS.md` and `CLAUDE.md` at the repo root in sync with the current
`agentsMdContent` template so they never drift silently between manual `npx aidd`
runs.

**Requirements**:
- Given a developer commits to this repo, should regenerate `AGENTS.md` and
  `CLAUDE.md` from `agentsMdContent` if either file's content differs from the
  template.
- Given `AGENTS.md` or `CLAUDE.md` does not exist, should create it with
  `agentsMdContent`.
- Given `AGENTS.md` or `CLAUDE.md` already matches `agentsMdContent` exactly,
  should leave it unchanged (no unnecessary write or stage).
- Given the pre-commit hook runs `node bin/aidd.js --index`, should automatically
  stage any regenerated `AGENTS.md` or `CLAUDE.md`.
