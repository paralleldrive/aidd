# Fix Library Exports Epic

**Status**: 📋 PLANNED  
**Goal**: Establish consistent, tree-shakeable export conventions using explicit paths

**Note**: All export changes should include automated tests to verify imports work correctly. Favor named exports over default exports.

## Overview

Users need explicit import paths (`'aidd/asyncPipe'`) instead of barrel exports to ensure optimal tree shaking and faster builds. The current package.json references a non-existent root `index.js` file, and documentation shows imports from `'aidd'` that don't work. By adopting the convention `import { utilName } from 'aidd/<utilName>'` we match the existing `'aidd/server'` pattern, eliminate barrel file complexity, and guarantee users only bundle what they import.

---

## Audit Current Exports

Review package.json exports and identify which lib utilities should be publicly accessible.

**Requirements**:
- Given package.json exports field, should document all declared exports
- Given lib/ directory, should identify utilities suitable for public export
- Given existing documentation, should list all referenced import paths
- Given current state, should identify non-existent files referenced in exports

---

## Update Package Exports

Remove non-existent root export and add explicit path exports for lib utilities.

**Requirements**:
- Given non-existent root export, should remove `"."` from package.json exports
- Given asyncPipe utility, should add `"./asyncPipe": "./lib/asyncPipe.js"` export
- Given TypeScript users, should include type definitions in exports map
- Given server export, should verify it includes proper type resolution

---

## Create Type Definitions

Add TypeScript definitions for exported utilities.

**Requirements**:
- Given asyncPipe.js, should create asyncPipe.d.ts with proper function signature
- Given package.json exports, should map .d.ts files for TypeScript resolution
- Given TypeScript projects, should resolve types without additional configuration

---

## Setup TypeScript Type Checking

Add TypeScript tooling to validate .d.ts files are correct.

**Requirements**:
- Given .d.ts files, should install typescript as devDependency
- Given type validation needs, should create tsconfig.json for type checking only
- Given CI/testing workflow, should add typecheck npm script
- Given pre-commit hooks, should run typecheck before allowing commits

---

## Update Documentation

Change all import examples to use explicit path convention.

**Requirements**:
- Given README.md examples, should change `'aidd'` to `'aidd/asyncPipe'`
- Given docs/server/README.md, should update asyncPipe import paths
- Given code comments and docstrings, should update import examples
- Given future contributors, should document export convention pattern

---

## Verify Implementation

Test that new import paths work and existing functionality is preserved.

**Requirements**:
- Given new export paths, should successfully import from `'aidd/asyncPipe'`
- Given existing server exports, should continue working at `'aidd/server'`
- Given TypeScript projects, should provide IntelliSense and type checking
- Given invalid import paths, should fail with clear module not found errors
- Given existing test suite, should pass without modifications

