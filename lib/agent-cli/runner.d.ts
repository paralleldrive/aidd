/**
 * Agent CLI runner — spawns an AI agent process with a prompt
 * Type definitions for aidd/agent
 */

import type { AgentConfig } from "./config.js";

export type { AgentConfig } from "./config.js";

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
