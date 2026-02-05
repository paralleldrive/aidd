import { exec } from "child_process";
import { promisify } from "util";
import { createError } from "error-causes";

import { asyncPipe } from "../utils/async-pipe.js";

const execAsync = promisify(exec);

const isPrerelease = (version = "") => {
  const prereleaseIdentifiers = ["rc", "alpha", "beta", "dev", "preview"];

  return prereleaseIdentifiers.some((identifier) =>
    version.includes(`-${identifier}`),
  );
};

// Pure predicate - should this version update the latest tag?
const shouldUpdateLatestTag = (version) => !isPrerelease(version);

// Pure validation step
const validateVersionForLatestTag = async ({
  version,
  dryRun = false,
} = {}) => {
  if (!shouldUpdateLatestTag(version)) {
    throw createError({
      code: "PRERELEASE_VERSION",
      message: `Cannot update latest tag: ${version} is a prerelease version`,
      name: "ValidationError",
      requestedVersion: version,
    });
  }
  return { dryRun, version };
};

// Pure side effect - assumes valid input
const performLatestTagUpdate = async ({ version, dryRun = false }) => {
  if (dryRun) {
    return {
      message: `Would update latest tag to ${version}`,
      operation: "dry-run",
      success: true,
    };
  }

  try {
    // Get the git ref for the specified version tag
    const versionTag = version.startsWith("v") ? version : `v${version}`;
    const { stdout: versionRef } = await execAsync(
      `git rev-parse ${versionTag}`,
    );
    const commitRef = versionRef.trim();

    // Create or update the latest tag to point to the version's commit
    await execAsync(`git tag -f latest ${commitRef}`);
    await execAsync(`git push origin latest --force`);

    return {
      message: `Updated latest tag to ${version} (${commitRef.substring(0, 7)}) and pushed to origin`,
      operation: "update",
      success: true,
    };
  } catch (originalError) {
    throw createError({
      cause: originalError,
      code: "GIT_OPERATION_FAILED",
      message: `Failed to update latest tag: ${originalError.message}`,
      name: "GitOperationError",
    });
  }
};

// Composed pipeline with error handling
const updateLatestTag = async (input) => {
  try {
    return await asyncPipe(
      validateVersionForLatestTag,
      performLatestTagUpdate,
    )(input);
  } catch (error) {
    return {
      message: error.message,
      operation: "error",
      success: false,
    };
  }
};

export { isPrerelease, shouldUpdateLatestTag, updateLatestTag };
