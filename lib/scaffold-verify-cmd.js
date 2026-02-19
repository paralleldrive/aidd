import path from "path";
import { fileURLToPath } from "url";

import { resolveExtension as defaultResolveExtension } from "./scaffold-resolver.js";
import { verifyScaffold as defaultVerifyScaffold } from "./scaffold-verifier.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolve and verify a scaffold manifest.
 * All IO dependencies are injectable for unit testing.
 *
 * Returns { valid: boolean, errors: string[] }.
 * Throws on resolution errors (cancelled, network, etc.) — caller handles display.
 */
const runVerifyScaffold = async ({
  type,
  packageRoot = __dirname,
  resolveExtensionFn = defaultResolveExtension,
  verifyScaffoldFn = defaultVerifyScaffold,
} = {}) => {
  const paths = await resolveExtensionFn({
    folder: process.cwd(),
    // Suppress README output — only validation feedback is relevant here.
    log: () => {},
    packageRoot,
    type,
  });

  return verifyScaffoldFn({ manifestPath: paths.manifestPath });
};

export { runVerifyScaffold };
