# `aidd create --prompt` Epic

**Status**: 📋 PLANNED  
**Goal**: Add a `--prompt` flag to `npx aidd create`, a standalone `npx aidd agent` subcommand, and programmatic `runAgent` / `resolveAgentConfig` exports — backed by a portable agent-cli library so AI agents are invoked consistently and non-interactively across scaffold manifest steps, post-scaffold automation, direct CLI use, and third-party tools.

## Overview

Today scaffold `prompt:` steps spawn agents by name with no config (interactive by default), `create` has no way to kick off autonomous development after scaffolding, and there is no programmatic API for spawning agents. This epic introduces a full agent invocation stack collocated in `lib/agent-cli/`: `errors.js` (scoped error types), `config.js` (the single module responsible for the full resolution chain: `--agentConfig` CLI > `AIDD_AGENT_CONFIG` env > `agent-config` in `aidd-custom/config.yml` > claude default), `runner.js` (the `runAgent` spawn primitive), and `command.js` (the `npx aidd agent` subcommand, registered via one import in `bin/aidd.js`). All resolution logic lives exclusively in `lib/agent-cli/config.js`; no other module reinvents it.

---

## `lib/agent-cli/errors.js` — Agent error types

One module defines all agent error types and the error handler via a single `errorCauses` call; both are exported for use across `lib/agent-cli/`.

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
- Given `getAgentConfig` is called multiple times with the same name, each call should return a distinct object (mutations to one must not affect the other)
- Given `agent-config` in `aidd-custom/config.yml` is a YAML mapping with a `command` field, `resolveAgentConfig` should use it as the agent config
- Given `value` is `null` or an array, `resolveAgentConfig` should throw `AgentConfigValidationError`
- Given `agent-config: ./agent.yml` in `aidd-custom/config.yml` and the file exists in `cwd`, `resolveAgentConfig` should load it regardless of which directory the CLI was invoked from
- Given `agent-config` in `aidd-custom/config.yml` contains an invalid value (typo, bad YAML path, missing command), `resolveAgentConfig` should warn to stderr and fall through to the claude default rather than silently ignoring the error
- Given `agent-config` in `aidd-custom/config.yml` references a missing YAML file, `resolveAgentConfig` should warn with a message specific to the read failure (not a generic 'failed to read' message)

---

## `lib/agent-cli/runner.js` — Agent runner

Programmatic spawn primitive; exported as `aidd/agent` for use by third-party tools and by `command.js` internally.

**Requirements**:
- Given `runAgent({ agentConfig, prompt, cwd })`, spawns `[command, ...args, prompt]` as a no-shell array in `cwd` with `stdio: 'inherit'`
- Given the spawned process exits non-zero, throws `ScaffoldStepError`
- Given the agent command does not exist (ENOENT), `runAgent` should reject with `ScaffoldStepError` instead of crashing the process
- Given `spawn` emits an `error` event with `code === 'E2BIG'` or `code === 'ENOBUFS'`, `runAgent` should reject with a `ScaffoldStepError` whose message says 'Argument list too long for spawn'
- Given the spawned agent process is terminated by a signal, `runAgent` should reject with a `ScaffoldStepError` whose message includes the signal name rather than 'code null'
- Given `package.json`, the `"./agent"` export resolves to `lib/agent-cli/runner.js`

---

## Manifest validation — prompt ordering guard

Enforce at parse time that no `prompt:` step appears before an aidd-installing `run:` step.

**Requirements**:
- Given a manifest where a `prompt:` step appears before any `run:` step containing the string `"aidd"`, `parseManifest` throws `ScaffoldValidationError` with a message advising that a `run:` step invoking aidd (e.g. `run: npx aidd .`) must precede any `prompt:` step
- Given a manifest where the only run step mentioning `"aidd"` is `echo aidd` (not an invocation of the aidd CLI), `parseManifest` should throw `ScaffoldValidationError`

---

## Manifest runner — non-interactive agent invocation

Update `runManifest` to call `resolveAgentConfig` and `runAgent` lazily only when a `prompt:` step is encountered; the `agentConfig` parameter remains a string override — no caller changes required.

**Requirements**:
- Given a manifest `prompt:` step, calls `resolveAgentConfig({ value: agentConfig, cwd: folder })` then `runAgent` with the result, spawning `[command, ...args, promptText]` (non-interactive)
- Given no `prompt:` steps in the manifest, never calls `resolveAgentConfig`
- Given a manifest with multiple `prompt:` steps, `resolveAgentConfig` should be called exactly once per `runManifest` invocation (not once per step)
- Given existing tests asserting `[agent, promptText]` as the spawned command, updates them to assert `[command, ...args, promptText]`

---

## `lib/agent-cli/command.js` and `npx aidd agent` subcommand

Standalone subcommand registered via a single `registerAgentCommand(program)` import in `bin/aidd.js`; no agent logic in the main CLI dispatcher.

**Requirements**:
- Given `bin/aidd.js`, adds exactly one import (`registerAgentCommand`) and one call (`registerAgentCommand(cli)`) — no agent-specific logic in the dispatcher
- Given `npx aidd agent --prompt "Build a todo app"`, calls `resolveAgentConfig({ value: agentConfigFlag, cwd: process.cwd() })` then `runAgent`
- Given `--agentConfig <name|path>`, passes it as the `value` override to `resolveAgentConfig`
- Given invoked without `--prompt`, prints an error and exits 1
- Given an agent config error, uses `handleAgentErrors` to display a scoped message and exits 1

---

## `create` — add `--prompt` and wire agent config

Rename `--agent` → `--agentConfig` on `create`; pass the flag value through to `runManifest`; after manifest completes re-resolve from the new project dir for the post-scaffold `--prompt` step.

**Requirements**:
- Given `--agentConfig <name|path>` on `create`, passes it as the `agentConfig` override to `runManifest` and as the `value` override to `resolveAgentConfig` for the post-scaffold `--prompt` step
- Given `--prompt "Build a todo app"`, after all manifest steps complete, calls `resolveAgentConfig({ value: agentConfigFlag, cwd: newProjectDir })` then `runAgent` in the new project directory
- Given the `--prompt` agent exits non-zero, reports `ScaffoldStepError` and exits 1
- Given `--prompt` is absent, `create` behavior is unchanged
- Given existing `--agent` usage, `--agentConfig` is the renamed replacement (breaking change; update docs and tests)
- Given `AIDD_AGENT_CONFIG=opencode` is set and `--agentConfig` is not passed, `npx aidd create` should use opencode for prompt steps
- Given `agent-config: opencode` in `aidd-custom/config.yml` and `--agentConfig` is not passed, `npx aidd create` should use opencode for prompt steps
- Given `runCreate`, should not accept `ensureDirFn`, `copyFn`, `existsFn`, `resolveAgentConfigFn`, or `runAgentFn` as parameters; integration tests use real temp directories and a minimal `steps: []` scaffold fixture
- Given the failing scaffold fixture used in tests, the run step should exit non-zero on all platforms including Windows

---

## `aidd-custom/config.yml` template and docs

**Requirements**:
- Given `npx aidd` install, the generated `aidd-custom/config.yml` includes a commented `# agent-config: claude` example line
- Given the `aidd-custom/README.md` config options table, adds an `agent-config` row documenting accepted values: an agent name (`claude`, `opencode`, `cursor`), a path to a `.yml` agent config file, or an inline `{ command, args }` object
