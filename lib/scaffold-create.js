import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";

import { resolveAgentConfig as defaultResolveAgentConfig } from "./agent-cli/config.js";
import { runAgent as defaultRunAgent } from "./agent-cli/runner.js";
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
 * @param {{ type?: string, folder?: string, agentConfig?: string | { command: string, args?: string[] }, prompt?: string, packageRoot?: string, resolveExtensionFn?: Function, runManifestFn?: Function, ensureDirFn?: Function, resolveAgentConfigFn?: Function, runAgentFn?: Function }} [options]
 */
const runCreate = async ({
  type,
  folder,
  agentConfig = "claude",
  prompt,
  packageRoot = __dirname,
  resolveExtensionFn = defaultResolveExtension,
  runManifestFn = defaultRunManifest,
  ensureDirFn = fs.ensureDir,
  resolveAgentConfigFn = defaultResolveAgentConfig,
  runAgentFn = defaultRunAgent,
} = {}) => {
  const paths = await resolveExtensionFn({
    packageRoot,
    type,
  });

  await ensureDirFn(folder);

  await runManifestFn({
    agentConfig,
    folder,
    manifestPath: paths.manifestPath,
  });

  if (prompt !== undefined) {
    const agentCfg = await resolveAgentConfigFn({
      cwd: folder,
      value: agentConfig,
    });
    await runAgentFn({ agentConfig: agentCfg, cwd: folder, prompt });
  }

  return {
    ...(paths.downloaded ? { cleanupTip: "npx aidd scaffold-cleanup" } : {}),
    folderPath: folder,
    success: true,
  };
};

export { resolveCreateArgs, runCreate };
