import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";

import { AIDD_HOME } from "./aidd-config.js";
import { resolveExtension as defaultResolveExtension } from "./scaffold-resolver.js";
import { verifyScaffold as defaultVerifyScaffold } from "./scaffold-verifier.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERIFY_SCAFFOLD_DIR = path.join(AIDD_HOME, "scaffold");

/**
 * Resolve and verify a scaffold manifest.
 * All IO dependencies are injectable for unit testing.
 *
 * HTTP/HTTPS scaffolds are downloaded to ~/.aidd/scaffold/ and cleaned up
 * automatically (in a finally block) whether verification succeeds or fails.
 *
 * Returns { valid: boolean, errors: string[] }.
 * Throws on resolution errors (cancelled, network, etc.) — caller handles display.
 */
const runVerifyScaffold = async ({
  type,
  packageRoot = __dirname,
  resolveExtensionFn = defaultResolveExtension,
  verifyScaffoldFn = defaultVerifyScaffold,
  cleanupFn = async () => fs.remove(VERIFY_SCAFFOLD_DIR),
} = {}) => {
  // Use the user's home directory as the scaffold root so that downloaded
  // scaffolds land in ~/.aidd/scaffold/ (not in the current project directory,
  // which may not even exist yet at verification time).
  const folder = os.homedir();

  try {
    const paths = await resolveExtensionFn({
      folder,
      // Suppress README output — only validation feedback is relevant here.
      log: () => {},
      packageRoot,
      type,
    });

    return await verifyScaffoldFn({ manifestPath: paths.manifestPath });
  } finally {
    await cleanupFn();
  }
};

export { runVerifyScaffold, VERIFY_SCAFFOLD_DIR };
