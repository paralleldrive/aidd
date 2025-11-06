# Epic: Fix Library Exports and Document Conventions

## Goal

Establish and implement consistent, tree-shakeable export conventions for the aidd library. Remove non-existent root exports and ensure all utilities are accessible via explicit paths.

## Context

Currently, package.json declares a root export (`"."`) pointing to `index.js` which doesn't exist. Documentation shows imports from `'aidd'` but the file is missing. The library should use explicit path exports for better tree shaking, consistency with existing patterns (`'aidd/server'`), and clearer module boundaries.

## Export Convention

**Lib utilities**: `import { utilName } from 'aidd/<utilName>'`

Examples:
- `import { asyncPipe } from 'aidd/asyncPipe'`
- `import { createRoute } from 'aidd/server'` (already exists)

## Benefits

1. **Tree shaking**: Guaranteed - only import what you use
2. **Consistency**: Matches existing `'aidd/server'` pattern
3. **Explicit**: Clear what module you're importing
4. **Maintainable**: No barrel files to manage
5. **Fast builds**: Bundlers don't analyze barrel exports

## Tasks

### 1. Audit Current Exports
- [ ] Review package.json exports field
- [ ] Identify all lib utilities that should be exported
- [ ] Check which utilities are currently importable
- [ ] Document current vs. desired state

### 2. Update package.json Exports
- [ ] Remove non-existent root `"."` export
- [ ] Add explicit export for asyncPipe: `"./asyncPipe": "./lib/asyncPipe.js"`
- [ ] Add TypeScript type definitions for asyncPipe
- [ ] Verify server export is correct with types
- [ ] Add any other lib utilities that should be public

### 3. Create Type Definitions
- [ ] Create `lib/asyncPipe.d.ts` with TypeScript definitions
- [ ] Ensure types are discoverable via package.json exports
- [ ] Verify TypeScript can resolve types correctly

### 4. Update Documentation
- [ ] Update README.md: change `'aidd'` imports to `'aidd/asyncPipe'`
- [ ] Update docs/server/README.md with correct import paths
- [ ] Update any code examples in comments/docstrings
- [ ] Document export conventions in README or contributing guide

### 5. Verify and Test
- [ ] Test that imports work: `import { asyncPipe } from 'aidd/asyncPipe'`
- [ ] Test that server imports still work: `import { createRoute } from 'aidd/server'`
- [ ] Verify TypeScript types are resolved correctly
- [ ] Check that invalid imports fail appropriately
- [ ] Run existing tests to ensure nothing breaks

### 6. Update Version and Release
- [ ] Determine if this is a breaking change (likely yes - import paths change)
- [ ] Update version appropriately (major bump if breaking)
- [ ] Update CHANGELOG/activity log
- [ ] Prepare release notes explaining the change

## Acceptance Criteria

- [ ] No non-existent files referenced in package.json exports
- [ ] All lib utilities accessible via `'aidd/<utilName>'` pattern
- [ ] TypeScript definitions work correctly for all exports
- [ ] Documentation reflects actual import paths
- [ ] All existing tests pass
- [ ] Export conventions documented for future contributors

## Notes

- Users should NOT import from `ai/` or `bin/` - these are internal
- Keep `files` field in package.json as-is (includes lib, src, bin, ai)
- Server utilities remain at `'aidd/server'` (no change)
- This is a breaking change for anyone using `'aidd'` root imports

## Definition of Done

- Package can be imported using documented conventions
- TypeScript users get proper type hints
- Documentation is accurate and complete
- All tests pass
- No console warnings or errors about missing modules


