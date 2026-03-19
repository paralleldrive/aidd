/**
 * Agent CLI configuration — resolves agent command and arguments
 * Type definitions for aidd/agent-config
 */

/** Resolved agent command configuration */
export interface AgentConfig {
  /** Executable command to run */
  command: string;
  /** Arguments to pass before the prompt */
  args?: string[];
}

/** Options for resolveAgentConfig */
export interface ResolveAgentConfigOptions {
  /**
   * Explicit agent config: a preset name (e.g. "claude"), a YAML file path,
   * or an inline AgentConfig object. When omitted the function falls back to
   * AIDD_AGENT_CONFIG env var then aidd-custom/config.yml then "claude".
   */
  value?: string | AgentConfig;
  /** Working directory used when resolving relative config file paths */
  cwd?: string;
}

/**
 * Return a built-in agent preset by name.
 * Supported presets: "claude", "cursor", "opencode".
 *
 * @throws When the requested preset name is not recognised
 *
 * @example
 * const config = getAgentConfig('claude');
 * // => { command: 'claude', args: ['-p'] }
 */
export function getAgentConfig(name?: string): AgentConfig;

/**
 * Resolve the agent configuration from multiple sources in priority order:
 * 1. The `value` option (preset name, YAML file path, or inline object)
 * 2. `AIDD_AGENT_CONFIG` environment variable
 * 3. `agent-config` key in `aidd-custom/config.yml` relative to `cwd`
 * 4. Default preset "claude"
 *
 * @example
 * const config = await resolveAgentConfig({ value: 'opencode' });
 * // => { command: 'opencode', args: ['run'] }
 *
 * @example
 * const config = await resolveAgentConfig({ value: './my-agent.yml', cwd: '/project' });
 * // => { command: 'my-agent', args: ['--flag'] }
 */
export function resolveAgentConfig(
  options?: ResolveAgentConfigOptions,
): Promise<AgentConfig>;
