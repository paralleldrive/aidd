# AIDD with SudoLang.ai

**The standard library for AI Driven Development.**

A public collection of reusable metaprograms, agent scripts, and prompt modules.

**SudoLang** is a pseudocode language for prompting large language models with clear structure, strong typing, and explicit control flow.

## 🚀 Quick Start with AIDD CLI

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

Coming soon:

- 🎨 UI sketch prompts
- 📄 Documentation generators
- 🔌 API design

## 📋 System Requirements

- **Node.js**: 16.0.0+ (requires ESM support)
- **Environment**: Unix/Linux shell (bash, zsh) or Windows with WSL
- **Editors**: Works with any editor; optimized for Cursor

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

## 🎯 Cursor Editor Integration

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

If you already have a `.cursor` folder, manually integrate our system:

```bash
# 1. Clone without symlink
npx aidd my-project

# 2. Manually reference our rules in your existing .cursor rules
# Add to your .cursor/rules.md:
# @import ../ai/rules/javascript/javascript.mdc
# @import ../ai/rules/tdd.mdc
# @import ../ai/rules/productmanager.mdc
```

### Troubleshooting

```bash
# If .cursor already exists, use --force
npx aidd --cursor --force

# Preview what --cursor will do
npx aidd --cursor --dry-run --verbose
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
