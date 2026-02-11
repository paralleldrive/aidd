---
name: memory
emoji: 💭
description: Teach AI agents project-specific patterns, anti-patterns, and best practices that persist across sessions
globs: []
alwaysApply: false
version: 1.0.0
author: AIDD Framework
---

# 💭 Memory Skill

Enable AI agents to learn from mistakes and remember project-specific guidance across sessions.

## Purpose

Store and retrieve project memories that help agents:
- Avoid repeating mistakes
- Follow project-specific patterns
- Remember tech stack choices
- Apply context-appropriate guidance
- Learn user preferences over time

## Storage

Memories are stored in `aidd-project/context/${topic}.mdc` using frontmatter + markdown format compatible with Cursor .mdc specification.

## Memory

Memory {
  topic: String // dynamic, user can override
  content: String
  filepath: "aidd-project/context/$topic.mdc"
  frontmatter: {
    description: String
    globs?: String[] // file patterns for auto-attach
    alwaysApply: Boolean
  }
  timestamp: ISO8601
}

## Topic Classification

fn suggestTopic(content: String) {
  Analyze content and suggest most appropriate topic based on:

  TechStack if (
    mentions frameworks, libraries, packages, versions, build tools, deployment platforms
  )

  Testing if (
    mentions test execution, test tools, test patterns, coverage, quality requirements
  )

  CodeStyle if (
    mentions naming conventions, formatting, file organization, code structure
  )

  Architecture if (
    mentions module organization, design patterns, system boundaries, coupling
  )

  AgentTooling if (
    mentions tool selection, workflow patterns, CLI usage, development practices
  )

  ApiDesign if (
    mentions endpoints, routes, request/response patterns, authentication
  )

  // Allow custom topics - these are just common patterns
  else suggest descriptive topic based on content
}

## Commands

The agent should intelligently handle both structured and ad-hoc requests:

### Structured Commands

```
/memory <text>                  # Save with auto-suggested topic
/memory <topic> <text>         # Save to specific topic
/memory list                   # List all memory topics
/memory show <topic>           # View specific memory file
/memory search <query>         # Search across all memories
/memory forget <query>         # Remove matching memory
/memory migrate-stack          # Migrate ai/rules/stack.mdc to new format
```

### Ad-hoc Natural Requests

Handle conversational requests intelligently:
- "what did I tell you about X" → search and summarize
- "forget about X" → find and remove
- "do you remember X" → search and display
- "update X to Y" → find and update
- "why are you doing X" → check if memory exists

## Process

### Saving Memory

fn saveMemory(content, userTopic?) {
  Constraints {
    Always suggest a topic but let user override
    Show clear confirmation of what was saved
    For tech stack info, suggest tech-stack topic
    Use alwaysApply: true for critical guidance
    Use globs for file-pattern-specific guidance
    Add timestamp to each entry
  }

  topic = userTopic || suggestTopic(content)

  if (!userTopic) {
    Present suggestion with rationale
    Get user confirmation or override
  }

  filepath = "aidd-project/context/$topic.mdc"

  if (fileExists(filepath)) {
    Check for conflicts with existing memories
    if (conflict detected) {
      Show conflict
      Offer options: update, append, new-topic
      Get user decision
    }
    Append to existing file
  } else {
    Create new file with frontmatter
  }

  Add memory entry with timestamp
  Confirm to user with clear message
}

### Listing Memories

fn listMemories() {
  Scan aidd-project/context/*.mdc files
  For each file {
    Show topic name
    Show description from frontmatter
    Show application mode (always, auto-attach, on-demand)
    Count number of entries
  }
  Display summary with total memories and topics
}

### Showing Memory

fn showMemory(topic) {
  filepath = "aidd-project/context/$topic.mdc"

  if (!fileExists(filepath)) {
    Suggest similar topics if available
    return "No memories found for topic: $topic"
  }

  Display full file contents with formatting
}

### Searching Memories

fn searchMemories(query) {
  Search across all .mdc files in aidd-project/context/

  For each match {
    Show topic name
    Show matching excerpt with context
    Highlight query terms
  }

  if (no matches) {
    Suggest checking spelling or trying broader terms
  }
}

### Forgetting Memory

fn forgetMemory(query) {
  Search for matching memory entry

  if (multiple matches) {
    Show all matches
    Ask user which to remove
  }

  if (single match) {
    Show what will be removed
    Confirm with user
    Remove entry
  }

  if (entire file becomes empty) {
    Ask if they want to delete the file
  }

  Confirm removal
}

## Conflict Resolution

fn handleConflict(existing, new) {
  Show both the existing and new memory

  Present options {
    1. Update (refine/replace existing) - Recommended for refinements
    2. Append (both valid in different contexts)
    3. Create new topic (different scope)
    4. Cancel
  }

  Get user choice and execute
}

## Frontmatter Patterns

### Critical Guidance (Always Apply)
Use when guidance should always be available regardless of context:
- Core workflow patterns
- Critical anti-patterns
- Universal project conventions

```yaml
---
description: Tool selection and workflow patterns for AI agents
alwaysApply: true
---
```

### File Pattern Auto-attach
Use when guidance applies to specific file types or paths:
- Language-specific patterns
- Framework-specific conventions
- Directory-specific rules

```yaml
---
description: Testing patterns and anti-patterns
globs: ["**/*.test.js", "**/*.test.ts", "**/*.spec.js"]
alwaysApply: false
---
```

### Agent-requested (On-demand)
Use when guidance is contextual and agent should query when needed:
- Specialized domain knowledge
- Optional best practices
- Context-dependent patterns

```yaml
---
description: API design conventions and patterns
alwaysApply: false
---
```

## Memory Entry Format

Structure each memory entry consistently:

```markdown
### Brief Descriptive Title
Clear, actionable description of the pattern or guidance.
Context or reasoning if helpful.

*Added: YYYY-MM-DD*
*Updated: YYYY-MM-DD* (if applicable)
```

## Tech Stack Migration

fn migrateStackFile() {
  Read ai/rules/stack.mdc

  Parse content into structured memories:
  - Extract tech stack information
  - Identify frameworks and versions
  - Capture constraints and best practices
  - Preserve code examples

  Create aidd-project/context/tech-stack.mdc with:
  - Proper frontmatter (alwaysApply: true)
  - Structured memory entries
  - Timestamps

  Keep original ai/rules/stack.mdc for backward compatibility

  Inform user of migration completion
  Suggest reviewing and refining migrated content
}

## State

State {
  contextDir = "aidd-project/context"
  memoryFormat = ".mdc"
  timestampFormat = "YYYY-MM-DD"
}

## Constraints

Constraints {
  Always create aidd-project/context/ directory if it doesn't exist
  Ensure proper YAML frontmatter syntax
  Use consistent timestamp format
  Preserve existing memories when appending
  Show clear feedback for every operation
  Handle missing files and directories gracefully
  Suggest helpful alternatives when operations fail
  Let user confirm before destructive operations (forget, update)
  Be conversational and helpful in tone
  Treat topic names as kebab-case (e.g., "agent-tooling")
}

## Examples

### Example 1: Save with Auto-suggest
```
User: /memory "Stop using sed for file edits"

Agent determines this is about tool selection
Suggests topic: agent-tooling
Gets confirmation
Saves to aidd-project/context/agent-tooling.mdc
```

### Example 2: Save to Specific Topic
```
User: /memory testing "Run unit tests before integration tests"

Agent saves directly to aidd-project/context/testing.mdc
No confirmation needed (topic specified)
```

### Example 3: Natural Language Query
```
User: /memory what did I tell you about testing?

Agent searches testing-related topics
Summarizes findings from testing.mdc and tech-stack.mdc
```

## Integration

This skill works with:
- Cursor .mdc rules (compatible format)
- AIDD agent orchestrator (please.mdc)
- Tech stack feature (migration path)
- Other AIDD commands (/discover, /task, etc.)

Agents should check memories before:
- Making technology choices
- Selecting tools
- Following patterns
- Writing code that might violate learned constraints

## Success Indicators

✅ Agents stop repeating corrected mistakes
✅ Project conventions are consistently followed
✅ Tech stack choices align with user preferences
✅ Users feel heard and guidance is retained
✅ Memory suggestions are accurate and helpful
✅ Conflicts are resolved smoothly
✅ Interface feels natural and conversational

/welcome
