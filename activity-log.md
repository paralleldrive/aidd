## February 18, 2026

- 🚀 - `npx aidd create` - New `create [type|URI] <folder>` subcommand with manifest-driven scaffolding (run/prompt steps, --agent flag, remote code warning)
- 🚀 - `npx aidd scaffold-cleanup` - New cleanup subcommand removes `.aidd/` working directory
- 🔧 - Extension resolver - Supports named scaffolds, `file://`, `http://`, `https://` with confirmation prompt for remote code
- 🔧 - SCAFFOLD-MANIFEST.yml runner - Executes run/prompt steps sequentially; prompt steps use array spawn to prevent shell injection
- 📦 - `scaffold-example` scaffold - Minimal E2E fixture: `npm init`, vitest test script, installs riteway/vitest/playwright/error-causes/@paralleldrive/cuid2
- 📦 - `next-shadcn` scaffold stub - Default named scaffold with placeholder manifest for future Next.js + shadcn/ui implementation
- 🧪 - 44 new tests - Unit tests for resolver, runner, cleanup; E2E tests covering full scaffold lifecycle

## October 20, 2025

- 📱 - Help command clarity - AI workflow commands context
- 🔧 - Agent system refinement - Role clarity, review process, task completion

## October 19, 2025

- 📝 - README production-ready - ToC, troubleshooting, clear commands
- 🔧 - Task creator refinement - Terse epic format

## September 28, 2025

- 🚀 - Improved --help command - AI workflow benefits prominently displayed
- 🔧 - Husky pre-push hook - Automated git status check
- 🐛 - Release Test Race Condition - Fixed intermittent E2E test failure
- 🔧 - Husky Pre-commit Hook - Automated test/lint validation

## September 27, 2025

- 📝 - Log Guide - Dramatically improved logging with-focus
- 🚀 - GitHub PR Template - AI review integration
- 🔧 - Release Latest Tag - Auto git tag management
- 🧹 - Comment Cleanup - Code quality improvement
- 🚀 - AIDD CLI - AI driven development tool
- 🔄 - Release.js Refactor - Functional programming

## July 7, 2025

- 📝 - Tech stack definition - NextJS + React/Redux + HeroUI
- 🔄 - Project restructure with website/ directory

## July 6, 2025

- 📝 - Mentorship landing flow PRD - AIDD methodology
- 🚀 - AIDD Framework project overview and README
- 🚀 - Redux/Autodux framework with SudoLang transpiler
- 📝 - AI metaprograms and system orchestration
- 🔧 - Initial .cursorrules for AI assistant behavior
