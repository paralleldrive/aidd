# Tech Stack Migration Plan

## Overview

Migrate the existing `ai/rules/stack.mdc` functionality into the new `/memory` system while maintaining backward compatibility.

## Current State

**File**: `ai/rules/stack.mdc`
- Contains tech stack guidance for NextJS + React/Redux + Shadcn
- Uses frontmatter with `description` and `alwaysApply`
- Includes JS, React, and Redux best practices
- Has constraints referencing other .mdc files (tdd.mdc)

## Target State

**File**: `aidd-project/context/tech-stack.mdc`
- Structured memory entries with timestamps
- Compatible frontmatter (description, alwaysApply: true)
- Same content but organized into memory entry format
- Maintains references to other guidance files

## Migration Strategy

### Phase 1: Create Migration Command

Implement `/memory migrate-stack` command that:

1. **Reads** `ai/rules/stack.mdc`
2. **Parses** content into logical sections:
   - Tech Stack Overview
   - JavaScript Patterns
   - React Patterns
   - Redux Patterns
   - Constraints
3. **Structures** as memory entries with timestamps
4. **Writes** to `aidd-project/context/tech-stack.mdc`
5. **Preserves** original file for backward compatibility
6. **Reports** migration results to user

### Phase 2: Update Documentation

Update docs to reference new location:
- README.md
- AGENTS.md
- Development workflow guides
- Note that both locations work (transitional period)

### Phase 3: Soft Deprecation

Add note to `ai/rules/stack.mdc`:
```markdown
> **Note**: This file is maintained for backward compatibility.
> For new projects, use `/memory` command to manage tech stack in `aidd-project/context/tech-stack.mdc`.
```

### Phase 4 (Future): Hard Deprecation

After transition period (6+ months):
- Remove `ai/rules/stack.mdc` from new installations
- Update CLI to use new location
- Provide automatic migration for existing projects

## Migration Mapping

### Current Format
```markdown
---
description: When implementing NextJS + React/Redux + Shadcn UI features...
alwaysApply: false
---
# Tech Stack

Act as a top-tier senior full stack software engineer...

NextJS + React/Redux + Shadcn to be deployed on Vercel

# JS

Always use functional programming approaches.
Favor pure functions, immutability...

# React

Constraints {
  Always use the container/presentation pattern...
}
```

### Migrated Format
```markdown
---
description: Tech stack guidance for NextJS + React/Redux + Shadcn UI features
alwaysApply: true
---
# Tech Stack

## Overview

NextJS + React/Redux + Shadcn deployed on Vercel. Always use best practices, declarative approaches, and concise code.

*Migrated: 2026-02-10*

## JavaScript Patterns

### Functional Programming
Always use functional programming approaches. Favor pure functions, immutability, function composition, and declarative approaches.

Constraints:
- Favor `const` over `let` and `var` whenever possible
- Use redux-saga for side effects
- Separate state management, UI, and side-effects into different modules

*Migrated: 2026-02-10*

## React Patterns

### Container/Presentation Pattern
Always use the container/presentation pattern when you need persisted state.

Constraints:
- Containers should never contain any direct UI markup (use presentation components)
- Containers should NEVER contain business logic (use react-redux connect instead)

*Migrated: 2026-02-10*

## Redux Patterns

### Avoid Redux Toolkit
Use frameworks/redux/autodux and redux connect instead.

Process:
1. Build the Autodux dux object and save as `${slice name}-dux.sudo`
2. Transpile to JavaScript and save as `${slice name}-dux.js`

Constraints:
- ALWAYS use tdd as defined in tdd.mdc when implementing changes
- NEVER change source code without clear requirements, tests, or user approval

*Migrated: 2026-02-10*
```

## Implementation Checklist

### Command Implementation
- [ ] Create `/memory migrate-stack` handler
- [ ] Parse ai/rules/stack.mdc sections
- [ ] Generate structured memory entries
- [ ] Add migration timestamps
- [ ] Write to aidd-project/context/tech-stack.mdc
- [ ] Preserve original file
- [ ] Show migration summary to user

### Testing
- [ ] Test migration with current stack.mdc
- [ ] Verify frontmatter is valid YAML
- [ ] Confirm agents can read new format
- [ ] Check backward compatibility
- [ ] Test with missing source file (graceful error)
- [ ] Test with existing target file (merge vs replace)

### Documentation
- [ ] Update README.md references
- [ ] Update AGENTS.md workflow
- [ ] Add migration guide
- [ ] Document both locations during transition
- [ ] Create example aidd-project structure

### Communication
- [ ] Add migration note to stack.mdc
- [ ] Update CLI help text
- [ ] Create migration announcement
- [ ] Add to CHANGELOG.md

## Rollout Timeline

**Week 1**: Implement migration command
**Week 2**: Test with existing projects
**Week 3**: Update documentation
**Week 4**: Soft launch with backward compatibility
**Month 2-7**: Transition period (both locations supported)
**Month 8+**: Hard deprecation (new projects use new location only)

## Backward Compatibility

During transition period:
- Both `ai/rules/stack.mdc` and `aidd-project/context/tech-stack.mdc` work
- Agents check both locations
- Prefer `aidd-project/context/tech-stack.mdc` if both exist
- Migration command is idempotent (safe to run multiple times)

## Edge Cases

### Empty or Missing Source File
- Show helpful error message
- Offer to create example tech-stack.mdc
- Link to documentation

### Existing Target File
- Detect existing aidd-project/context/tech-stack.mdc
- Offer options:
  1. Merge (combine entries)
  2. Replace (overwrite)
  3. Cancel (keep existing)
- Default: Merge

### Custom Modifications to stack.mdc
- Preserve custom content
- Maintain structure where possible
- Flag complex customizations for manual review

### Missing aidd-project Directory
- Create directory structure automatically
- Inform user of new directory
- Explain purpose and organization

## Success Criteria

✅ Migration command runs without errors
✅ All content preserved accurately
✅ Frontmatter is valid and functional
✅ Agents can read and apply memories
✅ Original file remains for compatibility
✅ Documentation is updated and clear
✅ Users understand new location and benefits

## Future Enhancements

After successful migration:
- Apply same pattern to other .mdc files if beneficial
- Create `/memory export` to share memories between projects
- Create `/memory import` to load from other sources
- Build memory analytics (most referenced, etc.)
