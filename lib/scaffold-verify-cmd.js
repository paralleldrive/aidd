import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";

import {
  resolveExtension as defaultResolveExtension,
  SCAFFOLD_DOWNLOAD_DIR,
} from "./scaffold-resolver.js";
import { verifyScaffold as defaultVerifyScaffold } from "./scaffold-verifier.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Resolve and verify a scaffold manifest.
 * All IO dependencies are injectable for unit testing.
 *
 * HTTP/HTTPS scaffolds are downloaded to ~/.aidd/scaffold/ and cleaned up
 * automatically (in a finally block) whether verification succeeds or fails.
 * Named and file:// scaffolds are never downloaded, so no cleanup is needed.
 *
 * Returns { valid: boolean, errors: string[] }.
 * Throws on resolution errors (cancelled, network, etc.) — caller handles display.
 *
 * @param {object} [options]
 * @param {string} [options.type]
 * @param {string} [options.packageRoot]
 * @param {Function} [options.resolveExtensionFn]
 * @param {Function} [options.verifyScaffoldFn]
 * @param {Function} [options.cleanupFn]
 */
const runVerifyScaffold = async ({
  type,
  packageRoot = __dirname,
  resolveExtensionFn = defaultResolveExtension,
  verifyScaffoldFn = defaultVerifyScaffold,
  cleanupFn = async () => fs.remove(SCAFFOLD_DOWNLOAD_DIR),
} = {}) => {
  let downloaded = false;
  try {
    const paths = await resolveExtensionFn({
      // Suppress README output — only validation feedback is relevant here.
      log: () => {},
      packageRoot,
      type,
    });
    downloaded = paths.downloaded ?? false;
    return await verifyScaffoldFn({ manifestPath: paths.manifestPath });
  } finally {
    if (downloaded) await cleanupFn();
  }
};

export { runVerifyScaffold };
