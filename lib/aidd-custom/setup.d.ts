/**
 * Create aidd-custom/config.yml with default project settings
 * @param options - base directory in which to create the config
 */
export function createAiddCustomConfig(options: {
  targetBase: string;
}): () => Promise<{ created: boolean; message: string }>;

/**
 * Create aidd-custom/AGENTS.md scaffold so users can override root AGENTS.md settings
 * @param options - base directory in which to create the file
 */
export function createAiddCustomAgentsMd(options: {
  targetBase: string;
}): () => Promise<{ created: boolean; message: string }>;
