# AIDD Framework Project Plan

## Current Epics

### 🚧 `npx aidd create` Remediation Epic

**Status**: 🚧 IN PROGRESS
**File**: [`tasks/aidd-create-remediation-epic.md`](./tasks/aidd-create-remediation-epic.md)
**Goal**: Fix correctness, safety, and maintainability gaps found in the post-implementation review of the `create` subcommand
**Tasks**: 10 tasks (pre-commit hook, cleanup tip path, ambiguous step, manifest existence, AGENTS.md e2e instruction, CLAUDE.md on install, js-yaml direct dep, scaffold authoring docs, git-clone clarification, factor out handlers)

### 📋 `npx aidd create` Epic

**Status**: 📋 PLANNED  
**File**: [`tasks/npx-aidd-create-epic.md`](./tasks/npx-aidd-create-epic.md)  
**Goal**: Add a `create` subcommand that scaffolds new apps from manifest-driven extensions with fresh `@latest` installs  
**Tasks**: 7 tasks (create subcommand, extension resolver, manifest runner, scaffold-cleanup subcommand, scaffold-example, next-shadcn stub, e2e tests)  

### 📋 Context7 Installation Epic

**Status**: 📋 PLANNED  
**File**: [`tasks/context7-installation-epic.md`](./tasks/context7-installation-epic.md)  
**Goal**: Install Context7 MCP server to provide agents access to up-to-date documentation for popular libraries, frameworks, and APIs  
**Tasks**: 2 tasks (API key gathering, installation execution)

### 📋 Context7 GitHub Action Epic

**Status**: 📋 PLANNED  
**File**: [`tasks/context7-github-action-epic.md`](./tasks/context7-github-action-epic.md)  
**Goal**: Integrate Context7 GitHub Action to automatically maintain up-to-date code documentation for LLMs and AI code editors  
**Tasks**: 6 tasks (configuration, workflow creation, API integration, release integration, testing, documentation)
