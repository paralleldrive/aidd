/**
 * Git release tag helpers
 */

/** Result of a latest-tag update operation */
export interface UpdateLatestTagResult {
  message: string;
  operation: "dry-run" | "update" | "error";
  success: boolean;
}

/**
 * Returns true if the version string contains a prerelease identifier
 * (rc, alpha, beta, dev, preview).
 */
export function isPrerelease(version?: string): boolean;

/**
 * Returns true if the version should update the `latest` dist-tag
 * (i.e. it is not a prerelease).
 */
export function shouldUpdateLatestTag(version?: string): boolean;

/**
 * Move the `latest` git tag to the commit for the given version and push.
 * @param input - version string and optional dryRun flag
 */
export function updateLatestTag(input?: {
  version?: string;
  dryRun?: boolean;
}): Promise<UpdateLatestTagResult>;
