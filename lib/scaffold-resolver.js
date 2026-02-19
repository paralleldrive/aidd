import { spawn } from "child_process";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { createError } from "error-causes";
import fs from "fs-extra";

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
const isFileUrl = (url) => url.startsWith("file://");

// Downloads a tarball from url and extracts it into destPath.
// Uses --strip-components=1 to drop the single root directory that GitHub
// release archives include (e.g. org-repo-sha1234/).
// fetch() is used for the download because it follows redirects automatically;
// the system tar binary handles extraction without additional npm dependencies.
const defaultDownloadAndExtract = async (url, destPath) => {
  const response = await fetch(url);
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
    child.stdin.write(buffer);
    child.stdin.end();
  });
};

const defaultConfirm = async (message) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
};

const defaultLog = (msg) => console.log(msg);

const resolveNamed = ({ type, packageRoot }) => ({
  extensionJsPath: path.resolve(
    packageRoot,
    "../ai/scaffolds",
    type,
    "bin/extension.js",
  ),
  manifestPath: path.resolve(
    packageRoot,
    "../ai/scaffolds",
    type,
    "SCAFFOLD-MANIFEST.yml",
  ),
  readmePath: path.resolve(packageRoot, "../ai/scaffolds", type, "README.md"),
});

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
  log = defaultLog,
} = {}) => {
  const effectiveType =
    type || process.env.AIDD_CUSTOM_EXTENSION_URI || DEFAULT_SCAFFOLD_TYPE;

  let paths;

  if (isHttpUrl(effectiveType)) {
    const confirmed = await confirm(
      `\n⚠️  Warning: You are about to download and execute code from a remote URI:\n  ${effectiveType}\n\nThis code will run on your machine. Only proceed if you trust the source.\nContinue? (y/N): `,
    );
    if (!confirmed) {
      throw createError({
        ...ScaffoldCancelledError,
        message: "Remote extension download cancelled by user.",
      });
    }
    await fs.ensureDir(folder);
    try {
      paths = await downloadExtension({ download, folder, uri: effectiveType });
    } catch (originalError) {
      throw createError({
        ...ScaffoldNetworkError,
        cause: originalError,
        message: `Failed to download scaffold from ${effectiveType}: ${originalError.message}`,
      });
    }
  } else if (isFileUrl(effectiveType)) {
    paths = resolveFileUri({ uri: effectiveType });
  } else {
    paths = resolveNamed({ packageRoot, type: effectiveType });
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

export { resolveExtension };
