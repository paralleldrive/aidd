# AIDD Framework vs Spec-Kit: A Comprehensive Comparison

## Quick Summary

| Aspect | Spec-Kit | AIDD Framework |
|--------|----------|----------------|
| **Primary Focus** | Planning what to build | Building, testing, reviewing, and maintaining software |
| **Scope** | Specification → Implementation | Full development lifecycle |
| **Platform** | General purpose, any tech stack | Optimized for NextJS/React (works with others) |
| **Includes Runtime** | No | Yes (Server Framework, utilities) |
| **Test Integration** | Tasks phase | TDD built into execution |
| **Code Review** | Not included | Automated review workflow |

## Overview

**Spec-Kit** and **AIDD Framework** are complementary tools that address different stages of AI-driven software development. Understanding when to use each—or how to use them together—can significantly improve your development workflow.

## Spec-Kit: Planning What to Build

[Spec-Kit](https://github.com/github/spec-kit) is GitHub's open-source toolkit for **Spec-Driven Development**. It excels at transforming ideas into well-structured specifications that AI agents can implement.

### Core Philosophy

Spec-Kit treats specifications as executable blueprints rather than disposable scaffolding. Instead of writing code first and documenting later, developers articulate requirements upfront, then use AI agents to generate aligned implementations.

### Four-Phase Workflow

1. **Specify** – Describe goals and user journeys; the agent drafts a detailed spec
2. **Plan** – Declare architecture, stack, and constraints; the agent proposes a technical plan
3. **Tasks** – Break work into small, reviewable units
4. **Implement** – Generate code based on tasks

### Key Commands

```
/speckit.constitution  - Establish project governing principles
/speckit.specify       - Define requirements and user stories
/speckit.plan          - Create technical implementation strategies
/speckit.tasks         - Generate actionable task lists
/speckit.implement     - Execute the build process
/speckit.clarify       - Resolve underspecified areas
/speckit.analyze       - Check cross-artifact consistency
```

### Strengths

- **Agent-agnostic**: Works with 15+ AI assistants (Claude, Copilot, Gemini, Cursor, etc.)
- **Strong specification discipline**: Forces clear thinking before coding
- **Gated phases**: Explicit checkpoints prevent premature implementation
- **Tech-stack neutral**: No assumptions about your technology choices
- **Great for 0-to-1**: Excellent for greenfield projects

## AIDD Framework: Building Production Software

AIDD Framework is a comprehensive system for **AI-Driven Development** that handles the full software lifecycle—from discovery through deployment and maintenance.

### Core Philosophy

AIDD puts high-quality software engineering processes on autopilot rails. It implements time-tested workflows including specification-driven development, systematic task planning with Test Driven Development (TDD), and automated code review with best practices enforcement.

### Complete Development Lifecycle

```
/discover  - Identify what to build (product discovery)
/task      - Plan implementation with structured epics
/execute   - Build with TDD (test-first development)
/review    - Automated code review and quality checks
/log       - Track changes in activity log
/commit    - Commit with proper formatting
```

### What's Included

1. **Agent Runtime** – Orchestration for multi-agent workflows
2. **SudoLang Prompt Language** – Typed pseudocode for AI orchestration
3. **Server Framework** – Composable backend for Node/Next.js
4. **Utilities & Component Library** – Reusable patterns and recipes
5. **Development Rules** – JavaScript/TypeScript best practices, TDD patterns
6. **Product Management Tools** – User stories, journey mapping

### Platform Optimization

While AIDD works with any tech stack, it's **specifically optimized for web platform apps** built on:

- **Next.js** – App Router, API routes, middleware patterns
- **React** – Component patterns, state management, hooks
- **Node.js** – Server-side patterns, API development
- **TypeScript** – Type-safe development throughout

If you're building on this stack, AIDD provides:
- Pre-built server middleware (auth, CORS, config, request tracking)
- Integration with [better-auth](https://www.better-auth.com/) for authentication
- React component patterns and utilities
- Next.js-specific best practices and patterns

## When to Use Each

### Use Spec-Kit When:

- Starting a **greenfield project** with unclear requirements
- Working with a **non-JavaScript/TypeScript** tech stack
- Needing to **explore multiple approaches** before committing
- Your team needs strong **specification discipline**
- Working with stakeholders who need **documentation artifacts**
- Using AI assistants other than Claude (especially GitHub Copilot)

### Use AIDD Framework When:

- Building **production web applications** with NextJS/React
- Need **full lifecycle support** (not just planning)
- Want **TDD integrated** into your AI workflow
- Need **automated code review** and quality enforcement
- Require **server-side utilities** (auth, CORS, config management)
- Working primarily with **Claude** or **Cursor**
- Maintaining an **existing codebase** (not just greenfield)

### Use Both Together:

For complex projects, consider using Spec-Kit for initial specification and AIDD for implementation:

1. **Spec-Kit**: `/speckit.specify` → `/speckit.plan` → `/speckit.tasks`
2. **AIDD**: `/task` (import Spec-Kit tasks) → `/execute` → `/review` → `/commit`

## Feature Comparison

### Specification & Planning

| Feature | Spec-Kit | AIDD |
|---------|----------|------|
| Specification writing | `/speckit.specify` | `/discover` |
| Technical planning | `/speckit.plan` | `/task` |
| Task breakdown | `/speckit.tasks` | `/task` (epic format) |
| Constitution/principles | `/speckit.constitution` | `vision.md` |
| Clarification tools | `/speckit.clarify` | Built into `/discover` |

### Implementation & Quality

| Feature | Spec-Kit | AIDD |
|---------|----------|------|
| Code generation | `/speckit.implement` | `/execute` |
| Test-Driven Development | Not integrated | Core workflow |
| Code review | Not included | `/review` |
| Best practices rules | Not included | Comprehensive rules |
| Commit workflow | Not included | `/commit` |

### Runtime & Utilities

| Feature | Spec-Kit | AIDD |
|---------|----------|------|
| Server framework | Not included | Full framework |
| Authentication | Not included | better-auth integration |
| Middleware patterns | Not included | Composable middleware |
| Component library | Not included | React patterns |
| TypeScript utilities | Not included | Included |

## Migration & Interoperability

### From Spec-Kit to AIDD

If you've created specifications with Spec-Kit and want to implement with AIDD:

1. Copy your Spec-Kit specification into a `vision.md` file
2. Use `/task` to create AIDD-style epics from your Spec-Kit tasks
3. Execute with `/execute` for TDD-based implementation
4. Review with `/review` before committing

### Using AIDD's Discover Phase

AIDD's `/discover` command provides similar functionality to Spec-Kit's specify phase:
- User journey mapping
- Story point estimation
- Epic breakdown
- Requirements clarification

## Conclusion

**Spec-Kit** excels at the critical work of **turning ideas into specifications**. It's ideal for teams that need strong planning discipline and work across diverse tech stacks.

**AIDD Framework** provides a **complete production development system**. It's ideal for teams building web applications (especially NextJS/React) who want AI assistance throughout the entire development lifecycle.

For maximum effectiveness:
- Use **Spec-Kit** when you need to deeply explore *what* to build
- Use **AIDD** when you need to actually *build, test, and maintain* it
- Use **both** for complex projects requiring strong specification discipline *and* production-quality implementation

---

## Resources

- [AIDD Framework](https://github.com/paralleldrive/aidd) - GitHub Repository
- [Spec-Kit](https://github.com/github/spec-kit) - GitHub Repository
- [SudoLang Documentation](https://github.com/paralleldrive/sudolang-llm-support/) - AIDD's prompt language
- [AIDD Server Framework](../docs/server/README.md) - Server documentation
