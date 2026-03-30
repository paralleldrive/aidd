import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/**
 * Reads a token from `gh auth token` when available.
 * @returns {Promise<string | undefined>}
 */
async function defaultGetGhToken() {
  try {
    const { stdout } = await execFileAsync("gh", ["auth", "token"], {
      encoding: "utf8",
      maxBuffer: 65_536,
      timeout: 15_000,
      windowsHide: true,
    });
    const trimmed = stdout?.trim();
    return trimmed || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Token for GitHub API and tarball requests: GitHub CLI first, then env vars.
 * @param {{ getGhToken?: () => Promise<string | undefined> }} [options]
 * @returns {Promise<string | undefined>}
 */
export async function resolveGithubAuthToken(options = {}) {
  const { getGhToken = defaultGetGhToken } = options;
  const fromGh = await getGhToken();
  const ghTrimmed = fromGh?.trim();
  if (ghTrimmed) return ghTrimmed;
  const fromEnv =
    process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim();
  return fromEnv || undefined;
}
