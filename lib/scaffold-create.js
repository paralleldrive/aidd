import path from "path";
import { fileURLToPath } from "url";
import { createError } from "error-causes";
import fs from "fs-extra";

import { resolveAgentConfig } from "./agent-cli/config.js";
import { runAgent } from "./agent-cli/runner.js";
import { scaffoldCleanup } from "./scaffold-cleanup.js";
import { ScaffoldDestinationError } from "./scaffold-errors.js";
import { resolveExtension as defaultResolveExtension } from "./scaffold-resolver.js";
import { runManifest as defaultRunManifest } from "./scaffold-runner.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Resolve the Commander two-optional-arg pattern into { type, resolvedFolder, folderPath }.
 * Returns null when no folder was supplied at all.
 *
 *   create scaffold-example my-project  →  type="scaffold-example", folder="my-project"
 *   create my-project                   →  type=undefined,           folder="my-project"
 *   create                              →  null (caller should error)
 *
 * @param {string | undefined} typeOrFolder
 * @param {string | undefined} folder
 */
const resolveCreateArgs = (typeOrFolder, folder) => {
  if (!typeOrFolder) return null;

  // If no folder was given and the sole argument looks like a URI, the user
  // most likely forgot the folder argument. Return null so the caller emits
  // "missing required argument 'folder'" rather than creating a directory
  // with a mangled URL path.
  if (folder === undefined && /^(https?|file):\/\//i.test(typeOrFolder)) {
    return null;
  }

  const type = folder !== undefined ? typeOrFolder : undefined;
  const resolvedFolder = folder !== undefined ? folder : typeOrFolder;
  const folderPath = path.resolve(process.cwd(), resolvedFolder);

  return { folderPath, resolvedFolder, type };
};

/**
 * Execute the scaffold create flow.
 *
 * Returns { success: true, folderPath } on success.
 * Automatically cleans up downloaded scaffold files when paths.downloaded is true.
 * Throws on failure (caller handles error display and process.exit).
 *
 * @param {{ type?: string, folder: string, agentConfig?: string | { command: string, args?: string[] } | undefined, prompt?: string, packageRoot?: string, resolveExtensionFn?: Function, runManifestFn?: Function }} options
 */
const runCreate = async ({
  type,
  folder,
  agentConfig,
  prompt,
  packageRoot = __dirname,
  resolveExtensionFn = defaultResolveExtension,
  runManifestFn = defaultRunManifest,
}) => {
  if (await fs.pathExists(folder)) {
    throw createError({
      ...ScaffoldDestinationError,
      message: `Destination folder already exists: ${folder}. Delete it or choose a different name before running aidd create.`,
    });
  }

  const paths = await resolveExtensionFn({
    packageRoot,
    type,
  });

  try {
    await fs.ensureDir(folder);

    // Manifest is always at scaffold root (validated by resolver)
    await fs.copy(path.dirname(paths.manifestPath), folder);

    await runManifestFn({
      agentConfig,
      folder,
      manifestPath: path.join(folder, "SCAFFOLD-MANIFEST.yml"),
    });

    if (prompt !== undefined) {
      const agentCfg = await resolveAgentConfig({
        cwd: folder,
        value: agentConfig,
      });
      await runAgent({ agentConfig: agentCfg, cwd: folder, prompt });
    }
  } finally {
    if (paths.downloaded) {
      try {
        await scaffoldCleanup();
      } catch {
        // Cleanup is best-effort; swallow errors so they never mask the
        // original error or prevent a successful return.
      }
    }
  }

  return {
    folderPath: folder,
    success: true,
  };
};

export { resolveCreateArgs, runCreate };
