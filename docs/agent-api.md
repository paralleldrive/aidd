# Agent programmatic API

Programmatic exports for spawning an AI agent with a prompt and for resolving which command and arguments to use. These mirror the behavior used by the AIDD agent CLI without going through the command line.

## `aidd/agent`

`runAgent` spawns an agent process with the given prompt. It returns a promise that resolves when the process exits with code 0 and rejects otherwise.

`RunAgentOptions` is `{ agentConfig: AgentConfig; prompt: string; cwd: string }`, where `AgentConfig` is `{ command: string; args?: string[] }`.

```typescript
import { runAgent } from 'aidd/agent';

await runAgent({
  agentConfig: { command: 'claude', args: ['-p'] },
  prompt: 'Build a login page',
  cwd: '/my-project',
});
```

## `aidd/agent-config`

Resolve a built-in preset or full configuration from project settings and environment. Use `getAgentConfig` when you only need a named preset; use `resolveAgentConfig` when you want the same resolution order as the tooling (explicit value, then env, then `aidd-custom/config.yml`, then default).

```typescript
getAgentConfig(name?: string): AgentConfig;
```

```typescript
import { getAgentConfig } from 'aidd/agent-config';

const config = getAgentConfig('claude');
// => { command: 'claude', args: ['-p'] }
```

```typescript
resolveAgentConfig(options?: {
  value?: string | AgentConfig;
  cwd?: string;
}): Promise<AgentConfig>;
```

```typescript
import { resolveAgentConfig } from 'aidd/agent-config';
// Priority: explicit value → AIDD_AGENT_CONFIG env → aidd-custom/config.yml → claude
const config = await resolveAgentConfig({ cwd: process.cwd() });
```
