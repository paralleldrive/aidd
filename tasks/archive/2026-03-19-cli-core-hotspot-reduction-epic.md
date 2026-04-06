# CLI Core Hotspot Reduction Epic

**Status**: ✅ COMPLETE

## Context

`lib/cli-core.js` is the 2nd highest hotspot in the codebase (score: 25,674, complexity: 22). PR #161 added aidd-custom setup functionality directly to this file, increasing LOC by 40 lines. This violates architectural best practices for hotspot management.

## Goal

Extract aidd-custom setup functions to a dedicated subfolder to:
- Reduce LOC in hotspot file
- Improve separation of concerns
- Enable independent evolution of aidd-custom functionality
- Follow colocation principle for tests

## Requirements

### Functional Requirements

- **Given** aidd-custom setup functions exist in cli-core.js, **should** be extracted to dedicated `lib/aidd-custom/setup.js` module
- **Given** aidd-custom tests exist in cli-core.test.js, **should** be colocated in `lib/aidd-custom/setup.test.js`
- **Given** functions are exported from cli-core, **should** maintain same export interface after refactoring
- **Given** type definitions exist in cli-core.d.ts, **should** be extracted to `lib/aidd-custom/setup.d.ts`
- **Given** cli-core imports these functions, **should** import from new module location
- **Given** all tests pass before refactoring, **should** pass after refactoring
- **Given** user runs with --dry-run flag, **should** display status for both aidd-custom/config.yml AND aidd-custom/AGENTS.md
- **Given** functions were moved to `lib/aidd-custom/setup.js`, **should** update CHANGELOG.md to reference correct module location instead of `lib/cli-core.js`
- **Given** a successful non–dry-run clone reaches the agent setup phase, **should** run the same AGENTS.md, aidd-custom scaffold, and index generation steps as before the refactor (observable files and content under `targetBase`)

### Non-Functional Requirements

- Zero behavior changes (pure refactoring)
- All existing tests must pass
- Import paths updated throughout codebase
- Type safety maintained

## Files Affected

**To be created:**
- `lib/aidd-custom/setup.js` (~65 lines extracted)
- `lib/aidd-custom/setup.test.js` (~110 lines extracted)
- `lib/aidd-custom/setup.d.ts` (type definitions)

**To be modified:**
- `lib/cli-core.js` (remove ~65 lines, add import)
- `lib/cli-core.test.js` (remove ~110 lines)
- `lib/cli-core.d.ts` (remove or re-export types)

## Success Criteria

- ✅ `lib/cli-core.js` reduced by ~60 lines
- ✅ `lib/cli-core.test.js` reduced by ~110 lines
- ✅ All 397 tests pass
- ✅ Exports maintained (no breaking changes)
- ✅ Type checking passes
- ✅ Linting passes

## Tasks

- [x] Write failing test expecting imports from new location
- [x] Create `lib/aidd-custom/` directory
- [x] Extract functions to `lib/aidd-custom/setup.js`
- [x] Extract tests to `lib/aidd-custom/setup.test.js`
- [x] Create `lib/aidd-custom/setup.d.ts`
- [x] Update imports in `lib/cli-core.js`
- [x] Update exports/types in `lib/cli-core.d.ts`
- [x] Extract agent setup orchestration to `lib/agents-setup.js`
- [x] Update test patterns to use createTempDir
- [x] Add dry-run output for AGENTS.md
- [x] Fix CHANGELOG module references
- [x] Verify all tests pass (402 passing)
- [x] Run lint and type check (all passing)
- [x] Commit changes (all pushed)

## Results

- cli-core.js: 388 → 307 lines (-21%)
- cli-core.js complexity: 23 → 16 (-30%)
- cli-core.test.js: 287 → 101 lines (-65%)
- New modules: lib/aidd-custom/setup.js, lib/agents-setup.js
- All 402 tests passing
