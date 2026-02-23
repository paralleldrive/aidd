import { spawn } from "child_process";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { createError } from "error-causes";
import fs from "fs-extra";

import { readConfig } from "./aidd-config.js";
import {
  ScaffoldCancelledError,
  ScaffoldNetworkError,
  ScaffoldValidationError,
} from "./scaffold-errors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_SCAFFOLD_TYPE = "next-shadcn";

const isHttpUrl = (url) =>
  url.startsWith("http://") || url.startsWith("https://");
const isInsecureHttpUrl = (url) => url.startsWith("http://");
const isFileUrl = (url) => url.startsWith("file://");

// Returns true for bare https://github.com/owner/repo URLs (no extra path segments).
const isGitHubRepoUrl = (url) => {
  if (!url.startsWith("https://github.com/")) return false;
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts.length === 2;
};

// Fetches the latest release tarball URL from the GitHub API.
// Set GITHUB_TOKEN in the environment for private repos and higher rate limits
// (5,000 req/hr authenticated vs. 60 req/hr unauthenticated).
const defaultResolveRelease = async (repoUrl) => {
  const { pathname } = new URL(repoUrl);
  const [, owner, repo] = pathname.split("/");
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "aidd-cli",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const response = await fetch(apiUrl, { headers });
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(
        `GitHub API rate limit exceeded for ${repoUrl}. Set GITHUB_TOKEN for 5,000 req/hr.`,
      );
    }
    const tokenHint = process.env.GITHUB_TOKEN
      ? ""
      : " If the repo is private, set GITHUB_TOKEN to authenticate.";
    throw new Error(
      `GitHub API returned ${response.status} for ${repoUrl} — no releases found or repo is private.${tokenHint}`,
    );
  }
  const release = await response.json();
  if (!release.tarball_url) {
    throw new Error(`No tarball URL in latest release of ${repoUrl}`);
  }
  return release.tarball_url;
};

// Downloads a tarball from url and extracts it into destPath.
// Uses --strip-components=1 to drop the single root directory that GitHub
// release archives include (e.g. org-repo-sha1234/).
// fetch() is used for the download because it follows redirects automatically;
// the system tar binary handles extraction without additional npm dependencies.
// GITHUB_TOKEN is forwarded only for GitHub hostnames to avoid leaking it to
// third-party servers that happen to host a scaffold tarball.
const GITHUB_DOWNLOAD_HOSTNAMES = new Set([
  "api.github.com",
  "github.com",
  "codeload.github.com",
]);
const defaultDownloadAndExtract = async (url, destPath) => {
  const headers = {};
  if (process.env.GITHUB_TOKEN) {
    try {
      const { hostname } = new URL(url);
      if (GITHUB_DOWNLOAD_HOSTNAMES.has(hostname)) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
      }
    } catch {
      // Malformed URL — skip auth header; fetch will fail with its own error
    }
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} downloading scaffold from ${url}`);
  }

  // Buffer the body — scaffold tarballs are small, so memory usage is fine.
  const buffer = Buffer.from(await response.arrayBuffer());

  await new Promise((resolve, reject) => {
    const child = spawn(
      "tar",
      ["-xz", "--strip-components=1", "-C", destPath],
      { stdio: ["pipe", "inherit", "inherit"] },
    );
    child.on("close", (code) => {
      if (code !== 0)
        reject(new Error(`tar exited with code ${code} extracting ${url}`));
      else resolve();
    });
    child.on("error", reject);
    // Guard against EPIPE if tar exits before consuming all stdin.
    // Without this listener the unhandled 'error' event crashes Node.
    child.stdin.on("error", reject);
    child.stdin.write(buffer);
    child.stdin.end();
  });
};

const defaultConfirm = async (message) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve, reject) => {
    // Reject if stdin closes or errors before the user answers — avoids hanging
    const onClose = () =>
      reject(
        Object.assign(new Error("stdin closed before answer"), {
          type: "close",
        }),
      );
    const onError = (err) => reject(Object.assign(err, { type: "error" }));
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

const defaultLog = (msg) => console.log(msg);

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
    extensionJsPath: path.join(typeDir, "bin/extension.js"),
    manifestPath: path.join(typeDir, "SCAFFOLD-MANIFEST.yml"),
    readmePath: path.join(typeDir, "README.md"),
  };
};

const resolveFileUri = ({ uri }) => {
  const localPath = fileURLToPath(uri);
  return {
    extensionJsPath: path.join(localPath, "bin/extension.js"),
    manifestPath: path.join(localPath, "SCAFFOLD-MANIFEST.yml"),
    readmePath: path.join(localPath, "README.md"),
  };
};

const downloadExtension = async ({ uri, folder, download }) => {
  const scaffoldDir = path.join(folder, ".aidd/scaffold");
  // Remove any prior download so we start clean
  await fs.remove(scaffoldDir);
  await fs.ensureDir(scaffoldDir);
  await download(uri, scaffoldDir);
  return {
    extensionJsPath: path.join(scaffoldDir, "bin/extension.js"),
    manifestPath: path.join(scaffoldDir, "SCAFFOLD-MANIFEST.yml"),
    readmePath: path.join(scaffoldDir, "README.md"),
  };
};

const resolveExtension = async ({
  type,
  folder,
  packageRoot = __dirname,
  confirm = defaultConfirm,
  download = defaultDownloadAndExtract,
  resolveRelease = defaultResolveRelease,
  log = defaultLog,
  readConfigFn = readConfig,
} = {}) => {
  const config = await readConfigFn();
  const effectiveType =
    type ||
    process.env.AIDD_CUSTOM_CREATE_URI ||
    config["create-uri"] ||
    DEFAULT_SCAFFOLD_TYPE;

  let paths;

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
    } catch {
      // stdin closed or errored before the user could answer — treat as cancellation
      throw createError({
        ...ScaffoldCancelledError,
        message: "Remote extension download cancelled (stdin closed or error).",
      });
    }
    if (!confirmed) {
      throw createError({
        ...ScaffoldCancelledError,
        message: "Remote extension download cancelled by user.",
      });
    }
    await fs.ensureDir(folder);
    // Resolve bare GitHub repo URLs to the latest release tarball
    let downloadUri = effectiveType;
    if (isGitHubRepoUrl(effectiveType)) {
      try {
        downloadUri = await resolveRelease(effectiveType);
      } catch (originalError) {
        throw createError({
          ...ScaffoldNetworkError,
          cause: originalError,
          message: `Failed to resolve latest release for ${effectiveType}: ${originalError.message}`,
        });
      }
    }
    try {
      paths = {
        ...(await downloadExtension({ download, folder, uri: downloadUri })),
        downloaded: true,
      };
    } catch (originalError) {
      throw createError({
        ...ScaffoldNetworkError,
        cause: originalError,
        message: `Failed to download scaffold from ${effectiveType}: ${originalError.message}`,
      });
    }
  } else if (isFileUrl(effectiveType)) {
    paths = { ...resolveFileUri({ uri: effectiveType }), downloaded: false };
  } else {
    paths = {
      ...resolveNamed({ packageRoot, type: effectiveType }),
      downloaded: false,
    };
  }

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

export { defaultDownloadAndExtract, defaultResolveRelease, resolveExtension };
