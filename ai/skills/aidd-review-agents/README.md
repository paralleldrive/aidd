# aidd-review-agents

Review agentic AI systems against the OWASP Agentic AI Top 10 security risks.

## Why

Agentic AI systems introduce attack surfaces not covered by traditional code
review: prompt injection, tool misuse, privilege abuse, supply chain attacks on
MCP servers, and cascading failures across multi-agent architectures. A
systematic check against all 10 categories ensures nothing is missed.

## Usage

Invoke `/review-agents` on code that implements AI agents, MCP servers, tool
definitions, or multi-agent orchestration. The review identifies all agentic
components, maps trust boundaries, walks each OWASP Agentic AI Top 10 item
against the code, and produces severity-ranked findings with concrete
remediation steps. The skill is read-only — it does not modify files.

## When to use

- Reviewing AI agent implementations or MCP server code
- Evaluating tool definitions and permission scoping
- Assessing multi-agent orchestration and inter-agent communication
- Pre-merge security review of agentic features
- Auditing agent memory, context handling, or retrieval pipelines
