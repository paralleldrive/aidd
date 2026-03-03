# AGENTS.md and Index Discovery Epic

**Epic Goal**: Improve command and rule discovery with AGENTS.md installation and automatic index.md compilation

**Status**: ✅ COMPLETED
**Created**: 2025-12-14
**Completed**: 2025-12-14
**Estimated Effort**: Medium

## Epic Overview

Add two key features to the aidd CLI installer:
1. **AGENTS.md management** - Create/update AGENTS.md with directives for AI agents to discover ai/ folder contents
2. **Index generation** - Compile index.md files from frontmatter in each ai/ subfolder

**Context**: AI agents need guidance on where to find commands and rules. AGENTS.md provides discovery directives, and index.md files provide structured overviews of each folder's contents.

**Success Criteria**:

- [x] AGENTS.md created/updated with required directives on install
- [x] `--index` command generates index.md from frontmatter recursively
- [x] Pre-commit hook runs index generation automatically
- [x] Comprehensive tests for both modules
- [x] TypeScript definitions for exported interfaces

---

## Task 1: Create AGENTS.md Module

**Context**: Manage AGENTS.md file with directives for AI agent discovery

**Requirements**:

- Given AGENTS.md doesn't exist, should create it with all directives
- Given AGENTS.md exists without directives, should append them
- Given AGENTS.md already has directives, should not duplicate
- Given any case, should NEVER overwrite existing content

**Success Criteria**:

- [x] `lib/agents-md.js` module created
- [x] `ensureAgentsMd()` function handles all cases
- [x] Required directives include: ai/ discovery, index.md guidance, vision document requirement
- [x] Unit tests cover all scenarios
- [x] TypeScript definitions in `lib/agents-md.d.ts`

**Dependencies**: None
**Estimated Effort**: Small

**Implementation Notes**:

Required directives:
- Look at `ai/*` directory listings for available commands and rules
- Read `index.md` files to learn what each file does
- Only consume root index until subfolder contents are needed
- Read vision document before creating/running tasks
- Ask user when conflicts with vision arise

---

## Task 2: Create Index Generator Module

**Context**: Generate index.md files from YAML frontmatter in ai/ subfolders

**Requirements**:

- Given ai/ folder with .md/.mdc files, should parse frontmatter
- Given files with description/globs fields, should include in index
- Given subdirectories, should recursively generate indexes
- Given pre-commit hook, should run automatically

**Success Criteria**:

- [x] `lib/index-generator.js` module created
- [x] Uses gray-matter for robust YAML parsing
- [x] `generateAllIndexes()` recursively processes ai/ folder
- [x] Symlink and depth protection (max 10 levels)
- [x] Path traversal validation
- [x] Unit tests cover all scenarios
- [x] TypeScript definitions in `lib/index-generator.d.ts`

**Dependencies**: Task 1
**Estimated Effort**: Medium

---

## Task 3: CLI Integration

**Context**: Integrate both modules into aidd CLI

**Requirements**:

- Given `npx aidd`, should create AGENTS.md after cloning ai/
- Given `npx aidd --index`, should generate index.md files
- Given `--dry-run --index`, should show preview without writing
- Given `--verbose --index`, should list generated files

**Success Criteria**:

- [x] `executeClone()` calls `ensureAgentsMd()` after cloning
- [x] `--index` option added to CLI
- [x] `--dry-run` respected for index generation
- [x] Pre-commit hook updated to run index generation
- [x] E2E integration tests

**Dependencies**: Tasks 1, 2
**Estimated Effort**: Small

---

## Task 4: Code Review Fixes

**Context**: Address issues found during code review

**Requirements**:

- Given code review feedback, should fix all identified issues
- Given YAML parser limitations, should use proper library

**Success Criteria**:

- [x] Replace custom YAML parser with gray-matter
- [x] Fix --dry-run being ignored with --index
- [x] Fix unreachable test assertion (move to catch block)
- [x] Add symlink/depth protection to recursion
- [x] Include error details in error messages
- [x] Remove unused imports
- [x] Update test data to use valid YAML (quoted globs)

**Dependencies**: Tasks 1-3
**Estimated Effort**: Small

---

## Task 5: Fix Duplicate Wrapper Heading in appendDirectives

**Context**: When `appendDirectives` is called multiple times on the same file (e.g., a user runs `npx aidd` twice after upgrading), the `---` separator and `## AIDD Agent Directives (Auto-appended)` heading are unconditionally prepended each time — even though individual subsections are already deduplicated. This results in duplicate headings and dividers in AGENTS.md.

**Requirements**:

- Given `appendDirectives` is called on content that already contains `## AIDD Agent Directives (Auto-appended)`, should NOT add a second wrapper heading or `---` separator
- Given `appendDirectives` is called twice on the same file, should produce exactly one `## AIDD Agent Directives (Auto-appended)` heading
- Given `appendDirectives` is called twice on the same file, should produce exactly one `---` separator from the auto-append block
- Given the wrapper heading is already present and new sections need appending, should append the new section content directly under the existing heading

**Success Criteria**:

- [ ] `appendDirectives` checks for existing wrapper heading before prepending it
- [ ] Running `ensureAgentsMd` twice produces only one `## AIDD Agent Directives (Auto-appended)` heading
- [ ] Unit tests assert single heading and separator after two calls

**Dependencies**: Tasks 1-4
**Estimated Effort**: Small

---

## Files Created/Modified

**New Files**:
- `lib/agents-md.js` - AGENTS.md management module
- `lib/agents-md.test.js` - Unit tests
- `lib/agents-md.d.ts` - TypeScript definitions
- `lib/index-generator.js` - Index generation module
- `lib/index-generator.test.js` - Unit tests
- `lib/index-generator.d.ts` - TypeScript definitions
- `lib/agents-index-e2e.test.js` - E2E integration tests

**Modified Files**:
- `bin/aidd.js` - Added --index option
- `lib/cli-core.js` - Integrated AGENTS.md creation
- `.husky/pre-commit` - Added index generation
- `package.json` - Added gray-matter dependency
- `README.md` - Added vision document section
