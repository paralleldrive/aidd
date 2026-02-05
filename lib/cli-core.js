import path from "path";
import process from "process";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { createError, errorCauses } from "error-causes";
import fs from "fs-extra";

import { ensureAgentsMd } from "./agents-md.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Error causes definition using error-causes library
const [cliErrors, handleCliErrors] = errorCauses({
  CloneError: {
    code: "CLONE_ERROR",
    message: "AI folder cloning failed",
  },
  FileSystemError: {
    code: "FILESYSTEM_ERROR",
    message: "File system operation failed",
  },
  ValidationError: {
    code: "VALIDATION_ERROR",
    message: "Input validation failed",
  },
});

const { ValidationError, FileSystemError, CloneError } = cliErrors;

// Pure path resolution functions
const resolvePaths = ({
  targetDirectory = ".",
  packageRoot = __dirname,
} = {}) => ({
  source: path.resolve(packageRoot, "../ai"),
  get target() {
    return path.join(this.targetBase, "ai");
  },
  targetBase: path.resolve(process.cwd(), targetDirectory),
});

const validateSource = async ({ source }) => {
  const exists = await fs.pathExists(source);
  if (!exists) {
    throw createError({
      ...ValidationError,
      message: `Source ai/ folder not found at: ${source}`,
    });
  }
  return { valid: true };
};

const validateTarget =
  ({ target, force = false }) =>
  async () => {
    const exists = await fs.pathExists(target);
    if (exists && !force) {
      throw createError({
        ...ValidationError,
        message: "ai/ folder already exists (use --force to overwrite)",
      });
    }
    return { exists, valid: true };
  };

// File system operations
const ensureTargetDir =
  ({ targetBase }) =>
  async () => {
    try {
      await fs.ensureDir(targetBase);
    } catch (originalError) {
      throw createError({
        ...FileSystemError,
        cause: originalError,
        message: `Failed to create target directory: ${targetBase}`,
      });
    }
  };

const listDirectoryTree =
  (dirPath) =>
  async (prefix = "") => {
    try {
      const items = await fs.readdir(dirPath);
      const results = [];

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);

        if (stats.isDirectory()) {
          results.push(`${prefix}📁 ${item}/`);
          const subResults = await listDirectoryTree(itemPath)(`${prefix}  `);
          results.push(...subResults);
        } else {
          results.push(`${prefix}📄 ${item}`);
        }
      }

      return results;
    } catch (originalError) {
      throw createError({
        ...FileSystemError,
        cause: originalError,
        message: `Failed to read directory: ${dirPath}`,
      });
    }
  };

const copyDirectory =
  ({ source, target }) =>
  async () => {
    try {
      await fs.copy(source, target);
    } catch (originalError) {
      throw createError({
        ...CloneError,
        cause: originalError,
        message: `Failed to copy ai/ folder from ${source} to ${target}`,
      });
    }
  };

const createCursorSymlink =
  ({ targetBase, force = false }) =>
  async () => {
    const cursorPath = path.join(targetBase, ".cursor");
    const aiRelativePath = "ai";

    try {
      // Check if .cursor already exists
      const cursorExists = await fs.pathExists(cursorPath);

      if (cursorExists) {
        if (!force) {
          throw createError({
            ...ValidationError,
            message: ".cursor already exists (use --force to overwrite)",
          });
        }
        // Remove existing .cursor (file or symlink)
        await fs.remove(cursorPath);
      }

      // Create symlink
      await fs.symlink(aiRelativePath, cursorPath);
    } catch (originalError) {
      // If it's already our validation error, re-throw
      if (originalError.cause?.code === "VALIDATION_ERROR") {
        throw originalError;
      }

      throw createError({
        ...FileSystemError,
        cause: originalError,
        message: `Failed to create .cursor symlink: ${originalError.message}`,
      });
    }
  };

// Output functions
const createLogger = ({ verbose = false, dryRun = false } = {}) => ({
  cyan: (msg) => console.log(chalk.cyan(msg)),
  dryRun: (msg) => dryRun && console.log(chalk.yellow(msg)),
  error: (msg) => console.error(chalk.red(msg)),
  gray: (msg) => console.log(chalk.gray(msg)),
  info: (msg) => console.log(chalk.blue(msg)),
  success: (msg) => console.log(chalk.green(msg)),
  verbose: (msg) => verbose && console.log(chalk.gray(msg)),
  warning: (msg) => console.log(chalk.yellow(msg)),
});

const formatHeader =
  ({ source, target, verbose }) =>
  (logger) => {
    if (verbose) {
      logger.info("AIDD CLI - AI Driven Development");
      logger.verbose(`Source: ${source}`);
      logger.verbose(`Target: ${target}`);
      console.log();
    }
  };

const formatSuccess = () => (logger) => {
  logger.success("✅ Successfully cloned AI agent orchestration system!");
  console.log();
  logger.info("Next steps:");
  logger.gray("1. Create a vision.md document in your project root");
  logger.gray("2. Navigate to your project directory");
  logger.gray("3. Explore the ai/ folder for available commands and rules");
  logger.gray("4. Start using AI Driven Development workflows");
  console.log();
  logger.warning(
    "💡 Tip: Create vision.md first, then try /help to see what you can do",
  );
};

const formatDryRunHeader = () => (logger) => {
  logger.cyan("Dry run mode - showing what would be copied:");
  console.log();
};

// Main orchestration
const executeClone = async ({
  targetDirectory = ".",
  force = false,
  dryRun = false,
  verbose = false,
  cursor = false,
} = {}) => {
  try {
    const logger = createLogger({ dryRun, verbose });
    const paths = resolvePaths({ targetDirectory });

    // Validation pipeline - now throws structured errors
    await validateSource(paths);
    await validateTarget({ force, target: paths.target })();

    // Output header
    formatHeader({ ...paths, verbose })(logger);

    // Ensure target directory exists
    await ensureTargetDir(paths)();

    if (dryRun) {
      // Dry run: show what would be copied
      formatDryRunHeader()(logger);
      const fileList = await listDirectoryTree(paths.source)();
      for (const file of fileList) {
        file.includes("📁") ? logger.info(file) : logger.gray(file);
      }
      return { dryRun: true, success: true };
    }

    // Actual copy operation
    verbose && logger.info("Copying ai/ folder...");
    await copyDirectory(paths)();

    // Ensure AGENTS.md exists with required directives
    verbose && logger.info("Setting up AGENTS.md...");
    const agentsResult = await ensureAgentsMd(paths.targetBase);
    verbose && logger.verbose(`AGENTS.md: ${agentsResult.message}`);

    // Create cursor symlink if requested
    if (cursor) {
      verbose && logger.info("Creating .cursor symlink...");
      await createCursorSymlink({ force, targetBase: paths.targetBase })();
    }

    // Success output
    formatSuccess()(logger);

    return { paths, success: true };
  } catch (error) {
    // Structured error handling using error causes
    if (error.cause) {
      return {
        error: {
          cause: error.cause,
          code: error.cause?.code,
          message: error.message,
        },
        success: false,
      };
    }

    // Handle unexpected errors
    return {
      error: {
        cause: error.cause,
        message: error.message,
        type: "unexpected",
      },
      success: false,
    };
  }
};

export {
  createLogger,
  executeClone,
  handleCliErrors,
  resolvePaths,
  validateSource,
  validateTarget,
};
