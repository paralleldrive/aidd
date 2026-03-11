# `aidd create --prompt` Epic

**Status**: 📋 PLANNED  
**Goal**: Add a `--prompt` flag to `npx aidd create` and a standalone `npx aidd agent` subcommand, backed by a portable agent-config library, so AI agents are invoked consistently and non-interactively across scaffold manifest steps, post-scaffold automation, and direct developer use.

## Overview

Today scaffold `prompt:` steps spawn agents by name with no config (interactive by default), `create` has no way to kick off autonomous development after scaffolding, and there is no standard way to invoke an agent in an existing project. This epic introduces a full agent invocation stack: a shared `lib/agent-config.js` library (portable to Riteway and other tools), a consistent resolution chain (`--agent` CLI > `AIDD_AGENT_CONFIG` env > `agent-config` in `aidd-custom/config.yml` > claude default), non-interactive invocation for all prompt steps, a manifest ordering guard, and a standalone `npx aidd agent` subcommand.

---

## `lib/agent-config.js` — Agent config library

Shared AgentConfig abstraction (`{ command: string, args: string[] }`) with built-in presets and a resolution chain; exported as `aidd/agent-config` for future import by Riteway and other tools.

**Requirements**:
- Given agent name `'claude'`, `getAgentConfig` returns `{ command: 'claude', args: ['-p'] }`
- Given agent name `'opencode'`, `getAgentConfig` returns `{ command: 'opencode', args: ['run'] }`
- Given agent name `'cursor'`, `getAgentConfig` returns `{ command: 'agent', args: ['--print'] }`
- Given no argument, `getAgentConfig` defaults to the claude preset
- Given any casing (e.g. `'Claude'`), `getAgentConfig` resolves case-insensitively
- Given an unknown name, `getAgentConfig` throws `ScaffoldValidationError` listing all supported agent names
- Given a value ending in `.yml` or `.yaml`, `resolveAgentConfig` treats it as a file path, loads and validates `{ command, args? }` from that YAML file
- Given a YAML agent config file missing the `command` field, `resolveAgentConfig` throws `ScaffoldValidationError`
- Given a plain object `{ command, args? }`, `resolveAgentConfig` uses it directly as the AgentConfig
- Given a plain agent name string, `resolveAgentConfig` delegates to `getAgentConfig`
- Given `package.json`, the `"./agent-config"` export resolves to `lib/agent-config.js`

---

## Manifest validation — prompt ordering guard

Enforce at parse time that no `prompt:` step can appear before an aidd-installing `run:` step, ensuring agent configuration is available before any prompt runs.

**Requirements**:
- Given a manifest where a `prompt:` step appears before any `run:` step containing the string `"aidd"`, `parseManifest` throws `ScaffoldValidationError` with a message advising that a `run:` step invoking aidd (e.g. `run: npx aidd .`) must precede any `prompt:` step

---

## Manifest runner — non-interactive agent invocation

Update `runManifest` to resolve the agent config internally (lazy, per prompt step) so configs written by earlier `run:` steps are available; the `agent` parameter stays a string (name or `.yml`/`.yaml` path) — no caller changes required.

**Requirements**:
- Given a manifest `prompt:` step, spawns `[command, ...args, promptText]` in no-shell array form using the resolved AgentConfig (non-interactive)
- Given `agent` passed to `runManifest` as a name or file path, uses it as the highest-priority override for all prompt steps
- Given no `agent` override, resolves per prompt step via `AIDD_AGENT_CONFIG` env, then `agent-config` in target dir's `aidd-custom/config.yml`, then `getAgentConfig('claude')`
- Given existing tests that assert `[agent, promptText]` as the spawned command, updates them to assert `[command, ...args, promptText]`

---

## `npx aidd agent` subcommand

Standalone subcommand for invoking an AI agent in the current working directory, sharing the same resolution chain and runner as `create --prompt` and manifest prompt steps.

**Requirements**:
- Given `npx aidd agent --prompt "Build a todo app"`, resolves agent config and spawns the agent in the CWD
- Given `--agent <name|path>`, uses it as the highest-priority override
- Given `AIDD_AGENT_CONFIG` env var set to a name or `.yml`/`.yaml` file path, uses it when no `--agent` flag is present
- Given `agent-config` key in CWD's `aidd-custom/config.yml` (name string, `.yml`/`.yaml` file path, or inline `{ command, args? }` object), uses it when neither CLI flag nor env var is set
- Given none of the above, defaults to `getAgentConfig('claude')`
- Given the agent process exits non-zero, reports `ScaffoldStepError` and exits 1

---

## `create` — add `--prompt` and wire agent config

Add `--prompt` to `create`; after all manifest steps succeed, run a final post-scaffold agent step using the same resolution chain reading from the **new project's** `aidd-custom/config.yml`.

**Requirements**:
- Given `--agent <name|path>` on `create`, overrides all other config sources for both manifest prompt steps and the `--prompt` post-scaffold step
- Given `--prompt "Build a todo app"` on `create`, after all manifest steps complete, spawns the resolved agent with the prompt in the new project directory
- Given the `--prompt` agent exits non-zero, reports `ScaffoldStepError` and exits 1
- Given `--prompt` is absent, `create` behavior is unchanged

---

## `aidd-custom/config.yml` template and docs

Surface the new `agent-config` setting so users know how to configure their preferred agent after running `npx aidd`.

**Requirements**:
- Given `npx aidd` install, the generated `aidd-custom/config.yml` includes a commented `# agent-config: claude` example line
- Given the `aidd-custom/README.md` config options table, adds an `agent-config` row documenting accepted values: an agent name (`claude`, `opencode`, `cursor`), a path to a `.yml` agent config file, or an inline `{ command, args }` object
