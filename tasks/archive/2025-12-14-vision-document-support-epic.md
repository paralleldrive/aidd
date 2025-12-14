# Vision Document Support Epic

**Epic Goal**: Add vision document support to guide AI agents in understanding project goals and resolving conflicts

**Status**: ✅ COMPLETED
**Created**: 2025-12-14
**Completed**: 2025-12-14
**Estimated Effort**: Small

## Epic Overview

Add support for a `vision.md` document that AI agents should read before creating or running tasks. The vision document provides project context, goals, and serves as the source of truth for resolving conflicts.

**Context**: AI agents need project context to make informed decisions. The vision document captures the project's purpose, goals, and constraints so agents can align their work accordingly.

**Success Criteria**:

- [x] AGENTS.md includes directive to read vision document before tasks
- [x] Conflict resolution guidance: ask user when conflicts with vision arise
- [x] README updated with vision document section and template
- [x] Getting started guide mentions vision document creation

---

## Task 1: Add Vision Document Directives to AGENTS.md

**Context**: AGENTS.md should instruct AI agents to consult the vision document

**Requirements**:

- Given an AI agent starting work, should read vision.md first
- Given a conflict with vision document, should ask user for clarification
- Given no vision document exists, should proceed with caution

**Success Criteria**:

- [x] AGENTS.md contains directive: "Read vision document before creating/running tasks"
- [x] AGENTS.md contains directive: "If conflicts arise with vision, ask user"

**Dependencies**: None
**Estimated Effort**: Small

---

## Task 2: Document Vision Document in README

**Context**: Users need guidance on creating and using vision documents

**Requirements**:

- Given a new user, should understand purpose of vision document
- Given the README, should include vision document template
- Given getting started guide, should mention vision document creation

**Success Criteria**:

- [x] README includes Vision Document section
- [x] Template provided for vision.md structure
- [x] Getting started mentions creating vision.md

**Dependencies**: Task 1
**Estimated Effort**: Small

---

## Implementation Notes

The vision document support is implemented through:

1. **AGENTS.md directives** (`lib/agents-md.js`):
   - "Read the vision document (vision.md) before creating or running tasks"
   - "If you encounter conflicts with the vision document, ask the user for clarification"

2. **README documentation**:
   - Vision Document section explaining purpose
   - Template with Goals, Non-Goals, Technical Constraints sections
   - Guidance on conflict resolution

3. **CLI success message**:
   - Prompts user to create vision.md as first step
