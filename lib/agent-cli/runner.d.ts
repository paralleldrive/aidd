/**
 * Agent CLI runner — spawns an AI agent process with a prompt
 * Type definitions for aidd/agent
 */

/** Agent configuration describing how to invoke the agent process */
export interface AgentConfig {
  /** Executable command to run */
  command: string;
  /** Arguments to pass before the prompt */
  args?: string[];
}

/** Options for runAgent */
export interface RunAgentOptions {
  /** Resolved agent configuration */
  agentConfig: AgentConfig;
  /** Prompt text to pass to the agent */
  prompt: string;
  /** Working directory for the spawned process */
  cwd: string;
}

/**
 * Spawn an AI agent process with the given prompt.
 * Resolves when the process exits with code 0; rejects otherwise.
 *
 * @example
 * await runAgent({
 *   agentConfig: { command: 'claude', args: ['-p'] },
 *   prompt: 'Fix the bug in src/index.js',
 *   cwd: process.cwd(),
 * });
 */
export function runAgent(options: RunAgentOptions): Promise<void>;
