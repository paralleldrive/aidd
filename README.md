# AIDD Framework

[![AIDD Framework](https://img.shields.io/badge/✨_AIDD_Framework-black)](https://github.com/paralleldrive/aidd)[![Parallel Drive](https://img.shields.io/badge/🖤_Parallel_Drive-000000?style=flat)](https://paralleldrive.com)

**The standard framework for AI Driven Development**

AI agents like Claude Code ship features fast. aidd Framework keeps them working, secure, and maintainable.

AI agents generate code that runs but fails at scale. [GitClear tracked 211 million lines from 2020 to 2024](https://leaddev.com/software-quality/how-ai-generated-code-accelerates-technical-debt) and found 8x more code duplication as AI adoption increased. [Google's DORA report](https://www.sonarsource.com/blog/the-inevitable-rise-of-poor-code-quality-in-ai-accelerated-codebases/) shows AI adoption correlates with 9% higher bug rates and degraded stability. Agents skip tests, couple modules, duplicate logic, and miss vulnerabilities.

AIDD provides the architecture, test workflows, and specification system that turn AI speed into sustainable velocity so you can ship secure, production-ready, maintainable software, quickly.

Includes:

- **AIDD CLI** – project bootstrap and automation
- **Agent Runtime** – workflows from product discovery to commit and release
- **SudoLang Prompt Language** – typed pseudocode for AI orchestration
- **Server Framework** – composable backend for Node and Next.js
- **Utilities & Component Library** – common patterns and reusable recipes to accelerate your app development

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [About AIDD Framework](#about-aidd-framework)
- [🚀 Quick Start with AIDD CLI](#-quick-start-with-aidd-cli)
  - [📋 Requirements](#-requirements)
  - [Detailed Installation Instructions](#detailed-installation-instructions)
- [Development Workflow](#development-workflow)
- [🧪 User Testing](#-user-testing)
- [Why SudoLang?](#why-sudolang)
- [What's Included](#whats-included)
- [📚 Learning aidd Framework](#-learning-aidd-framework)
- [🚀 AIDD Server Framework](#-aidd-server-framework)
  - [Authentication Middleware](#authentication-middleware)
- [🛠️ AIDD CLI Reference](#-aidd-cli-reference)
  - [Installation & Usage](#installation--usage)
  - [Command Options](#command-options)
  - [Examples](#examples)
- [🧩 Skills](#-skills)
- [📁 AI System Structure](#-ai-system-structure)
  - [Key Components](#key-components)
- [🎯 AI Integration](#-ai-integration)
- [📋 Vision Document](#-vision-document)
  - [Why You Need a Vision Document](#why-you-need-a-vision-document)
  - [Creating Your Vision Document](#creating-your-vision-document)
  - [How Agents Use the Vision Document](#how-agents-use-the-vision-document)
  - [AGENTS.md File](#agentsmd-file)
    - [Migrating an Existing AGENTS.md](#migrating-an-existing-agentsmd)
  - [`aidd-custom/` — Project Customization](#aidd-custom--project-customization)
- [🔧 Cursor Editor Setup](#-cursor-editor-setup)
  - [Automatic Setup (Recommended)](#automatic-setup-recommended)
  - [When to Use `--cursor`](#when-to-use---cursor)
  - [When NOT to Use `--cursor`](#when-not-to-use---cursor)
  - [Manual Integration](#manual-integration)
  - [Troubleshooting](#troubleshooting)
- [📄 License](#-license)
- [📹 Weekly Training Sessions](#-weekly-training-sessions)
- [🤝 Contributing](#-contributing)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## About AIDD Framework

**AI-Driven Development (AIDD)** is a methodology where AI systems take primary responsibility for generating, testing, and documenting code, automating most of the software creation process so humans can focus on the big picture and 10× their productivity.

AIDD Framework is a collection of reusable metaprograms, agent orchestration systems, and prompt modules that put high-quality software engineering processes on autopilot rails. It implements time-tested workflows including specification-driven development, systematic task planning with Test Driven Development (TDD), and automated code review with best practices enforcement.

**SudoLang** is a pseudocode language for prompting large language models with clear structure, strong typing, and explicit control flow.

**AI Workflow Commands** - Use these in your AI assistant chat (Cursor, ChatGPT, Claude, etc.):

```
/discover - what to build
/task - plan a task epic to implement a user story from the discovery
/execute - task epics with TDD
/review - the results
/log - log the changes to the activity log
/commit - commit the changes to the repository
/user-test - generate user testing scripts for post-deploy validation
```

## 🚀 Quick Start with AIDD CLI

```
npx aidd --help
```

To install for Cursor:

```
# In your project folder
npx aidd --cursor
```

Install without Cursor integration:

```
# You can also specify a project folder:
npx aidd my-project
```

```bash
# Run an agent directly
npx aidd agent --prompt "Set up authentication"
# Scaffold + run agent in one command
npx aidd create my-app --prompt "Set up authentication"
```

For `npx aidd create` with a **GitHub repository URL** (`https://github.com/owner/repo`), authentication uses the GitHub CLI first when available: run [`gh auth login`](https://cli.github.com/) so private repos you can access (including org repos you do not own) work without exporting a long-lived token. If `gh` is not available or not logged in, you can still set `GITHUB_TOKEN` or `GH_TOKEN` for CI or compatibility.

_See [Agent CLI](docs/agent-cli.md) for full usage._

### 📋 Requirements

- **Node.js**: 16.0.0+ (requires ESM support)
- **Environment**: Unix/Linux shell (bash, zsh) or Windows with WSL
- **Editors**: Works with any editor; optimized for Cursor
- **LLM**: Works with any sufficiently advanced LLM. As of this writing, we recommend Claude 4.5 Sonnet.
- **Agents**: You can ask most agent systems to use this system.

### Detailed Installation Instructions

1. **Install SudoLang syntax highlighting**: Visit the [SudoLang Github Repository](https://github.com/paralleldrive/sudolang-llm-support) and install syntax highlighting for your editor.

2. **Clone the AI system**:

   ```bash
   # Recommended: Creates ai/ folder + .cursor symlink for automatic integration
   npx aidd --cursor my-project

   # Alternative: Just the ai/ folder (manual integration required)
   npx aidd my-project
   ```

3. **Create a Vision Document** (important!):

   Create a `vision.md` file in your project root. This document serves as the source of truth for AI agents. See [Vision Document](#-vision-document) for details.

4. **Explore the structure**:

   ```bash
   cd my-project
   ls ai/                    # See available components
   cat ai/skills/aidd-please/SKILL.md   # Read the main orchestrator
   ```

5. **Start using AI workflows**:
   - Reference `ai/skills/` in AI prompts for better context
   - Use `ai/commands/` as workflow templates
   - Customize skills for your specific project needs

This gives you immediate access to:

- 🤖 **Agent orchestration skills** (`ai/skills/`)
- ⚙️ **AI workflow commands** (`ai/commands/`)
- 📋 **Development best practices** (JavaScript, TDD, UI/UX)
- 🎯 **Product management tools** (user stories, journey mapping)

## Development Workflow

For features or bug fixes spanning more than a few lines:

1. **Create a branch**: `git checkout -b your-branch-name`
2. **Discover what to build with `/discover`**: Set up your project profile and discover key user journeys to create a user story map (saved to `plan/story-map/`)
3. **Plan execution with `/task`**: Create a structured epic with clear requirements
4. **Review with `/review`**: Eliminate duplication, simplify without losing requirements
5. **Execute with `/execute`**: Implement using TDD, one requirement at a time
6. **Push and PR**: `git push origin your-branch-name` then open a Pull Request

Note: We use this process to build the `aidd` framework. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 🧪 User Testing

**Validate features with real users and AI agents.** AIDD generates dual testing scripts from user journeys:

- **Human scripts** - Think-aloud protocol with video recording for manual testing
- **AI agent scripts** - Executable tests with screenshots and persona-based behavior

Research from the [Nielsen Norman Group](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/) shows that testing with just 3-5 users reveals 65-85% of usability problems. Iterate quickly by testing small, fixing issues, and testing again.

**Quick start**:

```bash
/discover              # Create user journey (saved to plan/story-map/)
/user-test journey.yaml  # Generate testing scripts (saved to plan/)
/run-test agent-script   # Execute AI agent test
```

📖 **[Read the complete User Testing Guide →](docs/user-testing.md)**

## Why SudoLang?

For most simple prompts, natural language is better. Use it. But if you need the AI to follow a program, obey constraints, keep track of complex state, or implement complex algorithms, SudoLang can be extremely useful.

- Because of the natural language emphasis, SudoLang is easier to learn than programming languages like JavaScript or Python.
- Pseudocode can [improve reasoning performance](https://arxiv.org/abs/2305.11790) vs natural language prompts, and create shorthands for many prompting styles, such as chain-of-thought reasoning, decision trees, etc.
- SudoLang is a declarative, constraint-based, interface-oriented programming language, which makes it one of the most expressive and compact programming languages in the world. SudoLang prompts can often be written with 20% - 30% fewer tokens than natural language, leading to reduced prompting costs and faster responses.
- Structured pseudocode provides scope blocks, indentation, and visual encapsulation which makes it easier to navigate and maintain complex prompts than natural language.
- Structured templates and queries using predefined types and interfaces can reduce the probability of malformed responses and [dramatically reduce the number of tokens required](https://arxiv.org/pdf/2212.06094.pdf) to interact with the language model, particularly when requesting data in [yaml](https://yaml.org/) or [csv](https://en.wikipedia.org/wiki/Comma-separated_values) formats.

Please read the [SudoLang documentation](https://github.com/paralleldrive/sudolang-llm-support/) for more information about the language.

## What's Included

Modules include:

- 🧠 Metaprograms for LLMs (programs that build programs)
- 🧭 Product discovery and story mapping
- 🤖 Agent behaviors and workflows
- 🧪 Test generators
- 🛠️ Development process automation scripts
- 🚀 Optional composable server framework (lightweight Express alternative)

Coming soon:

- 🎨 UI sketch prompts
- 📄 Documentation generators
- 🔌 API design

## 📚 Learning aidd Framework

aidd Framework combines modern software engineering practices with AI orchestration. To use it effectively, you'll benefit from understanding:

- **Product & Planning**: Product management, user story mapping, functional requirements
- **Development**: Test driven development, user testing, CI/CD workflows
- **AI-Specific Skills**: Context engineering, prompt engineering, SudoLang, agent orchestration

📖 **[Complete Learning Roadmap →](docs/learn-aidd-framework.md)** — Detailed competency areas, technical skills, and weekly training sessions

**New to AI-driven development?** Start with the Quick Start below, then explore the `/discover` → `/task` → `/execute` workflow. The AI agents will guide you through the process.

## 🚀 AIDD Server Framework

A lightweight alternative to Express, built for function composition and type-safe development.

**Why AIDD Server?**

- **Function composition** - Clean asyncPipe patterns instead of middleware chains
- **Type-safe** - Complete TypeScript definitions included
- **Secure by default** - Sanitized logging, explicit CORS, fail-fast configuration
- **Production-ready** - Comprehensive test coverage, battle-tested patterns

**Quick Example:**

```javascript
import {
  createRoute,
  withRequestId,
  createWithConfig,
  loadConfigFromEnv,
} from "aidd/server";

// Load API keys from environment with fail-fast validation
const withConfig = createWithConfig(() =>
  loadConfigFromEnv(["OPENAI_API_KEY", "DATABASE_URL"])
);

export default createRoute(
  withRequestId,
  withConfig,
  async ({ request, response }) => {
    // Throws immediately if OPENAI_API_KEY is missing
    const apiKey = response.locals.config.get("OPENAI_API_KEY");

    response.status(200).json({
      message: "Config loaded securely",
      requestId: response.locals.requestId,
    });
  }
);
```

- `aidd/agent` — spawn an AI agent process programmatically
- `aidd/agent-config` — resolve agent configuration from presets, env, or config file

_See [Agent API](docs/agent-api.md) for full usage._

**Core Features:**

- `createRoute` - Compose middleware with automatic error handling
- `createWithConfig` - Fail-fast configuration with `config.get()`
- `withRequestId` - CUID2 request tracking for logging
- `createWithCors` - Explicit origin validation (secure by default)
- `withServerError` - Standardized error responses
- `createWithAuth` / `createWithOptionalAuth` - Session validation with [better-auth](https://www.better-auth.com/)

### Authentication Middleware

AIDD Server includes optional auth middleware that wraps [better-auth](https://www.better-auth.com/) for session validation.

**1. Install better-auth:**

```bash
npm install better-auth
```

**2. Configure better-auth** (see [better-auth docs](https://www.better-auth.com/docs)):

```javascript
// lib/auth.server.js
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: yourDatabaseAdapter,
  emailAndPassword: { enabled: true },
});
```

**3. Create auth API route** (framework-specific):

```javascript
// Next.js: app/api/auth/[...all]/route.js
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth.server";

export const { GET, POST } = toNextJsHandler(auth);
```

**4. Use AIDD auth middleware in protected routes:**

```javascript
import { createRoute, withRequestId, createWithAuth } from "aidd/server";
import { auth } from "@/lib/auth.server";

const withAuth = createWithAuth({ auth });

// Protected route - returns 401 if not authenticated
export default createRoute(withRequestId, withAuth, async ({ response }) => {
  const { user } = response.locals.auth;
  response.json({ email: user.email });
});
```

**Optional auth** for public routes that benefit from user context:

```javascript
import { createWithOptionalAuth } from "aidd/server";

const withOptionalAuth = createWithOptionalAuth({ auth });

// Public route - user attached if logged in, null otherwise
export default createRoute(withOptionalAuth, async ({ response }) => {
  const user = response.locals.auth?.user;
  response.json({
    greeting: user ? `Hello, ${user.name}` : "Hello, guest",
  });
});
```

**Passkey authentication** (passwordless):

```bash
npm install @better-auth/passkey
```

```javascript
// lib/auth.server.js
import { betterAuth } from "better-auth";
import { passkey } from "@better-auth/passkey";

export const auth = betterAuth({
  database: yourDatabaseAdapter,
  plugins: [passkey()],
});
```

```javascript
// API route: Register passkey (requires authentication)
import { createRoute, createWithAuth } from "aidd/server";
import { auth } from "@/lib/auth.server";

const withAuth = createWithAuth({ auth });

export default createRoute(withAuth, async ({ request, response }) => {
  const { user } = response.locals.auth;

  // User is authenticated, register their passkey
  const result = await auth.api.addPasskey({
    body: { name: `${user.email}'s passkey` },
    headers: request.headers,
  });

  response.json(result);
});
```

```javascript
// API route: List user's passkeys
export default createRoute(withAuth, async ({ request, response }) => {
  const passkeys = await auth.api.listPasskeys({
    headers: request.headers,
  });
  response.json({ passkeys });
});
```

📖 **[See complete Server Framework documentation →](docs/server/README.md)**

## 🛠️ AIDD CLI Reference

The **AI Driven Development (AIDD)** CLI tool clones the complete AI agent orchestration system to any directory.

### Installation & Usage

```bash
# Recommended: Use npx (no installation required)
npx aidd [target-directory] [options]

# Alternative: Global installation
npm install -g aidd
aidd [target-directory] [options]
```

### Command Options

| Option             | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| `target-directory` | Directory to create `ai/` folder in (defaults to current)      |
| `-f, --force`      | Overwrite existing `ai/` folder                                |
| `-d, --dry-run`    | Show what would be copied without copying                      |
| `-v, --verbose`    | Provide detailed output                                        |
| `-c, --cursor`     | Create `.cursor` symlink for Cursor editor integration         |
| `-i, --index`      | Generate `index.md` files from frontmatter in `ai/` subfolders |
| `churn`            | Rank files by hotspot score — see [documentation](ai/skills/aidd-churn/README.md) |
| `-h, --help`       | Display help information                                       |
| `--version`        | Show version number                                            |

### Examples

```bash
# Basic usage
npx aidd                    # Current directory
npx aidd my-project        # Specific directory

# Hotspot analysis (see ai/skills/aidd-churn/SKILL.md for details)
npx aidd churn              # Rank files by hotspot score (top 20, 90-day window)
npx aidd churn --days 30 --top 10 --min-loc 100 --json

# Preview and force options
npx aidd --dry-run         # See what would be copied
npx aidd --force --verbose # Overwrite with details

# Cursor editor integration
npx aidd --cursor          # Create .cursor symlink
npx aidd my-project --cursor --verbose

# Generate index files
npx aidd --index           # Regenerate ai/ index.md files
npx aidd --index --verbose # Show all generated files

# Multiple projects
npx aidd frontend-app
npx aidd backend-api
```

## 🧩 Skills

Skills are reusable agent workflows that extend AIDD with specialized capabilities. Invoke them by name in any AI coding assistant.

- **[/aidd-agent-orchestrator](ai/skills/aidd-agent-orchestrator/README.md)** — Coordinates specialized agents for software development tasks. Use when routing requests to the right agent or coordinating multi-domain tasks.
- **[/aidd-autodux](ai/skills/aidd-autodux/README.md)** — Create and transpile Autodux Redux state management dux objects. Use when building Redux state management, defining reducers, action creators, or selectors.
- **[/aidd-churn](ai/skills/aidd-churn/README.md)** — Hotspot analysis: run `npx aidd churn`, interpret the ranked results, and recommend specific files to review or refactor with concrete strategies. Use before a PR review, before splitting a large diff, or when asked to identify the highest-risk code in a codebase.
- **[/aidd-ecs](ai/skills/aidd-ecs/README.md)** — Enforces @adobe/data/ecs best practices. Use when working with ECS components, resources, transactions, actions, systems, or services.
- **[/aidd-error-causes](ai/skills/aidd-error-causes/README.md)** — Structured error handling with the error-causes library. Use when throwing errors, catching errors, defining error types, or implementing error routing.
- **[/aidd-fix](ai/skills/aidd-fix/README.md)** — Fix a bug or implement review feedback following the AIDD fix process. Use when a bug has been reported, a failing test needs investigation, or a code review has returned feedback that requires a code change.
- **[/aidd-requirements](ai/skills/aidd-requirements/README.md)** — Write functional requirements for a user story. Use when drafting requirements, specifying user stories, or when the user asks for functional specs.
- **[/aidd-javascript](ai/skills/aidd-javascript/README.md)** — JavaScript and TypeScript best practices and guidance. Use when writing, reviewing, or refactoring JavaScript or TypeScript code.
- **[/aidd-javascript-io-effects](ai/skills/aidd-javascript-io-effects/README.md)** — Isolate network I/O and side effects using the saga pattern with call and put. Use when making network requests, invoking side effects, or implementing Redux sagas.
- **[/aidd-jwt-security](ai/skills/aidd-jwt-security/README.md)** — JWT security review patterns. Use when reviewing or implementing authentication code, token handling, or session management.
- **[/aidd-layout](ai/skills/aidd-layout/README.md)** — Enforces UI component layout and composition patterns. Use when designing layouts, spacing, gaps, or component hierarchy.
- **[/aidd-lit](ai/skills/aidd-lit/README.md)** — Enforces Lit element authoring best practices. Use when creating Lit elements, binding elements, presentations, or reactive binding patterns.
- **[/aidd-log](ai/skills/aidd-log/README.md)** — Document completed epics in a structured changelog with emoji categorization. Use after completing a significant feature or epic.
- **[/aidd-namespace](ai/skills/aidd-namespace/README.md)** — Ensures types and related functions are authored in a modular, discoverable, tree-shakeable pattern. Use when creating types, refactoring type folders, or defining schemas.
- **[/aidd-observe](ai/skills/aidd-observe/README.md)** — Enforces Observe pattern best practices from @adobe/data/observe. Use when working with observables, reactive data flow, or service Observe properties.
- **[/aidd-please](ai/skills/aidd-please/README.md)** — General AI assistant for software development projects. Use for general assistance, logging, committing, and proofing tasks.
- **[/aidd-product-manager](ai/skills/aidd-product-manager/README.md)** — Plan features, user stories, user journeys, and conduct product discovery. Use when building specifications, journey maps, story maps, or personas.
- **[/aidd-react](ai/skills/aidd-react/README.md)** — Enforces React component authoring best practices. Use when creating React components, binding components, or working with React UI patterns.
- **[/aidd-review](ai/skills/aidd-review/README.md)** — Conduct thorough code reviews focusing on quality, security, test coverage, and adherence to project standards. Use when reviewing code, pull requests, or completed epics.
- **[/aidd-service](ai/skills/aidd-service/README.md)** — Enforces asynchronous data service authoring best practices. Use when creating front-end or back-end services, service interfaces, or data flow patterns.
- **[/aidd-stack](ai/skills/aidd-stack/README.md)** — Tech stack guidance for NextJS + React/Redux + Shadcn UI features. Use when implementing full stack features or choosing architecture patterns.
- **[/aidd-structure](ai/skills/aidd-structure/README.md)** — Enforces source code structuring and interdependency best practices. Use when creating folders, moving files, adding imports, or planning module architecture.
- **[/aidd-sudolang-syntax](ai/skills/aidd-sudolang-syntax/README.md)** — Quick cheat sheet for SudoLang syntax. Use when writing or reading SudoLang pseudocode, interfaces, constraints, or function definitions.
- **[/aidd-task-creator](ai/skills/aidd-task-creator/README.md)** — Systematic task and epic planning and execution. Use when planning an epic, breaking down work, or executing a task plan.
- **[/aidd-tdd](ai/skills/aidd-tdd/README.md)** — Systematic test-driven development with proper test isolation. Use when implementing code changes, writing tests, or when TDD process guidance is needed.
- **[/aidd-timing-safe-compare](ai/skills/aidd-timing-safe-compare/README.md)** — Security rule for timing-safe secret comparison using SHA3-256 hashing. Use when reviewing or implementing secret comparisons, token validation, or API key checks.
- **[/aidd-ui](ai/skills/aidd-ui/README.md)** — Design beautiful and friendly user interfaces and experiences. Use when building UI components, styling, animations, accessibility, or responsive design.
- **[/aidd-user-testing](ai/skills/aidd-user-testing/README.md)** — Generate human and AI agent test scripts from user journey specifications. Use when creating user test scripts or validating user journeys.

## 📁 AI System Structure

After running the CLI, you'll have a complete `ai/` folder:

```
your-project/
├── ai/
│   ├── commands/              # Workflow commands
│   │   ├── help.md           # List available commands
│   │   ├── plan.md           # Project planning
│   │   ├── review.md         # Code reviews
│   │   ├── task.md           # Task management
│   │   └── ...
│   ├── skills/               # Agent orchestration skills
│   │   ├── aidd-please/      # Main agent orchestrator
│   │   ├── aidd-javascript/  # JS/TS best practices
│   │   ├── aidd-tdd/         # Test-driven development
│   │   ├── aidd-review/      # Code review guidelines
│   │   ├── aidd-ui/          # UI/UX design guidelines
│   │   └── ...
│   └── ...
├── plan/                     # Product discovery artifacts
│   ├── story-map/            # User journeys & personas (YAML)
│   ├── *-human-test.md       # Human test scripts
│   └── *-agent-test.md       # AI agent test scripts
└── your-code/
```

### Key Components

- **Agent Orchestrator** (`ai/skills/aidd-agent-orchestrator/SKILL.md`) - Coordinates multiple AI agents
- **Development Skills** (`ai/skills/aidd-javascript/`, `ai/skills/aidd-tdd/`) - Best practices and patterns
- **Workflow Commands** (`ai/commands/`) - Structured AI interaction templates
- **Product Management** (`ai/skills/aidd-product-manager/SKILL.md`) - User stories and journey mapping
- **Product Discovery Artifacts** (`plan/story-map/`) - User journeys, personas, and story maps (YAML format)
- **User Testing Scripts** (`plan/`) - Human and AI agent test scripts generated from journeys
- **UI/UX Guidelines** (`ai/skills/aidd-ui/SKILL.md`) - Design and user experience standards

## 🎯 AI Integration

This system is designed to work with AI coding assistants:

- **Cursor** - AI-first code editor
- **GitHub Copilot** - AI pair programmer
- **ChatGPT** - General AI assistance
- **Claude** - Advanced reasoning and code review

The rules provide context and structure for more effective AI interactions.

## 📋 Vision Document

The **vision document** (`vision.md`) is a critical component of AIDD that serves as the source of truth for AI agents working on your project.

### Why You Need a Vision Document

AI agents are powerful but need context to make good decisions. Without a clear vision:

- Agents may make architectural choices that conflict with your goals
- Features might be implemented in ways that don't align with your product direction
- Different agents working on the same project may take inconsistent approaches

### Creating Your Vision Document

Create a `vision.md` file in your project root with the following sections:

```markdown
# Project Vision

## Overview

Brief description of what this project does and who it's for.

## Goals

- Primary goal 1
- Primary goal 2
- ...

## Non-Goals (Out of Scope)

Things this project explicitly will NOT do.

## Key Constraints

- Technical constraints (e.g., must use specific frameworks)
- Business constraints (e.g., must be GDPR compliant)
- Performance requirements

## Architectural Decisions

Major technical decisions and their rationale.

## User Experience Principles

How the product should feel to users.

## Success Criteria

How we measure if the project is successful.
```

### How Agents Use the Vision Document

The AIDD system instructs agents to:

1. **Read the vision first** - Before creating or running any task, agents read `vision.md` to understand project context
2. **Check for conflicts** - When given a task, agents compare it against the vision to identify potential conflicts
3. **Ask for clarification** - If a task conflicts with the vision, agents will stop and ask you how to resolve the conflict rather than proceeding blindly

This ensures that all AI-generated code and decisions align with your project's goals.

### AGENTS.md File

When you run the AIDD installer, it automatically creates (or updates) an `AGENTS.md` file in your project root. This file contains directives that help AI agents:

- Navigate the `ai/` directory structure efficiently
- Use `index.md` files to understand folder contents without reading every file
- Practice progressive discovery (only reading folders relevant to the current task)
- Respect the vision document as the source of truth
- Handle conflicts appropriately
- Import project-specific overrides from `aidd-custom/AGENTS.md`

The root `AGENTS.md` includes an import directive that tells agents to load and prioritize project-specific settings from `aidd-custom/AGENTS.md`, ensuring your customizations override default framework behavior.

#### Migrating an Existing AGENTS.md

If your project already has an `AGENTS.md` file before you install AIDD:

1. **AIDD appends framework directives** — The installer adds AIDD’s standard agent directives to your existing root `AGENTS.md` rather than replacing the file wholesale.
2. **Move your custom instructions** — Copy your original, project-specific rules into `aidd-custom/AGENTS.md` (or merge them with any content the installer placed there).
3. **Preserve override behavior** — Keeping customizations in `aidd-custom/AGENTS.md` ensures they override framework defaults via the root file’s import directive.
4. **Trim the root file** — After migrating, the root `AGENTS.md` should contain only AIDD framework directives (plus the import of `aidd-custom/AGENTS.md`), not duplicated or conflicting custom text.

### `aidd-custom/` — Project Customization

The installer also creates `aidd-custom/config.yml` and `aidd-custom/AGENTS.md` in your project root. This folder is the place for project-specific overrides:

- **`config.yml`** — Framework behavior configuration (e.g., `e2eBeforeCommit`)
- **`AGENTS.md`** — Project-specific agent instructions that override root `AGENTS.md` settings
- **`skills/`** — Custom skills specific to your project
- **Additional `.md` files** — Extra agent rules and commands

Agents are instructed to read `aidd-custom/index.md` on startup so your customizations are always in context.

See [docs/aidd-custom.md](docs/aidd-custom.md) for all available options.

## 🔧 Cursor Editor Setup

The AIDD CLI can automatically set up the AI agent system for **Cursor editor** users.

### Automatic Setup (Recommended)

```bash
# Creates both ai/ folder AND .cursor symlink
npx aidd --cursor

# This creates:
# ai/           <- The complete AI system
# .cursor -> ai <- Symlink for Cursor integration
```

### When to Use `--cursor`

- ✅ **New projects**: No existing `.cursor` configuration
- ✅ **Cursor editor users**: Want automatic agent orchestration
- ✅ **Quick setup**: Want everything working immediately

### When NOT to Use `--cursor`

- ❌ **Existing `.cursor` folder**: You already have Cursor rules
- ❌ **Custom setup**: You want to manually integrate with existing rules
- ❌ **Non-Cursor editors**: Using VS Code, Vim, etc.

### Manual Integration

If you already have a `.cursor` folder or use a different editor:

```bash
# 1. Clone without symlink
npx aidd my-project
```

**For Cursor users with existing rules:**

Reference the skills in your prompts or add to `.cursor/skills`:

```
See ai/skills/aidd-javascript/SKILL.md for JavaScript best practices
See ai/skills/aidd-tdd/SKILL.md for test-driven development
See ai/skills/aidd-product-manager/SKILL.md for product management
```

**For other editors (VS Code, Vim, etc.):**

Reference skills directly in your AI assistant prompts:

```
Please follow the guidelines in ai/skills/aidd-javascript/SKILL.md
Use the workflow from ai/commands/task.md
```

### Troubleshooting

**Verify Installation**

```bash
# Check that ai/ folder was created
ls ai/

# Verify key files exist
ls ai/skills/aidd-please/SKILL.md
ls ai/commands/
```

**Common Issues**

```bash
# If .cursor already exists, use --force
npx aidd --cursor --force

# Preview what --cursor will do
npx aidd --cursor --dry-run --verbose

# Clear npx cache if installation fails
npx clear-npx-cache
npx aidd --cursor

# Check Node version (requires 16.0.0+)
node --version
```

**Updating**

```bash
# Simply run aidd again to get latest version
npx aidd --force
```

**Uninstalling**

```bash
# Remove the ai/ folder
rm -rf ai/

# Remove .cursor symlink if it exists
rm .cursor
```

## 📄 License

MIT © [ParallelDrive](https://github.com/paralleldrive)

## 📹 Weekly Training Sessions

Public-access, recorded trainings published to YouTube on a (mostly) weekly basis, covering AIDD Framework workflows and software engineering in general. We meet at 3:00pm PT every Tuesday.

📖 **[Browse all training sessions →](docs/training-videos.md)**

## 🤝 Contributing

We welcome contributions! Follow the [Development Workflow](#development-workflow) above, and see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

**Start building with AI orchestration today:**

```bash
npx aidd --cursor
```
