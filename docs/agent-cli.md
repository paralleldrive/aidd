# `npx aidd agent` and agent options on `npx aidd create`

## NAME

**aidd agent** — run a configured AI coding agent with a prompt from the shell.

**aidd create** — scaffold a project; optionally run an agent in the new directory when finished.

---

## `npx aidd agent`

Run an AI agent in the current working directory, passing your prompt through the resolved agent command (preset or custom YAML).

### OPTIONS

```
     --prompt <text>
             Required. The prompt text passed to the agent.

     --agent-config <name|path>
             Optional. One of:
             • a preset name: claude, opencode, or cursor;
             • a path to a YAML agent config file (`.yml` or `.yaml`);
             • omit to use the resolution chain below.

     -h, --help
             Show help and exit.
```

### Agent config resolution chain

Effective agent (first match wins):

1. **`--agent-config`** on the command line (if given)
2. **`AIDD_AGENT_CONFIG`** environment variable (preset name or YAML path)
3. **`agent-config`** in `aidd-custom/config.yml` (preset name, YAML path, or inline `{ command, args }` — see [aidd-custom.md](./aidd-custom.md))
4. **claude** preset (default)

### YAML agent config file format

A minimal file defines the executable and any fixed arguments before the prompt. Your prompt text is passed as the last argument after `args`.

```yaml
command: my-agent
args:
  - "--run"
```

Both `command` (string) and optional `args` (array of strings) are supported. Relative paths in `agent-config` are resolved from the project directory (current working directory for `npx aidd agent`, or the new project folder for `npx aidd create`).

---

## `npx aidd create` — `--prompt` and `--agent-config`

After scaffolding completes, you can start an agent **in the new project directory** with `--prompt`. Use `--agent-config` on `create` to select the agent for that run and for create-time prompt steps (see `npx aidd create --help`); accepted values match `npx aidd agent`.

**Example:** scaffold `my-app`, then run the default-resolved agent with a prompt in `my-app`:

```sh
npx aidd create my-app --prompt "Initialize the README and run npm install"
```

With an explicit preset:

```sh
npx aidd create my-app --agent-config cursor --prompt "Review the scaffold and suggest next steps"
```

---

## `agent-config` in `aidd-custom/config.yml`

For the full option table and behavior notes, see **[aidd-custom.md](./aidd-custom.md)** — **config.yml options**.

**Reminder:** `agent-config` accepts `claude`, `opencode`, `cursor`, a path to a `.yml` (or `.yaml`) agent config file, or an inline object with `command` and `args`.
