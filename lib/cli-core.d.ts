/**
 * CLI core utilities for the aidd clone operation
 */

/** CLI output logger interface */
export interface Logger {
  cyan: (msg: string) => void;
  dryRun: (msg: string) => void;
  error: (msg: string) => void;
  gray: (msg: string) => void;
  info: (msg: string) => void;
  success: (msg: string) => void;
  verbose: (msg: string) => void;
  warning: (msg: string) => void;
}

/** Resolved source and target paths for a clone operation */
export interface ResolvedPaths {
  source: string;
  target: string;
  targetBase: string;
}

/** Error detail shape when executeClone fails */
export interface ExecuteCloneError {
  cause?: unknown;
  code?: string;
  message: string;
  type?: string;
}

/** Result returned by executeClone — covers success and error shapes */
export type ExecuteCloneResult =
  | { paths: ResolvedPaths; success: true }
  | { dryRun: true; success: true }
  | { error: ExecuteCloneError; success: false };

/**
 * Create aidd-custom/config.yml with default project settings
 * @param options - base directory in which to create the config
 */
export function createAiddCustomConfig(options: {
  targetBase: string;
}): () => Promise<{ created: boolean; message: string }>;

/**
 * Create a logger instance for CLI output
 * @param options - optional verbose and dryRun flags
 */
export function createLogger(options?: {
  verbose?: boolean;
  dryRun?: boolean;
}): Logger;

/**
 * Resolve source and target paths for the clone operation
 * @param options - optional targetDirectory and packageRoot overrides
 */
export function resolvePaths(options?: {
  targetDirectory?: string;
  packageRoot?: string;
}): ResolvedPaths;

/**
 * Validate that the source ai/ folder exists
 * @param options - source path to validate
 * @throws If source directory does not exist
 */
export function validateSource(options: {
  source: string;
}): Promise<{ valid: boolean }>;

/**
 * Validate that the target ai/ folder does not already exist (unless force is set)
 * @param options - target path and optional force override
 * @throws If target exists and force is false
 */
export function validateTarget(options: {
  target: string;
  force?: boolean;
}): () => Promise<{ exists: boolean; valid: boolean }>;

/**
 * Clone the ai/ folder into the target directory
 * @param options - clone operation options
 */
export function executeClone(options?: {
  targetDirectory?: string;
  force?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  cursor?: boolean;
  claude?: boolean;
}): Promise<ExecuteCloneResult>;

/**
 * Error handler factory for CLI structured errors.
 * Accepts a map of handlers keyed by error name and returns a function
 * that routes a thrown error to the matching handler.
 */
export const handleCliErrors: (handlers: {
  CloneError: (error: Error) => unknown;
  FileSystemError: (error: Error) => unknown;
  ValidationError: (error: Error) => unknown;
}) => (error: Error) => unknown;
