# SudoLang.ai AIDD

[![SudoLang AIDD](https://img.shields.io/badge/✨_SudoLang_AIDD-black)](https://github.com/paralleldrive/sudolang.ai)

**The standard framework for AI Driven Development**

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [About SudoLang AIDD](#about-sudolang-aidd)
- [🚀 Quick Start with AIDD CLI](#-quick-start-with-aidd-cli)
  - [📋 Requirements](#-requirements)
  - [Detailed Installation Instructions](#detailed-installation-instructions)
- [Why SudoLang?](#why-sudolang)
- [What's Included](#whats-included)
- [🔧 Utils Library](#-utils-library)
  - [`asyncPipe`](#asyncpipe)
- [🚀 AIDD Server Framework](#-aidd-server-framework)
- [🛠️ AIDD CLI Reference](#-aidd-cli-reference)
  - [Installation & Usage](#installation--usage)
  - [Command Options](#command-options)
  - [Examples](#examples)
- [📁 AI System Structure](#-ai-system-structure)
  - [Key Components](#key-components)
- [🎯 AI Integration](#-ai-integration)
- [🔧 Cursor Editor Setup](#-cursor-editor-setup)
  - [Automatic Setup (Recommended)](#automatic-setup-recommended)
  - [When to Use `--cursor`](#when-to-use---cursor)
  - [When NOT to Use `--cursor`](#when-not-to-use---cursor)
  - [Manual Integration](#manual-integration)
  - [Troubleshooting](#troubleshooting)
- [📄 License](#-license)
- [🤝 Contributing](#-contributing)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## About SudoLang AIDD

A public collection of reusable metaprograms, agent scripts, and prompt modules. SudoLang agents put high quality software engineering process on autopilot rails.

The collection includes a comprehensive AI agent orchestration system with commands and rules that enable AI Driven Development workflows.

This system implements time-tested software engineering processes on autopilot rails, including:

- Specification driven development with PRDs and concise, structured user stories.
- Systematic task planning and execution with Test Driven Development (TDD).
- Code review and refinement with automated code quality checks and best practices enforcement.

The system also includes comprehensive code style guides for JavaScript, TypeScript, React, Redux, and we'll be adding more soon!

**AI Workflow Commands** - Use these in your AI assistant chat (Cursor, ChatGPT, Claude, etc.):

```
/discover - what to build
/task - plan a task epic to implement a user story from the discovery
/execute - task epics with TDD
/review - the results
/log - log the changes to the activity log
/commit - commit the changes to the repository
```

**SudoLang** is a pseudocode language for prompting large language models with clear structure, strong typing, and explicit control flow.

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

3. **Explore the structure**:

   ```bash
   cd my-project
   ls ai/                    # See available components
   cat ai/rules/please.mdc   # Read the main orchestrator
   ```

4. **Start using AI workflows**:
   - Reference `ai/rules/` in AI prompts for better context
   - Use `ai/commands/` as workflow templates
   - Customize rules for your specific project needs

This gives you immediate access to:

- 🤖 **Agent orchestration rules** (`ai/rules/`)
- ⚙️ **AI workflow commands** (`ai/commands/`)
- 📋 **Development best practices** (JavaScript, TDD, UI/UX)
- 🎯 **Product management tools** (user stories, journey mapping)

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
- 🔧 Utility library for async composition

Coming soon:

- 🎨 UI sketch prompts
- 📄 Documentation generators
- 🔌 API design
- 🌊 Observables API with pipeable operators
- 🗄️ State management with Supabase sync
- ⚡ Saga builder for async workflows
- 🎨 Skinnable UI components
- 💰 Billing and subscription management
- 🔐 Integrated wallet for Web3 apps

## 🔧 Utils Library

Utility functions for async function composition and data flow.

**Import:**
```javascript
import { asyncPipe } from 'aidd/utils';
```

### `asyncPipe`

Compose async functions from left to right. Similar to Unix pipes but for async JavaScript functions.

```javascript
import { asyncPipe } from 'aidd/utils';

const processUser = asyncPipe(
  validateInput,
  fetchUserFromDB,
  enrichWithProfile,
  formatResponse
);

const result = await processUser({ userId: 123 });
```

**Type signature:**
```typescript
function asyncPipe<T>(...fns: Array<(x: T) => T | Promise<T>>): (x: T) => Promise<T>
```

**Benefits:**
- **Readable** - Data flow is clear and linear
- **Composable** - Build complex operations from simple functions
- **Type-safe** - Full TypeScript support with type inference
- **Async-native** - Handles promises automatically

## 🚀 AIDD Server Framework

A lightweight alternative to Express, built for function composition and type-safe development.

**Why AIDD Server?**
- **Function composition** - Clean asyncPipe patterns instead of middleware chains
- **Type-safe** - Complete TypeScript definitions included
- **Secure by default** - Sanitized logging, explicit CORS, fail-fast configuration
- **Production-ready** - Comprehensive test coverage, battle-tested patterns

**Quick Example:**
```javascript
import { createRoute, withRequestId, createWithConfig, loadConfigFromEnv } from 'aidd/server';

// Load API keys from environment with fail-fast validation
const withConfig = createWithConfig(() =>
  loadConfigFromEnv(['OPENAI_API_KEY', 'DATABASE_URL'])
);

export default createRoute(
  withRequestId,
  withConfig,
  async ({ request, response }) => {
    // Throws immediately if OPENAI_API_KEY is missing
    const apiKey = response.locals.config.get('OPENAI_API_KEY');

    response.status(200).json({
      message: 'Config loaded securely',
      requestId: response.locals.requestId
    });
  }
);
```

**Core Features:**
- `createRoute` - Compose middleware with automatic error handling
- `createWithConfig` - Fail-fast configuration with `config.get()`
- `withRequestId` - CUID2 request tracking for logging
- `createWithCors` - Explicit origin validation (secure by default)
- `withServerError` - Standardized error responses

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

| Option             | Description                                               |
| ------------------ | --------------------------------------------------------- |
| `target-directory` | Directory to create `ai/` folder in (defaults to current) |
| `-f, --force`      | Overwrite existing `ai/` folder                           |
| `-d, --dry-run`    | Show what would be copied without copying                 |
| `-v, --verbose`    | Provide detailed output                                   |
| `-c, --cursor`     | Create `.cursor` symlink for Cursor editor integration    |
| `-h, --help`       | Display help information                                  |
| `--version`        | Show version number                                       |

### Examples

```bash
# Basic usage
npx aidd                    # Current directory
npx aidd my-project        # Specific directory

# Preview and force options
npx aidd --dry-run         # See what would be copied
npx aidd --force --verbose # Overwrite with details

# Cursor editor integration
npx aidd --cursor          # Create .cursor symlink
npx aidd my-project --cursor --verbose

# Multiple projects
npx aidd frontend-app
npx aidd backend-api
```

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
│   ├── rules/                # Agent orchestration rules
│   │   ├── agent-orchestrator.mdc
│   │   ├── javascript/       # JS/TS best practices
│   │   ├── frameworks/       # Redux, TDD patterns
│   │   ├── productmanager.mdc
│   │   ├── tdd.mdc
│   │   ├── ui.mdc
│   │   └── ...
│   └── ...
└── your-code/
```

### Key Components

- **Agent Orchestrator** (`ai/rules/agent-orchestrator.mdc`) - Coordinates multiple AI agents
- **Development Rules** (`ai/rules/javascript/`, `ai/rules/tdd.mdc`) - Best practices and patterns
- **Workflow Commands** (`ai/commands/`) - Structured AI interaction templates
- **Product Management** (`ai/rules/productmanager.mdc`) - User stories and journey mapping
- **UI/UX Guidelines** (`ai/rules/ui.mdc`) - Design and user experience standards

## 🎯 AI Integration

This system is designed to work with AI coding assistants:

- **Cursor** - AI-first code editor
- **GitHub Copilot** - AI pair programmer
- **ChatGPT** - General AI assistance
- **Claude** - Advanced reasoning and code review

The rules provide context and structure for more effective AI interactions.

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

Reference the rules in your prompts or add to `.cursor/rules`:

```
See ai/rules/javascript/javascript.mdc for JavaScript best practices
See ai/rules/tdd.mdc for test-driven development
See ai/rules/productmanager.mdc for product management
```

**For other editors (VS Code, Vim, etc.):**

Reference rules directly in your AI assistant prompts:

```
Please follow the guidelines in ai/rules/javascript/javascript.mdc
Use the workflow from ai/commands/task.md
```

### Troubleshooting

**Verify Installation**

```bash
# Check that ai/ folder was created
ls ai/

# Verify key files exist
ls ai/rules/please.mdc
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

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Start building with AI orchestration today:**

```bash
npx aidd --cursor
```
