# Vision Document Guide

The vision document (`vision.md`) is the single source of truth for your project's purpose, goals, and constraints. AI agents read this document before starting any task to ensure their work aligns with your project's direction.

## Why Vision Documents Matter

Without a vision document, AI agents:
- Make assumptions that may not match your intent
- Propose solutions that conflict with your architecture
- Miss important constraints or requirements
- Waste time on approaches you've already rejected

With a vision document, AI agents:
- Understand the "why" behind your project
- Make decisions aligned with your goals
- Respect your technical constraints
- Ask for clarification when conflicts arise

## What Makes a Great Vision Document

### 1. Clear Purpose Statement

Start with a single paragraph that captures the essence of your project. This should answer: "What problem does this solve and for whom?"

```markdown
## Purpose

[Project Name] is a [type of application] that helps [target users]
[achieve specific outcome] by [key differentiator/approach].
```

**Good example:**
> TaskFlow is a project management tool that helps remote engineering teams
> ship software faster by providing AI-assisted task breakdown and automatic
> dependency detection.

**Weak example:**
> TaskFlow is a task management app. *(Too vague - could be anything)*

### 2. Explicit Goals

List 3-7 concrete goals. Each goal should be:
- **Specific** - Not vague aspirations
- **Measurable** - You can tell when it's achieved
- **Prioritized** - Ordered by importance

```markdown
## Goals

1. **Primary:** [Most important goal]
2. **Secondary:** [Supporting goal]
3. **Tertiary:** [Nice-to-have goal]
```

**Good example:**
```markdown
## Goals

1. **Sub-second task creation** - Users can create a task in under 1 second
2. **Zero-config AI suggestions** - AI task breakdown works without setup
3. **Offline-first** - Full functionality without internet connection
4. **Team sync under 5s** - Changes propagate to team members within 5 seconds
```

**Weak example:**
```markdown
## Goals

1. Make it fast
2. Use AI
3. Be user-friendly
```

### 3. Non-Goals (Equally Important)

Explicitly state what your project will NOT do. This prevents scope creep and helps AI agents avoid suggesting features you've intentionally excluded.

```markdown
## Non-Goals

- [Thing that seems related but we won't build]
- [Feature we're intentionally excluding]
- [Approach we've rejected and why]
```

**Good example:**
```markdown
## Non-Goals

- **Not a Jira replacement** - We won't support enterprise workflows, custom fields, or complex permissions
- **No time tracking** - Users track time elsewhere; we focus on task flow
- **No mobile app** - PWA only; native apps add maintenance burden without proportional value
- **No real-time collaboration** - Eventual consistency is fine; real-time adds complexity
```

### 4. Technical Constraints

Document the technical decisions that are non-negotiable. AI agents will respect these constraints when proposing solutions.

```markdown
## Technical Constraints

- **Stack:** [Required technologies]
- **Architecture:** [Patterns that must be followed]
- **Dependencies:** [What can/cannot be added]
- **Performance:** [Hard requirements]
```

**Good example:**
```markdown
## Technical Constraints

- **Stack:** TypeScript, React, Node.js, PostgreSQL - no exceptions
- **No ORMs:** Use raw SQL with parameterized queries only
- **Bundle size:** Client JS must stay under 100KB gzipped
- **No new dependencies** without explicit approval - prefer stdlib
- **Functional core:** Business logic must be pure functions
- **Edge deployment:** Must run on Cloudflare Workers (no Node-specific APIs)
```

### 5. User Context

Help AI agents understand who they're building for:

```markdown
## Users

**Primary:** [Who uses this most]
- [Key characteristic]
- [Pain point we solve]

**Secondary:** [Other users]
- [How their needs differ]
```

**Good example:**
```markdown
## Users

**Primary:** Engineering team leads (5-15 person teams)
- Technical but time-constrained
- Need visibility without micromanagement
- Currently using spreadsheets or basic tools

**Secondary:** Individual contributors
- Want minimal friction in daily workflow
- Allergic to bloated enterprise tools
- Value keyboard shortcuts and speed
```

### 6. Success Criteria

Define what "done" looks like:

```markdown
## Success Criteria

- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]
- [ ] [Measurable outcome 3]
```

**Good example:**
```markdown
## Success Criteria

- [ ] Team of 10 can manage 100+ tasks without performance degradation
- [ ] New user can create first task within 30 seconds of signup
- [ ] AI suggestions accepted >60% of the time
- [ ] Zero data loss in 1 year of operation
```

## Template

```markdown
# [Project Name] Vision

## Purpose

[One paragraph describing what this project does, for whom, and why it matters]

## Goals

1. **[Goal 1]:** [Specific, measurable description]
2. **[Goal 2]:** [Specific, measurable description]
3. **[Goal 3]:** [Specific, measurable description]

## Non-Goals

- **[Non-goal 1]:** [Why we're not doing this]
- **[Non-goal 2]:** [Why we're not doing this]

## Technical Constraints

- **Stack:** [Required technologies]
- **Architecture:** [Required patterns]
- **[Other constraint]:** [Details]

## Users

**Primary:** [Description]
**Secondary:** [Description]

## Success Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]
```

## How AI Agents Use Vision Documents

When you run commands like `/task` or `/execute`, AI agents:

1. **Read vision.md first** - Before planning any work
2. **Check alignment** - Verify the task fits within goals and constraints
3. **Respect non-goals** - Won't suggest features you've excluded
4. **Ask when unclear** - If a task conflicts with the vision, they'll ask you

### Conflict Resolution

If an AI agent encounters a conflict between a task and your vision:

```
Task: "Add real-time collaboration"
Vision: "No real-time collaboration - eventual consistency is fine"

Agent: "This task conflicts with the vision document which states
'No real-time collaboration.' Should I:
1. Proceed anyway (update vision if this is a direction change)
2. Suggest an alternative that fits within current constraints
3. Skip this task"
```

## Maintaining Your Vision Document

- **Update when direction changes** - Don't let it become stale
- **Add non-goals as you reject ideas** - Document decisions
- **Keep it concise** - One page is ideal, two pages maximum
- **Review quarterly** - Does it still reflect your project's direction?

## Location

Place your vision document at the root of your project:

```
your-project/
├── vision.md          ← Here
├── ai/
├── src/
└── package.json
```

AI agents will automatically find and read it before starting tasks.
