# AIDD Framework Project Plan

## Current Epics

### 📋 `aidd create --prompt` Epic

**Status**: 📋 PLANNED  
**File**: [`tasks/aidd-create-prompt-epic.md`](./tasks/aidd-create-prompt-epic.md)  
**Goal**: Add `--prompt` to `npx aidd create`, a standalone `npx aidd agent` subcommand, and a portable agent-config library so agents are invoked consistently and non-interactively across the AIDD toolkit

### 📋 `npx aidd create` Epic

**Status**: 📋 PLANNED  
**File**: [`tasks/npx-aidd-create-epic.md`](./tasks/npx-aidd-create-epic.md)  
**Goal**: Add a `create` subcommand that scaffolds new apps from manifest-driven extensions with fresh `@latest` installs  
**Tasks**: 6 tasks (create subcommand, extension resolver, manifest runner, scaffold-example, next-shadcn stub, e2e tests) — scaffold-cleanup is internal (auto-cleanup in `finally`)  

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

### 📋 Jiron Support Epic

**Status**: 📋 PLANNED
**File**: [`tasks/jiron-support-epic.md`](./tasks/jiron-support-epic.md)
**Goal**: Enable self-describing APIs that agents browse with one generic capability - replacing explicit tool definitions
**Tasks**: 8 tasks (jiron-server rule, jiron-api command, jiron-client rule, jiron-component command, dual-render rule, dual-view command, streaming middleware, jiron-agent rule)
