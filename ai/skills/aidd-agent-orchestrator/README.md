# aidd-agent-orchestrator — Agent Coordination Reference

`/aidd-agent-orchestrator` coordinates specialized agents for software development
tasks, routing requests to the right agent based on the domain of work.

## Why an orchestrator matters

Complex software tasks often span multiple domains — UI, state management, testing,
product planning, side effects. Rather than relying on a single generalist prompt,
the orchestrator dispatches work to the agent with the deepest expertise for each
concern, then coordinates their outputs.

## How it works

The orchestrator maintains a registry of specialized agents, each mapped to a
skill file in `ai/skills/*/SKILL.md`. When a request arrives, it:

1. Infers which domains the request touches
2. Selects the appropriate agent(s) from the registry
3. Composes a task prompt that includes the relevant skill guides
4. Dispatches execution — either via CLI (`cursor-agent`) or direct prompting

## Agent registry

| Trigger | Agent | Skill |
| --- | --- | --- |
| User says "please" | please | `/aidd-please` |
| NextJS + React/Redux + Shadcn features | stack | `/aidd-stack` |
| Feature planning, user stories, discovery | product manager | `/aidd-product-manager` |
| Implementing code changes | tdd | `/aidd-tdd` |
| Writing JavaScript/TypeScript | javascript | `/aidd-javascript` |
| Documenting changes | log | `/aidd-log` |
| Committing code | commit | `/commit` |
| Redux state management | autodux | `/aidd-autodux` |
| Network requests, side effects | io-effects | `/aidd-javascript-io-effects` |
| Building UI | ui | `/aidd-ui` |
| Writing functional requirements | requirements | `/aidd-functional-requirements` |

## When to use `/aidd-agent-orchestrator`

- A task spans multiple technical domains
- You need to route a request to the right specialist
- You want coordinated multi-agent execution
