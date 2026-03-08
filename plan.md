# AIDD Framework Project Plan

## Current Epics

### 📋 `npx aidd churn` Epic

**Status**: 🔄 IN PROGRESS (core + bug fixes complete, follow-ups remaining)  
**File**: [`tasks/aidd-churn-epic.md`](./tasks/aidd-churn-epic.md)  
**Goal**: CLI command that ranks files by composite hotspot score (LoC × churn × complexity + gzip density) to identify prime PR split candidates  
**Tasks**: Core complete. Remaining: filter non-source files, deduplicate ScoredFile typedef.

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
