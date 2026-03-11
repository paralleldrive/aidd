# `aidd create --prompt` Epic

**Status**: 📋 PLANNED  
**Goal**: Add a `--prompt` flag to `npx aidd create` and a standalone `npx aidd agent` subcommand, backed by a portable agent-config library, so AI agents are invoked consistently and non-interactively across scaffold manifest steps, post-scaffold automation, and direct developer use.

## Overview

Today scaffold `prompt:` steps spawn agents by name with no config (interactive by default), `create` has no way to kick off autonomous development after scaffolding, and there is no standard way to invoke an agent in an existing project. This epic introduces a full agent invocation stack: a shared `lib/agent-config.js` library (the single module responsible for the full resolution chain: `--agent` CLI > `AIDD_AGENT_CONFIG` env > `agent-config` in `aidd-custom/config.yml` > claude default) and a standalone `npx aidd agent` subcommand. All consumers receive a pre-resolved `agentConfig` object — no resolution logic lives outside `lib/agent-config.js`.

---

## `lib/agent-config.js` — Agent config library

The single module responsible for all agent config resolution; portable to Riteway and other tools via the `aidd/agent-config` package export.

**Requirements**:
- Given agent name `'claude'`, `getAgentConfig` returns `{ command: 'claude', args: ['-p'] }`
- Given agent name `'opencode'`, `getAgentConfig` returns `{ command: 'opencode', args: ['run'] }`
- Given agent name `'cursor'`, `getAgentConfig` returns `{ command: 'agent', args: ['--print'] }`
- Given no argument, `getAgentConfig` defaults to the claude preset
- Given any casing (e.g. `'Claude'`), `getAgentConfig` resolves case-insensitively
- Given an unknown name, `getAgentConfig` throws `ScaffoldValidationError` listing all supported agent names
- Given a value ending in `.yml` or `.yaml`, `resolveAgentConfig` treats it as a file path and loads `{ command, args? }` from that YAML file
- Given a YAML agent config file missing the `command` field, `resolveAgentConfig` throws `ScaffoldValidationError`
- Given a plain object `{ command, args? }`, `resolveAgentConfig` uses it directly as the AgentConfig
- Given a plain agent name string, `resolveAgentConfig` delegates to `getAgentConfig`
- Given `resolveAgentConfig` is called with no explicit value, reads `AIDD_AGENT_CONFIG` env var (name or `.yml`/`.yaml` path) before checking `aidd-custom/config.yml` in `cwd`
- Given none of the above yield a value, `resolveAgentConfig` returns `getAgentConfig('claude')`
- Given `package.json`, the `"./agent-config"` export resolves to `lib/agent-config.js`

---

## Manifest validation — prompt ordering guard

Enforce at parse time that no `prompt:` step appears before an aidd-installing `run:` step.

**Requirements**:
- Given a manifest where a `prompt:` step appears before any `run:` step containing the string `"aidd"`, `parseManifest` throws `ScaffoldValidationError` with a message advising that a `run:` step invoking aidd (e.g. `run: npx aidd .`) must precede any `prompt:` step

---

## Manifest runner — non-interactive agent invocation

Update `runManifest` to accept a pre-resolved `agentConfig` object; callers are responsible for calling `resolveAgentConfig` and passing the result.

**Requirements**:
- Given `agentConfig` passed to `runManifest`, uses it for all `prompt:` steps
- Given a `prompt:` step, spawns `[command, ...args, promptText]` in no-shell array form (non-interactive)
- Given existing tests asserting `[agent, promptText]` as the spawned command, updates them to assert `[command, ...args, promptText]`

---

## `npx aidd agent` subcommand

Standalone subcommand for invoking an AI agent in the current working directory; calls `resolveAgentConfig` and passes the result to the agent runner.

**Requirements**:
- Given `--prompt "Build a todo app"`, calls `resolveAgentConfig({ value: agentFlag, cwd: process.cwd() })` and spawns the agent in CWD
- Given `--agent <name|path>`, passes it as the `value` override to `resolveAgentConfig`
- Given invoked without `--prompt`, prints an error and exits 1
- Given the agent process exits non-zero, reports `ScaffoldStepError` and exits 1

---

## `create` — add `--prompt` and wire agent config

Add `--prompt` to `create`; callers resolve agent config via `resolveAgentConfig` and pass it through; the post-scaffold `--prompt` step re-resolves from the new project's `aidd-custom/config.yml` after all manifest steps complete.

**Requirements**:
- Given `--agent <name|path>` on `create`, passes it as the `value` override to `resolveAgentConfig` for both manifest prompt steps and the post-scaffold `--prompt` step
- Given `--prompt "Build a todo app"`, after all manifest steps complete, calls `resolveAgentConfig({ value: agentFlag, cwd: newProjectDir })` and spawns the agent in the new project directory
- Given the `--prompt` agent exits non-zero, reports `ScaffoldStepError` and exits 1
- Given `--prompt` is absent, `create` behavior is unchanged

---

## `aidd-custom/config.yml` template and docs

Surface the new `agent-config` setting so users know how to configure their preferred agent after running `npx aidd`.

**Requirements**:
- Given `npx aidd` install, the generated `aidd-custom/config.yml` includes a commented `# agent-config: claude` example line
- Given the `aidd-custom/README.md` config options table, adds an `agent-config` row documenting accepted values: an agent name (`claude`, `opencode`, `cursor`), a path to a `.yml` agent config file, or an inline `{ command, args }` object
