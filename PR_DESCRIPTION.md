# Add /memory command design and specification

## Summary

Design and specification for a new `/memory` command that enables AI agents to learn project-specific patterns, anti-patterns, and best practices over time. This allows users to teach agents from repeated mistakes and store persistent guidance that applies intelligently across sessions.

### Key Features

- **Dynamic Memory Topics**: No fixed taxonomy - topics created as needed (tech-stack, testing, code-style, etc.)
- **Intelligent Classification**: Agent analyzes content and suggests appropriate topics
- **Natural Language Interface**: Supports both structured commands and ad-hoc queries
- **Cursor-Compatible Format**: Stores memories in `.mdc` files with frontmatter + markdown
- **Flexible Application**: Memories can be always-on, file-pattern-triggered, or on-demand
- **Conflict Resolution**: Detects and helps resolve contradictory guidance
- **Tech Stack Migration**: Smooth migration path from existing `ai/rules/stack.mdc`

### What's Included

1. **User Journey Documentation** (`docs/memory-command-user-journey.md`)
   - 8 detailed usage scenarios
   - Topic classification heuristics
   - Conflict resolution strategies
   - Frontmatter patterns and examples

2. **Agent Skills Specification** (`skills/memory/SKILL.md`)
   - Complete skill implementation using SudoLang conventions
   - Memory data structures and interfaces
   - Command handlers (save, list, show, search, forget, migrate)
   - State management and constraints

3. **Migration Plan** (`docs/memory-tech-stack-migration.md`)
   - 4-phase rollout strategy
   - Backward compatibility approach
   - Edge case handling
   - Timeline and success criteria

4. **User Documentation** (`skills/memory/README.md`)
   - Quick start examples
   - Command reference
   - Best practices and troubleshooting

### Storage Location

Memories stored in: `aidd-project/context/${topic}.mdc`

Example structure:
```
your-project/
├── aidd-project/
│   └── context/
│       ├── tech-stack.mdc
│       ├── testing.mdc
│       ├── code-style.mdc
│       └── agent-tooling.mdc
```

### Example Usage

```bash
# Save a memory
/memory "Always use Edit tool instead of sed"

# Save to specific topic
/memory testing "Run unit tests before integration"

# List all memories
/memory list

# Search memories
/memory search "react"

# Natural language queries
/memory what did I tell you about testing?
```

## Questions for Review

1. **Directory naming**: Should it be `aidd-project/context/` or different location?
2. **Tech stack integration**: Full merge vs. special case handling?
3. **Agent proactivity**: Auto-check memories vs. explicit invocation?
4. **Command registration**: Update `ai/rules/please.mdc` to register command?

## Next Steps

- [ ] Review design and provide feedback
- [ ] Decide on directory structure
- [ ] Implement skill handler
- [ ] Add command to please.mdc
- [ ] Create migration tool
- [ ] Update documentation
- [ ] Test with real scenarios

---

https://claude.ai/code/session_01HP1jekPP86zdCLG5T455Bi
