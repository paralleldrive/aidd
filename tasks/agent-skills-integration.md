# Agent Skills Integration Epic

**Status**: COMPLETED
**Goal**: Add agentskills.io compatible skills for multi-agent support

## Overview

AIDD workflows need to work reliably across multiple AI agents (Claude Code, Cursor, Antigravity, etc.). By adopting the agentskills.io specification, we provide a unified skills format that all compatible agents can discover and use. This improves process adherence and reduces agent-specific configuration.

---

## Create Skills Directory Structure

Set up `skills/` directory with skill subdirectories.

**Requirements**:
- Given AIDD installation, should have `skills/` at project root
- Given each skill, should have its own directory with SKILL.md
- Given complex skills, should have `references/` subdirectory for progressive loading

---

## Create Discovery Skill

Convert productmanager.mdc to aidd-discover skill.

**Requirements**:
- Given product discovery request, should guide through persona creation
- Given user journey mapping, should output to plan/story-map/
- Given missing vision.md, should prompt user to create first

---

## Create Task Planning Skill

Convert task-creator.mdc to aidd-task skill.

**Requirements**:
- Given feature request, should break into atomic tasks
- Given each task, should define "Given X, should Y" requirements
- Given approved plan, should create epic file in tasks/

---

## Create TDD Execution Skill

Convert tdd.mdc to aidd-execute skill.

**Requirements**:
- Given task epic, should follow red-green-refactor cycle
- Given each requirement, should write test first
- Given passing tests, should get approval before next requirement

---

## Create Code Review Skill

Convert review.mdc to aidd-review skill.

**Requirements**:
- Given code changes, should check against OWASP Top 10
- Given security concerns, should use SHA3-256 for timing-safe comparison guidance
- Given review complete, should provide actionable feedback

---

## Create Activity Logging Skill

Convert log.mdc to aidd-log skill.

**Requirements**:
- Given completed epic, should append to activity-log.md
- Given log entry, should use appropriate emoji category
- Given existing log, should not overwrite previous entries

---

## Create Commit Skill

Convert commit.md to aidd-commit skill.

**Requirements**:
- Given staged changes, should suggest conventional commit format
- Given commit type, should follow feat/fix/docs/etc convention
- Given message, should limit first line to 50 characters

---

## Create User Testing Skill

Convert user-testing.mdc to aidd-user-test skill.

**Requirements**:
- Given user journey, should generate human test script
- Given user journey, should generate AI agent test script
- Given persona, should extend with techLevel and patience attributes

---

## Update Documentation

Update AGENTS.md with skills setup instructions.

**Requirements**:
- Given new agent user, should explain skills/ directory purpose
- Given Claude Code user, should explain CLAUDE.md and symlink setup
- Given Cursor user, should explain .cursor/skills symlink setup
