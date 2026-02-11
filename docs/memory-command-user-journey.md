# /memory Command User Journey

## Overview

The `/memory` command enables users to teach AI agents project-specific patterns, anti-patterns, and best practices over time. When agents make repeated mistakes or users want to share guidance, they can create persistent memories that intelligently apply to future work.

## Key Concepts

**Memory Files**: Stored in `aidd-project/context/${topic}.mdc` using frontmatter + markdown format
**Topics**: Dynamic categories like `testing`, `architecture`, `code-style`, `api-design`, `tech-stack`
**Intelligence**: Agent analyzes content and suggests appropriate topic/classification
**Tech Stack Migration**: Existing `ai/rules/stack.mdc` functionality merges into this system

## User Journeys

### Journey 1: Quick Memory Save

**Scenario**: Agent repeatedly uses `sed` instead of Edit tool

```
User: /memory "Stop using sed for file edits, use the Edit tool instead"

Agent: 💭 /memory
I'll save this guidance. This looks like a tools/workflow preference.

Suggested topic: `agent-tooling`
- Description: Guidance for AI agents on tool selection and usage patterns
- Auto-apply: Always (critical workflow guidance)

Should I save to `agent-tooling` or would you prefer a different topic?

User: yes

Agent: ✅ Memory saved to aidd-project/context/agent-tooling.mdc

Next time I need to edit files, I'll remember to use the Edit tool!
```

### Journey 2: Memory with Topic Override

**Scenario**: User wants to specify a custom topic

```
User: /memory testing "Always run unit tests before integration tests"

Agent: 💭 /memory
Saving to topic: `testing`

✅ Memory saved to aidd-project/context/testing.mdc

I'll remember to run unit tests first when executing test suites.
```

### Journey 3: Tech Stack Information

**Scenario**: User teaches agent about project technologies

```
User: /memory "We use Playwright for browser testing, not Puppeteer"

Agent: 💭 /memory
This looks like tech stack information about your testing framework.

Suggested topic: `tech-stack`
- Auto-apply: When working with test files (**.test.js, **.spec.js)

Should I save to `tech-stack`?

User: yes

Agent: ✅ Memory saved to aidd-project/context/tech-stack.mdc

I've noted to use Playwright for browser testing going forward.
```

### Journey 4: List All Memories

**Scenario**: User wants to see what's been memorized

```
User: /memory list

Agent: 💭 /memory

📚 Project Memories (aidd-project/context/)

1. **agent-tooling.mdc** (Always applied)
   - Tool selection and workflow patterns
   - 3 entries

2. **testing.mdc** (Auto: **.test.*, **.spec.*)
   - Testing patterns and anti-patterns
   - 5 entries

3. **tech-stack.mdc** (Always applied)
   - Technologies and frameworks used
   - 8 entries

4. **api-design.mdc** (Auto: **/api/**, **/routes/**)
   - API conventions and patterns
   - 2 entries

Total: 18 memories across 4 topics
```

### Journey 5: View Specific Memory

**Scenario**: User wants to review a memory topic

```
User: /memory show testing

Agent: 💭 /memory

📄 testing.mdc

---
description: Testing patterns and anti-patterns for this project
globs: ["**/*.test.js", "**/*.test.ts", "**/*.spec.js", "**/*.spec.ts"]
alwaysApply: false
---

## Testing Patterns

### Unit Tests Before Integration
Always run unit tests before integration tests to catch issues early.
*Added: 2026-02-10*

### Test Isolation
Each test should be completely isolated with no shared mutable state.
*Added: 2026-02-08*

[...3 more entries...]
```

### Journey 6: Search Memories

**Scenario**: User wants to find memories about a specific topic

```
User: /memory search "react"

Agent: 💭 /memory

🔍 Found 3 memories matching "react":

**tech-stack.mdc**
> Use React 18+ with functional components and hooks only. Avoid class components.

**code-style.mdc**
> React components should use the container/presentation pattern for state management.

**testing.mdc**
> For React components, use Riteway + Playwright instead of @testing-library/react.
```

### Journey 7: Update/Refine Memory

**Scenario**: User wants to update existing guidance

```
User: /memory "Actually, use the Edit tool for most edits, but sed is okay for simple one-line replacements in scripts"

Agent: 💭 /memory

I found a related memory in `agent-tooling.mdc`:
> Stop using sed for file edits, use the Edit tool instead

This seems like a refinement. Should I:
1. Update the existing entry (Recommended)
2. Add as a new entry
3. Cancel

User: 1

Agent: ✅ Updated agent-tooling.mdc

The guidance now reflects that Edit tool is preferred but sed is acceptable for simple script edits.
```

### Journey 8: Ad-hoc Request Handling

**Scenario**: User makes a non-standard request

```
User: /memory forget about using sed

Agent: 💭 /memory

Found and removed this entry from `agent-tooling.mdc`:
> Stop using sed for file edits, use the Edit tool instead

✅ Memory removed. I'll no longer have this constraint.

User: /memory what did I tell you about testing?

Agent: 💭 /memory

Looking through testing-related memories...

From `testing.mdc`:
1. Always run unit tests before integration tests
2. Each test should be isolated with no shared state
3. Use Riteway + Playwright for React testing
4. Colocate tests with source code
5. Never use @testing-library/react

From `tech-stack.mdc`:
- We use Playwright for browser testing (not Puppeteer)
- Test framework: Riteway + Vitest
```

## Intelligent Topic Classification

The agent uses these heuristics to suggest topics:

### Tech Stack
- Mentions framework/library names (React, Redux, Playwright)
- Version specifications (Node 18+, React 18+)
- Package or dependency preferences
- Build tools or deployment platforms

**Example**: "We use tRPC instead of REST" → `tech-stack`

### Testing
- Test execution order or strategies
- Testing tools and frameworks
- Test patterns and anti-patterns
- Coverage or quality requirements

**Example**: "Run unit tests first" → `testing`

### Code Style
- Naming conventions
- File organization patterns
- Formatting preferences
- Code structure guidelines

**Example**: "Use kebab-case for file names" → `code-style`

### Architecture
- Module organization
- Design patterns
- System boundaries
- Coupling/cohesion guidelines

**Example**: "Keep state management separate from UI" → `architecture`

### Agent Tooling
- Tool selection preferences
- Workflow patterns
- CLI usage guidelines
- Development practices

**Example**: "Use Edit tool instead of sed" → `agent-tooling`

### API Design
- Endpoint conventions
- Request/response patterns
- Authentication approaches
- Error handling standards

**Example**: "All API routes use /api/v1 prefix" → `api-design`

## Conflict Resolution Strategy

When new memory conflicts with existing:

1. **Show the conflict** to the user
2. **Suggest resolution**:
   - Update (refine/replace existing)
   - Append (both are valid in different contexts)
   - Create new topic (different scope)
3. **Let user decide**

## Frontmatter Patterns

### Always Apply (Critical Guidance)
```yaml
---
description: Tool selection and workflow patterns for AI agents
alwaysApply: true
---
```

### File Pattern Auto-attach
```yaml
---
description: Testing patterns and anti-patterns
globs: ["**/*.test.js", "**/*.spec.ts"]
alwaysApply: false
---
```

### Agent-requested (On-demand)
```yaml
---
description: API design conventions and patterns
alwaysApply: false
---
```
*No globs = agent queries when relevant*

## Memory Entry Format

Each memory entry should include:

```markdown
### Brief Title
Clear description of the pattern or guidance.
*Added: YYYY-MM-DD*
*Updated: YYYY-MM-DD* (if applicable)
```

## Migration: Tech Stack Feature

**Current**: `ai/rules/stack.mdc` contains tech stack info
**Future**: Migrate to `aidd-project/context/tech-stack.mdc`

**Migration Strategy**:
1. Create `/memory migrate-stack` command
2. Read existing `ai/rules/stack.mdc`
3. Parse into structured memories
4. Write to `aidd-project/context/tech-stack.mdc`
5. Keep original for backward compatibility
6. Update docs to recommend new location

## Command Reference

```
/memory <text>                    # Save with auto-suggested topic
/memory <topic> <text>           # Save to specific topic
/memory list                     # List all memory topics
/memory show <topic>             # View specific memory file
/memory search <query>           # Search across all memories
/memory forget <query>           # Remove matching memory
/memory migrate-stack            # Migrate ai/rules/stack.mdc
```

**Ad-hoc handling**: Agent interprets natural requests intelligently
- "what did I tell you about X" → search and summarize
- "forget about X" → find and remove
- "update X" → find and update

## Success Criteria

✅ Agents learn from repeated mistakes
✅ Users can easily share context and preferences
✅ Memories apply intelligently based on file context
✅ No fixed topic taxonomy (fully dynamic)
✅ Tech stack migration path clear
✅ Natural language interface feels conversational
✅ Conflicts are detected and resolved gracefully
