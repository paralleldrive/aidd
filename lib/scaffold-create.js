import path from "path";
import { fileURLToPath } from "url";
import { createError } from "error-causes";
import fs from "fs-extra";

import { ScaffoldValidationError } from "./scaffold-errors.js";
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
 * All IO dependencies are injectable for unit testing.
 *
 * Returns { success: true, folderPath, cleanupTip } on success.
 * Throws on failure (caller handles error display and process.exit).
 *
 * @param {{ type?: string, folder?: string, agent?: string, packageRoot?: string, resolveExtensionFn?: Function, runManifestFn?: Function, ensureDirFn?: Function, copyFn?: Function, existsFn?: Function }} [options]
 */
const runCreate = async ({
  type,
  folder,
  agent = "claude",
  packageRoot = __dirname,
  resolveExtensionFn = defaultResolveExtension,
  runManifestFn = defaultRunManifest,
  ensureDirFn = fs.ensureDir,
  copyFn = fs.copy,
  existsFn = fs.pathExists,
} = {}) => {
  // Pre-flight: refuse to overwrite an existing directory.
  const folderExists = await existsFn(folder);
  if (folderExists) {
    throw createError({
      ...ScaffoldValidationError,
      message: `Directory already exists: ${folder}. Remove it first or choose a different name.`,
    });
  }

  const paths = await resolveExtensionFn({ packageRoot, type });

  await ensureDirFn(folder);

  // Copy all scaffold source files into the project folder so manifest steps
  // can reference them as local files, regardless of scaffold type.
  await copyFn(path.dirname(paths.manifestPath), folder);

  // Always run the manifest from the project folder — no branching on source type.
  await runManifestFn({
    agent,
    folder,
    // @ts-expect-error -- folder is always provided by callers via resolveCreateArgs
    manifestPath: path.join(folder, "SCAFFOLD-MANIFEST.yml"),
  });

  return {
    ...(paths.downloaded ? { cleanupTip: "npx aidd scaffold-cleanup" } : {}),
    folderPath: folder,
    success: true,
  };
};

export { resolveCreateArgs, runCreate };
