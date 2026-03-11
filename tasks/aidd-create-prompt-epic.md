# `aidd create --prompt` Epic

**Status**: 📋 PLANNED  
**Goal**: Add a `--prompt` flag to `npx aidd create` and a standalone `npx aidd agent` subcommand, backed by a portable agent-config library, so AI agents are invoked consistently and non-interactively across scaffold manifest steps, post-scaffold automation, and direct developer use.

## Overview

Today scaffold `prompt:` steps spawn agents by name with no config (interactive by default), `create` has no way to kick off autonomous development after scaffolding, and there is no standard way to invoke an agent in an existing project. This epic introduces a full agent invocation stack collocated in `lib/agent-cli/`: `errors.js` (scoped error types), `config.js` (the single module responsible for the full resolution chain: `--agent` CLI > `AIDD_AGENT_CONFIG` env > `agent-config` in `aidd-custom/config.yml` > claude default), and `command.js` (the `npx aidd agent` subcommand, registered via one import in `bin/aidd.js`). All resolution logic lives exclusively in `lib/agent-cli/config.js`; no other module reinvents it.

---

## `lib/agent-cli/errors.js` — Agent error types

One module defines all agent error types and the error handler via a single `errorCauses` call; both are exported for use by `lib/agent-cli/config.js` and `lib/agent-cli/command.js`.

**Requirements**:
- Given the module, exports `AgentConfigReadError`, `AgentConfigParseError`, `AgentConfigValidationError`, and `handleAgentErrors` — all defined in one `errorCauses` call

---

## `lib/agent-cli/config.js` — Agent config library

The single module responsible for all agent config resolution; portable to Riteway and other tools via the `aidd/agent-config` package export.

**Requirements**:
- Given agent name `'claude'`, `getAgentConfig` returns `{ command: 'claude', args: ['-p'] }`
- Given agent name `'opencode'`, `getAgentConfig` returns `{ command: 'opencode', args: ['run'] }`
- Given agent name `'cursor'`, `getAgentConfig` returns `{ command: 'agent', args: ['--print'] }`
- Given no argument, `getAgentConfig` defaults to the claude preset
- Given any casing (e.g. `'Claude'`), `getAgentConfig` resolves case-insensitively
- Given an unknown name, `getAgentConfig` throws `AgentConfigValidationError` listing all supported agent names
- Given a value ending in `.yml` or `.yaml`, `resolveAgentConfig` loads and validates `{ command, args? }` from that YAML file; throws `AgentConfigReadError` on read failure and `AgentConfigParseError` on invalid YAML
- Given a loaded YAML agent config missing `command`, `resolveAgentConfig` throws `AgentConfigValidationError`
- Given a plain object `{ command, args? }`, `resolveAgentConfig` uses it directly as the AgentConfig
- Given a plain agent name string, `resolveAgentConfig` delegates to `getAgentConfig`
- Given no explicit value, `resolveAgentConfig` reads `AIDD_AGENT_CONFIG` env var (name or `.yml`/`.yaml` path) before checking `agent-config` in `<cwd>/aidd-custom/config.yml`
- Given none of the above yield a value, `resolveAgentConfig` returns `getAgentConfig('claude')`
- Given `package.json`, the `"./agent-config"` export resolves to `lib/agent-cli/config.js`

---

## Manifest validation — prompt ordering guard

Enforce at parse time that no `prompt:` step appears before an aidd-installing `run:` step.

**Requirements**:
- Given a manifest where a `prompt:` step appears before any `run:` step containing the string `"aidd"`, `parseManifest` throws `ScaffoldValidationError` with a message advising that a `run:` step invoking aidd (e.g. `run: npx aidd .`) must precede any `prompt:` step

---

## Manifest runner — non-interactive agent invocation

Update `runManifest` to call `resolveAgentConfig` lazily only when a `prompt:` step is encountered; the `agent` parameter remains a string override — no caller changes required.

**Requirements**:
- Given a manifest `prompt:` step, calls `resolveAgentConfig({ value: agent, cwd: folder })` and spawns `[command, ...args, promptText]` in no-shell array form (non-interactive)
- Given no `prompt:` steps in the manifest, never calls `resolveAgentConfig`
- Given existing tests asserting `[agent, promptText]` as the spawned command, updates them to assert `[command, ...args, promptText]`

---

## `lib/agent-cli/command.js` and `npx aidd agent` subcommand

Standalone subcommand registered via a single `registerAgentCommand(program)` import in `bin/aidd.js`; no agent logic in the main CLI dispatcher.

**Requirements**:
- Given `bin/aidd.js`, adds exactly one import (`registerAgentCommand`) and one call (`registerAgentCommand(cli)`) — no agent-specific logic in the dispatcher
- Given `npx aidd agent --prompt "Build a todo app"`, calls `resolveAgentConfig({ value: agentFlag, cwd: process.cwd() })` and spawns the agent in CWD
- Given `--agent <name|path>`, passes it as the `value` override to `resolveAgentConfig`
- Given invoked without `--prompt`, prints an error and exits 1
- Given the agent process exits non-zero, reports `ScaffoldStepError` and exits 1
- Given an agent config error, uses `handleAgentErrors` to display a scoped message and exits 1

---

## `create` — add `--prompt` and wire agent config

Add `--prompt` to `create`; pass the `--agent` flag value through to `runManifest` as the override, and re-resolve from the new project after manifest for the post-scaffold step.

**Requirements**:
- Given `--agent <name|path>` on `create`, passes it as the `agent` override to `runManifest` and as the `value` override to `resolveAgentConfig` for the post-scaffold `--prompt` step
- Given `--prompt "Build a todo app"`, after all manifest steps complete, calls `resolveAgentConfig({ value: agentFlag, cwd: newProjectDir })` and spawns the agent in the new project directory
- Given the `--prompt` agent exits non-zero, reports `ScaffoldStepError` and exits 1
- Given `--prompt` is absent, `create` behavior is unchanged

---

## `aidd-custom/config.yml` template and docs

**Requirements**:
- Given `npx aidd` install, the generated `aidd-custom/config.yml` includes a commented `# agent-config: claude` example line
- Given the `aidd-custom/README.md` config options table, adds an `agent-config` row documenting accepted values: an agent name (`claude`, `opencode`, `cursor`), a path to a `.yml` agent config file, or an inline `{ command, args }` object
