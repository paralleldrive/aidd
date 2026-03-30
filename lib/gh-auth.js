import { execFile } from "child_process";

let cachedGhToken = /** @type {string | null | undefined} */ (undefined);

/**
 * Returns a GitHub token for API authentication.
 *
 * Resolution order:
 * 1. `GITHUB_TOKEN` environment variable (explicit override)
 * 2. `gh auth token` output (GitHub CLI credential store)
 *
 * The `gh` CLI result is cached for the lifetime of the process to avoid
 * repeated subprocess spawns.
 *
 * @param {{ execFileFn?: Function }} [options] - DI seam for testing
 * @returns {Promise<string | undefined>}
 */
const getGitHubToken = async ({ execFileFn = execFile } = {}) => {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;

  if (cachedGhToken !== undefined) return cachedGhToken ?? undefined;

  try {
    const token = await new Promise((resolve, reject) => {
      execFileFn(
        "gh",
        ["auth", "token"],
        (/** @type {any} */ err, /** @type {string} */ stdout) => {
          if (err) return reject(err);
          resolve(stdout.trim());
        },
      );
    });
    cachedGhToken = /** @type {string} */ (token) || null;
    return cachedGhToken ?? undefined;
  } catch {
    cachedGhToken = null;
    return undefined;
  }
};

/** Reset the cached `gh auth token` value (for tests). */
const resetGhTokenCache = () => {
  cachedGhToken = undefined;
};

export { getGitHubToken, resetGhTokenCache };
