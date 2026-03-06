import path from "path";
import { createError } from "error-causes";
import fs from "fs-extra";

import { FileSystemError, ValidationError } from "./error-causes.js";

/**
 * Create a symlink at `<targetBase>/<name>` pointing to the relative path `ai`.
 * Handles `.cursor`, `.claude`, or any future editor symlink.
 *
 * Returns an async thunk so call-sites compose it with other thunks:
 *   await createSymlink({ name: '.claude', targetBase, force })()
 *
 * @param {{ name: string, targetBase: string, force?: boolean }} options
 */
const createSymlink =
  ({ name, targetBase, force = false }) =>
  async () => {
    const symlinkPath = path.join(targetBase, name);
    const exists = await fs.pathExists(symlinkPath);

    if (exists && !force) {
      throw createError({
        ...ValidationError,
        message: `${name} already exists (use --force to overwrite)`,
      });
    }

    try {
      if (exists) await fs.remove(symlinkPath);
      await fs.symlink("ai", symlinkPath);
    } catch (/** @type {any} */ originalError) {
      throw createError({
        ...FileSystemError,
        cause: originalError,
        message: `Failed to create ${name} symlink: ${originalError.message}`,
      });
    }
  };

export { createSymlink };
