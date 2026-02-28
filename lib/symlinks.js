import path from "path";
import { createError } from "error-causes";
import fs from "fs-extra";

// Reuse the same code strings as cli-core.js so handleCliErrors dispatches correctly.
const ValidationError = {
  code: "VALIDATION_ERROR",
  message: "Input validation failed",
};
const FileSystemError = {
  code: "FILESYSTEM_ERROR",
  message: "File system operation failed",
};

/**
 * Create a symlink at `<targetBase>/<name>` pointing to the relative path `ai`.
 * The same function handles `.cursor`, `.claude`, or any future editor symlink.
 *
 * Returns an async thunk so call-sites can compose it with other thunks:
 *   await createSymlink({ name: '.claude', targetBase, force })()
 */
const createSymlink =
  ({ name, targetBase, force = false }) =>
  async () => {
    const symlinkPath = path.join(targetBase, name);
    const aiRelativePath = "ai";

    try {
      const exists = await fs.pathExists(symlinkPath);

      if (exists) {
        if (!force) {
          throw createError({
            ...ValidationError,
            message: `${name} already exists (use --force to overwrite)`,
          });
        }
        await fs.remove(symlinkPath);
      }

      await fs.symlink(aiRelativePath, symlinkPath);
    } catch (originalError) {
      // Validation errors are already structured — re-throw as-is.
      if (originalError.cause?.code === "VALIDATION_ERROR") {
        throw originalError;
      }

      throw createError({
        ...FileSystemError,
        cause: originalError,
        message: `Failed to create ${name} symlink: ${originalError.message}`,
      });
    }
  };

export { createSymlink };
