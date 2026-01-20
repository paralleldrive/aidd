# AIDD Skills

Agent skills for AI-Driven Development workflows.

## Primary Commands

These are the main entry points. Each command activates its corresponding skill.

- `/commit` - create a conventional commit for staged changes
- `/discover` - Enter interactive product discovery planning mode
- `/execute` - implement code using TDD (red-green-refactor cycle)
- `/log` - log completed epics to activity-log.md
- `/review` - conduct a thorough code review focusing on code quality, best practices, and adherence to project standards
- `/task` - create a task/epic
- `/user-test <journey>` - Generate human and agent scripts, save to $projectRoot/plan/

## Skills

### aidd-commit

Create git commits using conventional commit format. Use when committing code changes to maintain consistent, meaningful commit history.

**Skill:** [`aidd-commit/SKILL.md`](./aidd-commit/SKILL.md)

**Commands:**
- `/commit` - create a conventional commit for staged changes

### aidd-discover

Product discovery and user journey mapping. Use when exploring what to build, creating user stories, defining personas, or mapping user journeys.

**Skill:** [`aidd-discover/SKILL.md`](./aidd-discover/SKILL.md)

**Commands:**
- `/discover` - Enter interactive product discovery planning mode
- `/research` - Chat to discover user research
- `/setup` - Ask about project metadata
- `/generate [persona|journey|storymaps|userStories|feature]` - Suggest items
- `/feature` - Plan a feature, output PRD
- `/save` - Export to YAML
- `/cancel [step]` - Cancel a story

### aidd-execute

Implement tasks using Test-Driven Development. Use when implementing features, fixing bugs, or writing code. Follows red-green-refactor cycle with strict test-first discipline.

**Skill:** [`aidd-execute/SKILL.md`](./aidd-execute/SKILL.md)

**Commands:**
- `/execute` - implement code using TDD (red-green-refactor cycle)

### aidd-log

Document completed work to activity-log.md. Use after finishing an epic or significant piece of work to maintain a record of what was accomplished.

**Skill:** [`aidd-log/SKILL.md`](./aidd-log/SKILL.md)

**Commands:**
- `/log` - log completed epics to activity-log.md

### aidd-review

Conduct thorough code reviews focusing on quality, security, and standards. Use when reviewing pull requests, auditing code changes, or checking implementation against requirements.

**Skill:** [`aidd-review/SKILL.md`](./aidd-review/SKILL.md)

**Commands:**
- `/review` - conduct a thorough code review focusing on code quality, best practices, and adherence to project standards

### aidd-task

Plan and break down epics into manageable tasks. Use when starting a new feature, planning implementation work, or breaking down complex requests into sequential steps.

**Skill:** [`aidd-task/SKILL.md`](./aidd-task/SKILL.md)

**Commands:**
- `/task` - create a task/epic

### aidd-user-test

Generate human and AI agent test scripts from user journeys. Use when creating user acceptance tests, preparing for usability testing, or setting up automated user journey validation.

**Skill:** [`aidd-user-test/SKILL.md`](./aidd-user-test/SKILL.md)

**Commands:**
- `/user-test <journey>` - Generate human and agent scripts, save to $projectRoot/plan/
- `/run-test <script>` - Execute agent script with screenshots

