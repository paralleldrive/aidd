# aidd-agent-orchestrator

Coordinates specialized agents for software development tasks, routing requests
to the right agent based on the domain of work.

## Why

Complex tasks span multiple domains — UI, state, testing, product planning.
The orchestrator dispatches work to the agent with the deepest expertise for
each concern instead of relying on a single generalist prompt.

## Usage

Invoke `/aidd-agent-orchestrator` when a task touches multiple domains or you
need help choosing the right specialized skill. The orchestrator infers which
domains apply, selects the appropriate agent(s), and coordinates execution.

## When to use

- A task spans multiple technical domains
- You need to route a request to the right specialist
- You want coordinated multi-agent execution
