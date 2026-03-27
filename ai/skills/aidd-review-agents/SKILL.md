---
name: aidd-review-agents
description: Review agentic AI systems against the OWASP Agentic AI Top 10 for security risks. Use when reviewing AI agents, MCP servers, multi-agent architectures, tool-calling code, or agent security.
allowed-tools: Read Grep Glob Bash(git:*)
compatibility: Applicable to any codebase implementing AI agents, MCP servers, or tool-calling patterns.
---

# 🛡️ aidd-review-agents

Act as a top-tier principal software engineer and security specialist to review agentic AI systems against the OWASP Agentic AI Top 10.

## When to use

- Reviewing AI agent implementations or MCP server code
- Evaluating tool definitions and permission scoping
- Assessing multi-agent orchestration and inter-agent communication
- Pre-merge security review of agentic features
- Auditing agent memory, context handling, or retrieval pipelines

Criteria {
  Important: The skill references below (e.g. /aidd-javascript) are files in this repository at ai/skills/<skill-name>/SKILL.md. When reviewing code that a skill applies to, you MUST read the respective skill file first. These skills contain project-specific rules that override mainstream defaults.
  Before beginning, read and respect the constraints in /aidd-please.
  Use /aidd-jwt-security when reviewing token-based agent authentication.
  Use /aidd-timing-safe-compare when reviewing secret comparisons in agent systems.
  Use /aidd-javascript for code quality in agent implementations.
  Use /aidd-structure for architectural layering of agent components.
}

Constraints {
  Don't make changes. Review-only. Output will serve as input for planning.
  NEVER report a finding without citing the exact file:line that proves it. A pattern match is a hypothesis, not a finding. Read the code. If you cannot point to a specific line, drop the finding.
  Fewer findings at high confidence beat many findings with false positives. When uncertain, note it as a question in a separate "Open Questions" section — not as a finding.
  Respect intentional design decisions. If the architecture deliberately accepts a risk (e.g., shared credentials in a single-tenant CLI tool), note the tradeoff but do not flag it as a vulnerability.
  Grade each verified finding: Critical | High | Medium | Low | Info.
  Communicate as friendly markdown prose — not raw SudoLang syntax.
}

For each step, show your work:
    🎯 restate |> 💡 ideate |> 🪞 reflectCritically |> 🔭 expandOrthogonally |> ⚖️ scoreRankEvaluate |> 💬 respond

Patterns {
  ## ASI01: Agent Goal Hijack
  (user input concatenated into system prompt without boundary) => Critical: prompt injection — enforce instruction/data separation.
  (no input sanitization before agent receives user content) => High: unfiltered injection surface.
  (agent instructions modifiable via tool output or retrieved context) => Critical: indirect prompt injection.

  ## ASI02: Tool Misuse & Exploitation
  (tool with write/delete/exec capability and no argument validation) => Critical: overprivileged tool — validate and constrain arguments.
  (tool arguments constructed from untrusted input without allowlist) => High: tool argument injection.
  (destructive operations without confirmation or dry-run gate) => High: missing safety gate on irreversible action.
  (tool scope broader than task requires) => Medium: excessive tool permissions — apply least privilege.

  ## ASI03: Identity & Privilege Abuse
  (agent uses shared credentials or ambient authority) => Critical: confused deputy — scope credentials per agent per task.
  (no per-agent identity or audit trail) => High: untraceable agent actions.
  (agent can escalate its own permissions at runtime) => Critical: privilege escalation — permissions must be immutable after initialization.

  ## ASI04: Agentic Supply Chain
  (MCP server or plugin loaded without integrity check) => Critical: unsigned component — verify signatures or checksums.
  (third-party tool definitions fetched at runtime from untrusted source) => Critical: supply chain injection.
  (no pinned versions for agent dependencies or tool schemas) => Medium: unpinned dependency — pin versions and audit changes.

  ## ASI05: Unexpected Code Execution
  (eval, exec, Function(), or vm.runInNewContext on agent-generated content) => Critical: RCE — never eval agent output.
  (agent-generated code executed without sandbox) => Critical: unsandboxed execution — use isolated runtime.
  (shell command constructed from agent output without escaping) => Critical: command injection.

  ## ASI06: Memory & Context Poisoning
  (RAG retrieval results not validated or attributed) => High: context poisoning — validate and cite retrieval sources.
  (persistent memory writable by agent without human review) => High: memory manipulation — require approval for memory writes.
  (conversation history includes unverified external content) => Medium: context window pollution.

  ## ASI07: Insecure Inter-Agent Communication
  (agent-to-agent messages sent without authentication) => Critical: agent impersonation — authenticate all inter-agent channels.
  (no schema validation on messages between agents) => High: malformed message injection.
  (shared mutable state between agents without access control) => High: cross-agent state corruption.

  ## ASI08: Cascading Failures
  (no timeout, retry limit, or circuit breaker on agent tool calls) => High: unbounded retry loop — set limits.
  (agent can spawn sub-agents without depth or count limit) => High: fork bomb — cap recursion depth and agent count.
  (error in one agent propagates unchecked to upstream agents) => Medium: blast radius — isolate failures with error boundaries.

  ## ASI09: Human-Agent Trust Exploitation
  (high-impact action executed without human-in-the-loop confirmation) => Critical: missing approval gate — require human approval for irreversible actions.
  (agent output presented as authoritative without provenance) => Medium: over-reliance — show confidence and source attribution.
  (no audit log of agent decisions and actions) => High: unaccountable autonomy — log all decisions.

  ## ASI10: Rogue Agents
  (agent can access data outside its declared scope) => Critical: data exfiltration risk — enforce data boundaries.
  (no behavioral monitoring or anomaly detection for agent actions) => Medium: insider threat — log and monitor for drift.
  (agent objectives not constrained by explicit goal specification) => High: misalignment — define and enforce goal boundaries.
}

ReviewProcess {
  1. Gather product context: read README, architecture docs, and config files to determine the system type (CLI tool, multi-tenant service, internal pipeline, etc.) and trust model.
  2. Inventory agentic components: agents, tools, MCP servers, plugins, inter-agent channels, memory systems. List each with its file location.
  3. Map trust boundaries: what data flows between agents, tools, users, and external systems. Note which boundaries are intentional.
  4. Walk each OWASP Agentic AI Top 10 pattern against the inventory. For each potential match:
     a. Read the suspect code and surrounding context
     b. Verify: does the exact line prove the vulnerability, or is it a false positive?
     c. If unverifiable, move to Open Questions — do not report as a finding
  5. Assess cascading risk: which verified findings compound when combined
  6. Report: verified findings ranked by severity, each with file:line citation, then Open Questions separately
}

## Examples

A verified finding:

> **ASI05 — Critical: unsandboxed code execution** (`src/agent/executor.ts:47`)
> `eval(agentResponse.code)` runs agent-generated code without a sandbox.
> **Remediation:** Execute in an isolated VM context or container.

An open question (unverifiable — belongs in Open Questions, not findings):

> The plugin loader at `src/plugins/index.ts` fetches definitions from a config URL.
> Is this URL user-controlled or pinned to an internal registry?

## Edge cases

- Single-agent CLI tools: many ASI items (inter-agent comms, cascading failures) do not apply — skip them rather than force-fitting findings
- Partial coverage: not all 10 ASI categories apply to every system — only report categories where the codebase has relevant components

Commands {
  🛡️ /review-agents - review agentic AI systems against OWASP Agentic AI Top 10
}
