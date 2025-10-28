import { asyncPipe } from "../src/utils/asyncPipe.js";
import { exec } from "child_process";
import { promisify } from "util";

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
    throw new Error(
      `Cannot update latest tag: ${version} is a prerelease version`,
    );
  }
  return { version, dryRun };
};

// Pure side effect - assumes valid input
const performLatestTagUpdate = async ({ version, dryRun = false }) => {
  if (dryRun) {
    return {
      success: true,
      message: `Would update latest tag to ${version}`,
      operation: "dry-run",
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

    return {
      success: true,
      message: `Updated latest tag to ${version} (${commitRef.substring(0, 7)})`,
      operation: "update",
    };
  } catch (error) {
    throw new Error(`Failed to update latest tag: ${error.message}`);
  }
};

// Error handler that converts thrown errors to result objects
const handleLatestTagErrors = async (input) => {
  try {
    return await performLatestTagUpdate(input);
  } catch (error) {
    return {
      success: false,
      message: error.message,
      operation: "error",
    };
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
      success: false,
      message: error.message,
      operation: "error",
    };
  }
};

export { isPrerelease, shouldUpdateLatestTag, updateLatestTag };
