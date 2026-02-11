# Memory Skill

Teach AI agents project-specific patterns, anti-patterns, and best practices that persist across sessions.

## Quick Start

```bash
# Save a quick memory
/memory "Always use Edit tool instead of sed for file edits"

# Save to specific topic
/memory testing "Run unit tests before integration tests"

# List all memories
/memory list

# Search memories
/memory search "react"

# View specific topic
/memory show testing
```

## What is Memory?

The Memory skill allows you to teach AI agents about your project over time. When agents make mistakes or you want to share guidance, create memories that intelligently apply to future work.

### Why Use Memory?

- **Stop Repeating Yourself**: Tell the agent once, it remembers forever
- **Consistent Patterns**: Ensure all agents follow your project conventions
- **Learn from Mistakes**: When an agent makes an error, save the correction
- **Context-Aware**: Memories auto-apply based on file types or always
- **Shareable**: Commit memories to git, share with team

## Storage Location

Memories are stored in `aidd-project/context/*.mdc` files using a format compatible with Cursor IDE rules:

```
your-project/
├── aidd-project/
│   └── context/
│       ├── tech-stack.mdc
│       ├── testing.mdc
│       ├── code-style.mdc
│       └── agent-tooling.mdc
```

## Memory Topics

Topics are dynamic and created as needed. Common examples:

- **tech-stack**: Technologies, frameworks, versions
- **testing**: Test patterns, tools, execution order
- **code-style**: Naming conventions, formatting
- **architecture**: Module organization, design patterns
- **agent-tooling**: Tool selection, workflow preferences
- **api-design**: Endpoint conventions, auth patterns

## Commands

### Save Memory

```bash
# Auto-suggest topic
/memory "Use Playwright instead of Puppeteer"

# Specify topic
/memory tech-stack "We use React 18+ with hooks only"
```

### List Memories

```bash
/memory list
```

Shows all memory topics with descriptions and entry counts.

### View Memory

```bash
/memory show testing
```

Displays full content of a memory topic.

### Search Memories

```bash
/memory search "react"
```

Find memories across all topics.

### Remove Memory

```bash
/memory forget "about using sed"
```

Remove a specific memory entry.

### Migrate Tech Stack

```bash
/memory migrate-stack
```

Migrate existing `ai/rules/stack.mdc` to new format.

## File Format

Each memory file uses YAML frontmatter + Markdown:

```markdown
---
description: Testing patterns and anti-patterns
globs: ["**/*.test.js", "**/*.spec.ts"]
alwaysApply: false
---
# Testing

## Run Tests in Order

### Unit Before Integration
Always run unit tests before integration tests to catch issues early.

*Added: 2026-02-10*
```

## Frontmatter Options

### alwaysApply: true
Memory always available to agents:

```yaml
---
description: Critical workflow patterns
alwaysApply: true
---
```

### globs: [patterns]
Auto-attach when working with matching files:

```yaml
---
description: React component patterns
globs: ["**/*.jsx", "**/*.tsx"]
alwaysApply: false
---
```

### No globs, alwaysApply: false
Agent queries on-demand when relevant:

```yaml
---
description: API design conventions
alwaysApply: false
---
```

## How It Works

1. **You save a memory**: `/memory "guidance text"`
2. **Agent suggests topic**: Based on content analysis
3. **You confirm or override**: Accept suggestion or specify topic
4. **Memory is saved**: Written to `aidd-project/context/${topic}.mdc`
5. **Agents remember**: Future agents read and apply guidance

## Integration

Works with:
- **Cursor IDE**: Compatible .mdc format
- **AIDD Framework**: Integrates with /discover, /task, etc.
- **Git**: Commit and share with team
- **CI/CD**: Consistent agent behavior in automation

## Examples

### Example 1: Prevent Repeated Mistakes

```bash
User: /memory "Don't use @testing-library/react, use Riteway + Playwright"

Agent: 💭 /memory
This looks like testing guidance.

Suggested topic: testing
Auto-apply to: **/*.test.js, **/*.spec.ts

Should I save to `testing`?

User: yes

Agent: ✅ Memory saved to aidd-project/context/testing.mdc
```

### Example 2: Tech Stack Preferences

```bash
User: /memory "We use tRPC for API, not REST"

Agent: 💭 /memory
This is tech stack information.

Suggested topic: tech-stack
Auto-apply: Always

Should I save to `tech-stack`?

User: yes

Agent: ✅ Memory saved to aidd-project/context/tech-stack.mdc
```

### Example 3: Natural Language Queries

```bash
User: /memory what did I tell you about testing?

Agent: 💭 /memory

From `testing.mdc`:
1. Don't use @testing-library/react, use Riteway + Playwright
2. Run unit tests before integration tests
3. Colocate tests with source code

From `tech-stack.mdc`:
- Test framework: Riteway + Vitest
- Browser testing: Playwright
```

## Best Practices

### ✅ Do

- Be specific and actionable
- Include context or reasoning when helpful
- Update memories when requirements change
- Organize by logical topics
- Use alwaysApply for critical guidance
- Use globs for file-specific patterns

### ❌ Don't

- Save overly generic advice
- Duplicate information across topics
- Create too many narrow topics
- Save temporary preferences
- Forget to review and refine over time

## Troubleshooting

### Memory not being applied?

Check frontmatter:
- Is `alwaysApply: true` for critical guidance?
- Do `globs` match your file paths?
- Is description clear for agent queries?

### Conflicting memories?

Use `/memory show <topic>` to review and `/memory forget` to remove outdated entries.

### Migration from stack.mdc?

Use `/memory migrate-stack` to automatically migrate existing tech stack file.

## Learn More

- [User Journey Documentation](../../docs/memory-command-user-journey.md)
- [Migration Guide](../../docs/memory-tech-stack-migration.md)
- [Agent Skills Specification](https://agentskills.io/specification)
- [Cursor .mdc Format](https://github.com/benallfree/awesome-mdc)

## Version

1.0.0

## License

Same as AIDD Framework
