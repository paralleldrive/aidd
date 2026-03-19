/**
 * Logger subset used during agent setup (matches cli-core createLogger shape).
 */
export interface AgentsSetupLogger {
  info: (msg: string) => void;
  verbose: (msg: string) => void;
}

/**
 * Run the post-clone agent setup phase: AGENTS.md, aidd-custom files, and index generation.
 */
export function setupAgents(options: {
  targetBase: string;
  verbose?: boolean;
  logger: AgentsSetupLogger;
}): Promise<void>;
