import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";

import { resolveExtension as defaultResolveExtension } from "./scaffold-resolver.js";
import { runManifest as defaultRunManifest } from "./scaffold-runner.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolve the Commander two-optional-arg pattern into { type, resolvedFolder, folderPath }.
 * Returns null when no folder was supplied at all.
 *
 *   create scaffold-example my-project  →  type="scaffold-example", folder="my-project"
 *   create my-project                   →  type=undefined,           folder="my-project"
 *   create                              →  null (caller should error)
 */
const resolveCreateArgs = (typeOrFolder, folder) => {
  if (!typeOrFolder) return null;

  // If no folder was given and the sole argument looks like a URI, the user
  // most likely forgot the folder argument. Return null so the caller emits
  // "missing required argument 'folder'" rather than creating a directory
  // with a mangled URL path. http:// is intentionally excluded — it is not
  // a supported protocol.
  if (folder === undefined && /^(https|file):\/\//i.test(typeOrFolder)) {
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
 */
const runCreate = async ({
  type,
  folder,
  agent = "claude",
  packageRoot = __dirname,
  resolveExtensionFn = defaultResolveExtension,
  runManifestFn = defaultRunManifest,
  ensureDirFn = fs.ensureDir,
} = {}) => {
  await ensureDirFn(folder);

  const paths = await resolveExtensionFn({
    folder,
    packageRoot,
    type,
  });

  await runManifestFn({
    agent,
    extensionJsPath: paths.extensionJsPath,
    folder,
    manifestPath: paths.manifestPath,
  });

  return {
    ...(paths.downloaded
      ? { cleanupTip: `npx aidd scaffold-cleanup ${folder}` }
      : {}),
    folderPath: folder,
    success: true,
  };
};

export { resolveCreateArgs, runCreate };
