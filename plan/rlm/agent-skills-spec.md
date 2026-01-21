# Agent Skills Specification

**Source**: https://agentskills.io/specification
**Standard**: Open specification by Anthropic
**Adoption**: Microsoft, OpenAI, Atlassian, Figma, Cursor, GitHub, VS Code

## What Are Agent Skills?

Skills are self-contained folders that teach AI agents to complete specialized tasks through instructions, scripts, and resources. They enable "dynamic performance improvement on specialized tasks" by providing context-specific guidance that agents can discover and load automatically.

## Skill Structure

### Minimal Requirements

A skill is simply a folder containing a `SKILL.md` file:

```
ai/skills/skill-name/
  └── SKILL.md
```

### SKILL.md Format

```markdown
---
name: skill-identifier
description: Complete explanation of what the skill does and when to use it
---

# Skill Instructions

[Instructions for the AI agent]

## Examples

[Usage examples]

## Guidelines

[Best practices and constraints]
```

## Frontmatter Fields

### Required Fields

**name** (string)
- Unique lowercase identifier
- Use hyphens instead of spaces
- Example: `pdf`, `recursive-language-model`, `code-review`

**description** (string)
- Complete explanation of functionality
- When to use the skill
- What problems it solves
- Used by agents to decide whether to activate the skill

### Optional Fields

**license** (string)
- License information for the skill
- Example: `MIT`, `Proprietary`, `Apache-2.0`

## Skill Organization

### Directory Structure

```
ai/skills/
  ├── pdf/
  │   ├── SKILL.md
  │   ├── forms.md          # Additional documentation
  │   └── reference.md      # Advanced features
  ├── docx/
  │   └── SKILL.md
  └── rlm/
      ├── SKILL.md
      └── scripts/          # Optional helper scripts
          └── index-codebase.js
```

### Supporting Files

Skills can include:
- Additional markdown documentation
- Helper scripts (Python, JavaScript, etc.)
- Configuration files
- Reference materials
- Templates

## How Agents Use Skills

### Discovery

Compatible agents automatically:
1. Scan skill directories
2. Parse SKILL.md frontmatter
3. Index available skills by name and description

### Activation

Agents activate skills when:
- User mentions skill by name
- Task description matches skill purpose
- Skill is marked as always-active (implementation-specific)

### Invocation

Once activated, agents:
1. Read skill instructions
2. Follow documented workflows
3. Use provided scripts and tools
4. Apply guidelines and constraints

## Best Practices

### Writing Effective Descriptions

Good descriptions include:
- Clear purpose statement
- Specific use cases
- When NOT to use the skill
- Prerequisites or dependencies

Example:
```yaml
description: Comprehensive PDF manipulation toolkit for extracting text and tables,
  creating new PDFs, merging/splitting documents, and handling forms
```

### Structuring Instructions

Effective skill instructions:
- Start with quick start guide
- Organize by task or workflow
- Include concrete examples
- Provide tool alternatives
- Document common pitfalls

### Including Resources

Skills work best when they:
- Reference external documentation
- Provide quick reference tables
- Include code templates
- Link to related skills

## Platform Support

### Compatible Tools

- **Claude Code** - CLI agent with skill support
- **Cursor** - IDE with agent skills integration
- **VS Code Copilot** - GitHub Copilot with skills
- **Claude.ai** - Web interface skill uploads
- **Claude API** - Programmatic skill loading

### Portability

Skills are **platform-agnostic**:
- Write once, use across all compatible tools
- No vendor lock-in
- Community skill sharing
- Standard-compliant format

## Examples

### Minimal Skill

```markdown
---
name: hello
description: Simple greeting skill that demonstrates basic structure
---

# Hello Skill

When asked to greet someone, respond warmly and professionally.

## Examples

- "Hello, [name]! How can I help you today?"
- "Welcome, [name]! What would you like to work on?"
```

### Complex Skill (PDF)

The PDF skill demonstrates:
- Multiple tool integrations (pypdf, pdfplumber, reportlab)
- CLI alternatives (pdftotext, qpdf)
- Task-based organization
- Quick reference sections
- Links to additional documentation

See: https://github.com/anthropics/skills/tree/main/skills/pdf

## Integration with aidd

### File Location

```
ai/skills/rlm/
  └── SKILL.md
```

### Activation Strategy

For RLM skill:
- **alwaysApply**: true (if supported by implementation)
- **AGENTS.md rule**: "Use RLM skill when needing deep project context"
- **Agent decision**: AI determines when to invoke based on query complexity

### aidd-Specific Patterns

Skills in aidd framework can:
- Reference ai/tools/ scripts
- Integrate with existing ai/rules/ patterns
- Use SudoLang syntax for AI directives
- Leverage bun CLI tools for execution

## References

- Official specification: https://agentskills.io/specification
- GitHub repository: https://github.com/anthropics/skills
- Template skill: https://github.com/anthropics/skills/tree/main/template
- Community skills: https://github.com/skillmatic-ai/awesome-agent-skills
