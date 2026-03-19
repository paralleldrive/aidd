# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `npx aidd agent --prompt "<text>"` — new CLI subcommand that delegates a prompt to an AI agent (claude, opencode, or cursor) directly from the terminal
- `--prompt <text>` flag on `npx aidd create` — after scaffolding completes, runs an AI agent in the new project directory to kick off autonomous development
- `--agent-config <name|path>` on `create` and `agent` — configures which AI agent to use; accepts a preset name (`claude`, `opencode`, `cursor`), a path to a YAML config file, or falls through the full resolution chain
- Agent config resolution chain: explicit flag → `AIDD_AGENT_CONFIG` env var → `agent-config` in `aidd-custom/config.yml` → claude default
- `agent-config` option in `aidd-custom/config.yml` — documented in `docs/aidd-custom.md` and pre-populated as a commented example in the install template
- `aidd/agent` package export — programmatic access to `runAgent` for third-party tools and scaffold manifests
- `aidd/agent-config` package export — programmatic access to `getAgentConfig` / `resolveAgentConfig` with full TypeScript types
- `ScaffoldDestinationError` — dedicated error type (code `SCAFFOLD_DESTINATION_ERROR`) when `npx aidd create` target folder already exists; displays a clear `❌ Destination conflict` message with actionable hint
- Manifest prompt-step ordering guard — `parseManifest` now throws `ScaffoldValidationError` if a `prompt:` step appears before any `run:` step that invokes the `aidd` CLI, preventing agents from running before the framework is installed
- `import aidd-custom/AGENTS.md` directive in root `AGENTS.md` — allows projects to override root-level agent directives with project-specific settings
- `aidd-custom/AGENTS.md` scaffold — created automatically on `npx aidd` install to provide a place for project-specific agent instruction overrides

### Changed
- `--agent` flag on `npx aidd create` renamed to `--agent-config` — accepts a preset name or YAML path; no Commander default so `AIDD_AGENT_CONFIG` and `aidd-custom/config.yml` are respected when the flag is omitted
- `scaffold-cleanup` CLI subcommand removed — downloaded scaffold files are now cleaned up automatically after every `npx aidd create <url>`; the subcommand is internal only

### Fixed
- `npx aidd create <url>` no longer fails on repeated runs with a destination-conflict error — `~/.aidd/scaffold/` is cleaned up automatically after every create, whether it succeeds or fails (fixes #157)

## [2.6.0] - 2026-03-02

### Added
- `aidd-fix` skill — structured bug-fixing workflow using a typed SudoLang pipeline with TDD discipline, exit gates, and delegation hints (`/execute`, `/commit`)
- `aidd-ecs` skill — enforces `@adobe/data/ecs` best practices for Database.Plugin definitions, components, resources, transactions, actions, systems, and services
- `aidd-layout` skill — enforces UI component layout and composition patterns (terminal vs. layout components, spacing, re-render efficiency)
- `aidd-namespace` skill — ensures types and related functions follow a modular, discoverable, tree-shakeable namespace pattern
- `aidd-observe` skill — enforces Observe pattern best practices from `@adobe/data/observe` (reactive data flow, observable composition helpers)
- `aidd-react` skill — enforces React component authoring best practices (reactive binding, `useObservableValues`, action callbacks)
- `aidd-structure` skill — enforces source code structuring and interdependency rules across types, services, plugins, and components layers
- `vision.md` — project vision document as source of truth for AI agents; agents now check for conflicts before executing tasks
- SudoLang syntax cheat sheet (`ai/rules/sudolang/sudolang-syntax.mdc`)
- `npx aidd create` epic planned for app scaffolding CLI surface
- Next.js + ShadCN setup guide (`docs/new-project-setup-nextjs-shadcn.md`)
- `typecheck` npm script (`tsc --noEmit`) wired into `npm test` and `npm run test:unit`
- `lib/cli-core.d.ts` type declarations for all exported CLI core functions

### Changed
- Replaced ESLint and Prettier with Biome for formatting and linting
- Updated task execution steps and approval process in agent workflow documentation
- Enhanced TDD documentation with UI testing strategy (Redux, sagas, Playwright, riteway/render)
- Improved README with AI-generated code challenges and AIDD benefits

### Fixed
- ALL_CAPS plain JS constants renamed to camelCase per style guide (`requiredDirectives`, `agentsMdContent`, `maxRecursionDepth`, etc.)
- `generateAllIndexes` error return type normalized to `{ message, cause? }` across all code paths
- `generateIndexRecursive` type declaration updated to include optional `depth` parameter

## [2.4.0] - 2026-01-01

### Added
- AGENTS.md installer with `--index` command for progressive AI context discovery
- Error-causes rule for structured error handling patterns
- SHA3-256 hashing security rule for CSRF token validation
- Timing-safe comparison security rule

### Changed
- Renamed "SudoLang AIDD" to "AIDD Framework" throughout documentation
- Enhanced JWT security guidelines with stronger recommendations
- Updated security review guidelines for JWT and comparison operations

### Fixed
- Review.mdc file path references corrected

## [2.3.0] - 2025-12-15

### Added
- Form handling middleware (`handleForm`) with TypeBox validation
- CSRF protection middleware (`withCSRF`) with SHA3-256 token validation
- Timing-safe comparison for CSRF tokens
- Comprehensive documentation for form, CSRF, and auth middleware
- TypeScript type checking in test scripts

### Changed
- Replaced ajv with TypeBox for form validation
- Enhanced CSRF and form middleware with logging and configuration

### Fixed
- CSRF bypass allowing form processing after rejection
- CSRF token regeneration on every GET request
- js-sha3 import compatibility for Node.js ESM
- Critical bugs in form/CSRF middleware
- File path inconsistencies in AI configuration files

## [2.2.0] - 2025-12-01

### Added
- Auth middleware wrapping better-auth for session management
- Parallel Drive badge to README
- Table of Contents section to README

### Changed
- Made better-auth a peer dependency (optional)

### Fixed
- File path patterns for agent files
- Agent orchestrator file path references

## [2.1.0] - 2025-11-15

### Added
- Component overview in README and CLI help text
- AIDD definition in documentation

### Changed
- Updated CLI help text with improved structure and clarity
- Consistent bullet format in CLI help text

### Fixed
- Brand name in tests changed to "SudoLang AIDD"
- Badge link for SudoLang AIDD
- Markdown formatting removed from CLI help text
- Server docs link restored in CLI help
- Release dates corrected in CHANGELOG
- Repository URLs corrected
- Test files excluded and docs included in npm package
- Latest tag now pushed to origin in release hook

## [2.0.0] - 2025-11-08

### Added
- New `aidd/utils` barrel export with composition utilities
- `pipe` function for left-to-right synchronous composition
- `compose` function for right-to-left synchronous composition
- `sideEffects: false` in package.json for optimal tree-shaking

### Changed
- **BREAKING**: Import path changed from `aidd/asyncPipe` to `aidd/utils`
  - Before: `import { asyncPipe } from 'aidd/asyncPipe'`
  - After: `import { asyncPipe } from 'aidd/utils'`

### Migration Guide
To migrate to v2.0.0, update your imports:
```javascript
// Old (v1.x)
import { asyncPipe } from 'aidd/asyncPipe';

// New (v2.0.0+)
import { asyncPipe } from 'aidd/utils';
```

## [1.13.0] - 2025-11-06

### Added
- AIDD Server Framework with production-ready middleware
- GitHub Actions CI workflow
- Comprehensive server framework documentation

### Fixed
- Flaky E2E tests now robust with git state verification
- Test redundancies removed for cleaner test suite

## [1.12.0] - 2025-10-21

### Added
- Release automation improvements
- Test suite enhancements

