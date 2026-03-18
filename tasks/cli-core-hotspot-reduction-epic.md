# CLI Core Hotspot Reduction Epic

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

- [ ] Write failing test expecting imports from new location
- [ ] Create `lib/aidd-custom/` directory
- [ ] Extract functions to `lib/aidd-custom/setup.js`
- [ ] Extract tests to `lib/aidd-custom/setup.test.js`
- [ ] Create `lib/aidd-custom/setup.d.ts`
- [ ] Update imports in `lib/cli-core.js`
- [ ] Update exports/types in `lib/cli-core.d.ts`
- [ ] Verify all tests pass
- [ ] Run lint and type check
- [ ] Commit changes
