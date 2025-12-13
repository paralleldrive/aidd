/**
 * AGENTS.md file management for AI agent directives
 */

/** Result of ensureAgentsMd operation */
export interface AgentsMdResult {
  /** Action taken: "created", "appended", or "unchanged" */
  action: "created" | "appended" | "unchanged";
  /** Human-readable message describing the action */
  message: string;
}

/** Required directive keywords that must be present in AGENTS.md */
export const REQUIRED_DIRECTIVES: readonly string[];

/** Default content for newly created AGENTS.md files */
export const AGENTS_MD_CONTENT: string;

/**
 * Check if AGENTS.md exists at the target path
 * @param targetBase - Base directory to check
 */
export function agentsFileExists(targetBase: string): Promise<boolean>;

/**
 * Read existing AGENTS.md content
 * @param targetBase - Base directory containing AGENTS.md
 * @throws {Error} If file cannot be read
 */
export function readAgentsFile(targetBase: string): Promise<string>;

/**
 * Check if the content contains all required directives
 * @param content - AGENTS.md content to check
 */
export function hasAllDirectives(content: string): boolean;

/**
 * Get list of missing directives from content
 * @param content - AGENTS.md content to check
 * @returns Array of missing directive keywords
 */
export function getMissingDirectives(content: string): string[];

/**
 * Write AGENTS.md file
 * @param targetBase - Base directory to write to
 * @param content - Content to write
 * @throws {Error} If file cannot be written
 */
export function writeAgentsFile(targetBase: string, content: string): Promise<void>;

/**
 * Append directives to existing AGENTS.md
 * @param targetBase - Base directory containing AGENTS.md
 * @param existingContent - Current content of AGENTS.md
 */
export function appendDirectives(targetBase: string, existingContent: string): Promise<void>;

/**
 * Ensure AGENTS.md exists with required directives
 *
 * - If AGENTS.md does not exist, creates it with standard content
 * - If AGENTS.md exists but missing directives, appends them
 * - If AGENTS.md exists with all directives, does nothing
 *
 * @param targetBase - Base directory for AGENTS.md
 * @returns Result indicating action taken
 *
 * @example
 * const result = await ensureAgentsMd('/path/to/project');
 * // result.action: "created" | "appended" | "unchanged"
 */
export function ensureAgentsMd(targetBase: string): Promise<AgentsMdResult>;
