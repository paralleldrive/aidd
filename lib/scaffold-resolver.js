import { spawn } from "child_process";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { createError } from "error-causes";
import fs from "fs-extra";

import { AIDD_HOME, readConfig } from "./aidd-config.js";
import { resolveGithubAuthToken } from "./github-auth-token.js";
import {
  ScaffoldCancelledError,
  ScaffoldDestinationError,
  ScaffoldNetworkError,
  ScaffoldValidationError,
} from "./scaffold-errors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_SCAFFOLD_TYPE = "next-shadcn";

// @ts-expect-error -- url is always a string in practice
const isHttpUrl = (url) => {
  const lower = url.toLowerCase();
  return lower.startsWith("http://") || lower.startsWith("https://");
};
// @ts-expect-error
const isInsecureHttpUrl = (url) => url.toLowerCase().startsWith("http://");
// @ts-expect-error
const isFileUrl = (url) => url.toLowerCase().startsWith("file://");

// Returns true for bare https://github.com/owner/repo URLs (no extra path segments).
// @ts-expect-error
const isGitHubRepoUrl = (url) => {
  if (!url.toLowerCase().startsWith("https://github.com/")) return false;
  const pathname = new URL(url).pathname.replace(/\.git$/, "");
  const parts = pathname.split("/").filter(Boolean);
  return parts.length === 2;
};

// Fetches the latest release tarball URL from the GitHub API.
// Prefer `gh auth login` (see resolveGithubAuthToken); optional GITHUB_TOKEN /
// GH_TOKEN for CI and compatibility (5,000 req/hr authenticated vs. 60/hr IP).
/**
 * @param {string} repoUrl
 * @param {{ getAuthToken?: () => Promise<string | undefined> }} [options]
 */
const defaultResolveRelease = async (
  repoUrl,
  { getAuthToken = resolveGithubAuthToken } = {},
) => {
  const { pathname } = new URL(repoUrl);
  const [, owner, rawRepo] = pathname.split("/");
  const repo = rawRepo.replace(/\.git$/, "");
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  const token = await getAuthToken();
  /** @type {Record<string, string>} */
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "aidd-cli",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(apiUrl, { headers });
  if (!response.ok) {
    if (response.status === 403) {
      throw createError({
        ...ScaffoldNetworkError,
        message: `GitHub API rate limit exceeded for ${repoUrl}. Authenticate for 5,000 req/hr (run \`gh auth login\` or set GITHUB_TOKEN or GH_TOKEN).`,
      });
    }
    const tokenHint = token
      ? ""
      : " If the repo is private, run `gh auth login` or set GITHUB_TOKEN (or GH_TOKEN) to authenticate.";
    throw createError({
      ...ScaffoldNetworkError,
      message: `GitHub API returned ${response.status} for ${repoUrl} — no releases found or repo is private.${tokenHint}`,
    });
  }
  const release = /** @type {any} */ (await response.json());
  if (!release.tarball_url) {
    throw createError({
      ...ScaffoldNetworkError,
      message: `No tarball URL in latest release of ${repoUrl}`,
    });
  }
  return release.tarball_url;
};

// Downloads a tarball from url and extracts it into destPath.
// Uses --strip-components=1 to drop the single root directory that GitHub
// release archives include (e.g. org-repo-sha1234/).
// fetch() is used for the download because it follows redirects automatically;
// the system tar binary handles extraction without additional npm dependencies.
// GitHub credentials are attached only for GitHub hostnames so tokens are never
// sent to third-party tarball URLs.
const GITHUB_DOWNLOAD_HOSTNAMES = new Set([
  "api.github.com",
  "github.com",
  "codeload.github.com",
]);
/**
 * @param {string} url
 * @param {string} destPath
 * @param {{ getAuthToken?: () => Promise<string | undefined> }} [options]
 */
const defaultDownloadAndExtract = async (
  url,
  destPath,
  { getAuthToken = resolveGithubAuthToken } = {},
) => {
  /** @type {Record<string, string>} */
  const headers = {};
  // Credentials are only attached to GitHub hostnames; calling getAuthToken is
  // skipped entirely for third-party URLs to avoid unnecessary subprocess calls.
  try {
    const { hostname } = new URL(url);
    if (GITHUB_DOWNLOAD_HOSTNAMES.has(hostname)) {
      const token = await getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // Malformed URL — skip auth header; fetch will fail with its own error
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw createError({
      ...ScaffoldNetworkError,
      message: `HTTP ${response.status} downloading scaffold from ${url}`,
    });
  }

  // Buffer the body — scaffold tarballs are small, so memory usage is fine.
  const buffer = Buffer.from(await response.arrayBuffer());

  await new Promise((resolve, reject) => {
    const child = spawn(
      "tar",
      ["-xz", "--strip-components=1", "-C", destPath],
      { stdio: ["pipe", "inherit", "inherit"] },
    );
    let settled = false;
    /** @type {(fn: (...args: any[]) => void) => (...args: any[]) => void} */
    const settle =
      (fn) =>
      (...args) => {
        if (!settled) {
          settled = true;
          fn(...args);
        }
      };
    child.on("close", (code) => {
      if (code !== 0)
        settle(reject)(
          createError({
            ...ScaffoldNetworkError,
            message: `tar exited with code ${code} extracting ${url}`,
          }),
        );
      else settle(resolve)();
    });
    child.on("error", settle(reject));
    // Swallow EPIPE on stdin — it fires when tar exits before consuming all
    // input (normal for valid tarballs). The close event is authoritative.
    // Without any listener, Node would crash on the unhandled error event.
    child.stdin.on("error", () => {});
    child.stdin.write(buffer);
    child.stdin.end();
  });
};

// @ts-expect-error -- message is always a string
const defaultConfirm = async (message) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve, reject) => {
    // Reject if stdin closes or errors before the user answers — avoids hanging
    const onClose = () =>
      reject(
        createError({
          ...ScaffoldCancelledError,
          message: "Remote extension download cancelled (stdin closed).",
        }),
      );
    // @ts-expect-error
    const onError = (err) =>
      reject(
        createError({
          ...ScaffoldCancelledError,
          cause: err,
          message: "Remote extension download cancelled (stdin error).",
        }),
      );
    rl.on("close", onClose);
    rl.on("error", onError);
    rl.question(message, (answer) => {
      rl.removeListener("close", onClose);
      rl.removeListener("error", onError);
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
};

// Resolve a named scaffold from the bundled package.
//
// packageRoot is the lib/ directory of the installed aidd package.  When the
// CLI is invoked via `npx aidd` the npm cache provides this directory; when
// invoked via `node bin/aidd.js` it is the workspace lib/ dir.  Either way,
// path.resolve(packageRoot, '../ai/scaffolds') always points to the ai/scaffolds
// folder that ships inside the package — no local clone of the aidd repo is
// required or assumed.
// @ts-expect-error -- parameters are always typed at call sites
const resolveNamed = ({ type, packageRoot }) => {
  const scaffoldsRoot = path.resolve(packageRoot, "../ai/scaffolds");
  const typeDir = path.resolve(scaffoldsRoot, type);

  // Reject path traversal and invalid names using path.relative():
  // - relative starts with ".." → resolved outside scaffoldsRoot
  // - relative is absolute   → path.resolve produced an absolute path (shouldn't happen, but guard anyway)
  // - relative is ""         → type is "." or resolves to scaffoldsRoot itself (not a valid scaffold name)
  const relative = path.relative(scaffoldsRoot, typeDir);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    const reason = !relative
      ? `"${type}" resolves to the scaffolds root directory, not a specific scaffold`
      : `"${type}" resolves outside the scaffolds directory`;
    throw createError({
      ...ScaffoldValidationError,
      message: `Invalid scaffold type: ${reason}. Use a simple scaffold name like "next-shadcn".`,
    });
  }

  return {
    manifestPath: path.join(typeDir, "SCAFFOLD-MANIFEST.yml"),
    readmePath: path.join(typeDir, "README.md"),
  };
};

// @ts-expect-error
const resolveFileUri = ({ uri }) => {
  const localPath = fileURLToPath(uri);
  return {
    manifestPath: path.join(localPath, "SCAFFOLD-MANIFEST.yml"),
    readmePath: path.join(localPath, "README.md"),
  };
};

const SCAFFOLD_DOWNLOAD_DIR = path.join(AIDD_HOME, "scaffold");

// GitHub release tarballs may convert hyphens to underscores in filenames,
// so SCAFFOLD-MANIFEST.yml can arrive as SCAFFOLD_MANIFEST.yml.
// This list is checked in priority order: the hyphen form is canonical.
const SCAFFOLD_MANIFEST_NAMES = [
  "SCAFFOLD-MANIFEST.yml",
  "SCAFFOLD_MANIFEST.yml",
];

/**
 * Resolves the manifest path within a directory, checking both the canonical
 * hyphen form and the underscore form that GitHub tarballs may produce.
 * Returns the path to the first existing variant, or the canonical path as a
 * fallback (so callers receive a meaningful path in error messages).
 * @param {string} dir
 */
const resolveManifestPath = async (dir) => {
  for (const name of SCAFFOLD_MANIFEST_NAMES) {
    const manifestPath = path.join(dir, name);
    if (await fs.pathExists(manifestPath)) {
      return manifestPath;
    }
  }
  // Fallback: return canonical name so error messages are informative
  return path.join(dir, SCAFFOLD_MANIFEST_NAMES[0]);
};

/**
 * @param {{uri: string, scaffoldDownloadDir?: string, download: Function}} options
 */
const downloadExtension = async ({
  uri,
  scaffoldDownloadDir = SCAFFOLD_DOWNLOAD_DIR,
  download,
}) => {
  if (await fs.pathExists(scaffoldDownloadDir)) {
    throw createError({
      ...ScaffoldDestinationError,
      message: `Scaffold download destination already exists: ${scaffoldDownloadDir}. Delete that directory manually before downloading again.`,
    });
  }
  await fs.ensureDir(scaffoldDownloadDir);
  await download(uri, scaffoldDownloadDir);
  return {
    manifestPath: await resolveManifestPath(scaffoldDownloadDir),
    readmePath: path.join(scaffoldDownloadDir, "README.md"),
  };
};

/**
 * @param {{effectiveType: string, packageRoot: string, scaffoldDownloadDir: string, download: Function, resolveRelease: Function, confirm: Function}} options
 */
const resolvePaths = async ({
  effectiveType,
  packageRoot,
  scaffoldDownloadDir,
  download,
  resolveRelease,
  confirm,
}) => {
  if (isInsecureHttpUrl(effectiveType)) {
    throw createError({
      ...ScaffoldValidationError,
      message: `Scaffold URI must use https://, not http://. Rejected: ${effectiveType}. Change the URI to https:// and try again.`,
    });
  }

  if (isHttpUrl(effectiveType)) {
    let confirmed;
    try {
      confirmed = await confirm(
        `\n⚠️  Warning: You are about to download and execute code from a remote URI:\n  ${effectiveType}\n\nThis code will run on your machine. Only proceed if you trust the source.\nContinue? (y/N): `,
      );
    } catch (err) {
      // A custom confirm may throw anything; always wrap as ScaffoldCancelledError
      // but preserve the original message so specific causes ("stdin closed", etc.) surface.
      throw createError({
        ...ScaffoldCancelledError,
        cause: err,
        message:
          /** @type {any} */ (err)?.message ??
          "Remote extension download cancelled.",
      });
    }
    if (!confirmed) {
      throw createError({
        ...ScaffoldCancelledError,
        message: "Remote extension download cancelled by user.",
      });
    }
    // Resolve bare GitHub repo URLs to the latest release tarball
    let downloadUri = effectiveType;
    if (isGitHubRepoUrl(effectiveType)) {
      try {
        downloadUri = await resolveRelease(effectiveType);
      } catch (originalError) {
        throw createError({
          ...ScaffoldNetworkError,
          cause: originalError,
          message: `Failed to resolve latest release for ${effectiveType}: ${/** @type {any} */ (originalError).message}`,
        });
      }
    }
    try {
      return {
        ...(await downloadExtension({
          download,
          scaffoldDownloadDir,
          uri: downloadUri,
        })),
        downloaded: true,
      };
    } catch (originalError) {
      // Destination-conflict errors are not network errors — re-throw as-is.
      if (
        /** @type {any} */ (originalError)?.cause?.code ===
        "SCAFFOLD_DESTINATION_ERROR"
      ) {
        throw originalError;
      }
      throw createError({
        ...ScaffoldNetworkError,
        cause: originalError,
        message: `Failed to download scaffold from ${effectiveType}: ${/** @type {any} */ (originalError).message}`,
      });
    }
  }

  if (isFileUrl(effectiveType)) {
    return { ...resolveFileUri({ uri: effectiveType }), downloaded: false };
  }

  return {
    ...resolveNamed({ packageRoot, type: effectiveType }),
    downloaded: false,
  };
};

/**
 * Resolves the scaffold source (named, file://, or remote URL) to manifest and README paths.
 * Prompts for confirmation before downloading remote code.
 * @param {{ type?: string, packageRoot?: string, scaffoldDownloadDir?: string, confirm?: Function, download?: Function, resolveRelease?: Function, log?: Function, readConfigFn?: Function }} [options]
 * @returns {Promise<{ manifestPath: string, readmePath: string, downloaded: boolean }>}
 */
const resolveExtension = async ({
  type,
  packageRoot = __dirname,
  scaffoldDownloadDir = SCAFFOLD_DOWNLOAD_DIR,
  confirm = defaultConfirm,
  download = defaultDownloadAndExtract,
  resolveRelease = defaultResolveRelease,
  log = console.log,
  readConfigFn = readConfig,
} = {}) => {
  const config = await readConfigFn();
  const effectiveType =
    type ||
    process.env.AIDD_CUSTOM_CREATE_URI ||
    config["create-uri"] ||
    DEFAULT_SCAFFOLD_TYPE;

  const paths = await resolvePaths({
    confirm,
    download,
    effectiveType,
    packageRoot,
    resolveRelease,
    scaffoldDownloadDir,
  });

  // Fail fast with a clear error if the manifest is missing so callers don't
  // receive a path that silently produces a raw ENOENT later in runManifest.
  const manifestExists = await fs.pathExists(paths.manifestPath);
  if (!manifestExists) {
    throw createError({
      ...ScaffoldValidationError,
      message: `SCAFFOLD-MANIFEST.yml not found at ${paths.manifestPath}. Check that the scaffold source (${effectiveType}) contains a SCAFFOLD-MANIFEST.yml.`,
    });
  }

  const readmeExists = await fs.pathExists(paths.readmePath);
  if (readmeExists) {
    const readme = await fs.readFile(paths.readmePath, "utf-8");
    log(`\n${readme}`);
  }

  return paths;
};

export {
  defaultDownloadAndExtract,
  defaultResolveRelease,
  resolveExtension,
  resolveManifestPath,
  SCAFFOLD_DOWNLOAD_DIR,
  SCAFFOLD_MANIFEST_NAMES,
};
