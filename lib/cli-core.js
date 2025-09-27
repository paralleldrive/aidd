import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { errorCauses, createError } from "error-causes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Error causes definition using error-causes library
const [cliErrors] = errorCauses({
  ValidationError: {
    code: "VALIDATION_ERROR",
    message: "Input validation failed",
  },
  FileSystemError: {
    code: "FILESYSTEM_ERROR",
    message: "File system operation failed",
  },
  CloneError: {
    code: "CLONE_ERROR",
    message: "AI folder cloning failed",
  },
});

const { ValidationError, FileSystemError, CloneError } = cliErrors;

// Pure path resolution functions
const resolvePaths = ({
  targetDirectory = ".",
  packageRoot = __dirname,
} = {}) => ({
  source: path.resolve(packageRoot, "../ai"),
  targetBase: path.resolve(process.cwd(), targetDirectory),
  get target() {
    return path.join(this.targetBase, "ai");
  },
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
        message: `Failed to create target directory: ${targetBase}`,
        cause: originalError,
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
          const subResults = await listDirectoryTree(itemPath)(prefix + "  ");
          results.push(...subResults);
        } else {
          results.push(`${prefix}📄 ${item}`);
        }
      }

      return results;
    } catch (originalError) {
      throw createError({
        ...FileSystemError,
        message: `Failed to read directory: ${dirPath}`,
        cause: originalError,
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
        message: `Failed to copy ai/ folder from ${source} to ${target}`,
        cause: originalError,
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
        message: `Failed to create .cursor symlink: ${originalError.message}`,
        cause: originalError,
      });
    }
  };

// Output functions
const createLogger = ({ verbose = false, dryRun = false } = {}) => ({
  info: (msg) => console.log(chalk.blue(msg)),
  success: (msg) => console.log(chalk.green(msg)),
  warning: (msg) => console.log(chalk.yellow(msg)),
  error: (msg) => console.error(chalk.red(msg)),
  gray: (msg) => console.log(chalk.gray(msg)),
  cyan: (msg) => console.log(chalk.cyan(msg)),
  verbose: (msg) => verbose && console.log(chalk.gray(msg)),
  dryRun: (msg) => dryRun && console.log(chalk.yellow(msg)),
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
  logger.gray("1. Navigate to your project directory");
  logger.gray("2. Explore the ai/ folder for available commands and rules");
  logger.gray("3. Start using AI Driven Development workflows");
  console.log();
  logger.warning("💡 Tip: Try /help to see what you can do");
  console.log();
  logger.cyan("📚 About the Author");
  logger.gray(
    "The SudoLang AIDD library was created by Eric Elliott, author of the book,",
  );
  logger.gray(
    '"The Art of Effortless Programming: Unleashing the Power of AI Driven Development"',
  );
  logger.gray(
    "(https://leanpub.com/effortless-programming). Eric offers 1:1 mentorship,",
  );
  logger.gray(
    "consulting, and strategic advisor services for people looking to learn",
  );
  logger.gray("AI Driven Development. If you're interested, reach out:");
  logger.gray("https://ericelliottjs.com/support");
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
    const logger = createLogger({ verbose, dryRun });
    const paths = resolvePaths({ targetDirectory });

    // Validation pipeline - now throws structured errors
    await validateSource(paths);
    await validateTarget({ target: paths.target, force })();

    // Output header
    formatHeader({ ...paths, verbose })(logger);

    // Ensure target directory exists
    await ensureTargetDir(paths)();

    if (dryRun) {
      // Dry run: show what would be copied
      formatDryRunHeader()(logger);
      const fileList = await listDirectoryTree(paths.source)();
      fileList.forEach((file) =>
        file.includes("📁") ? logger.info(file) : logger.gray(file),
      );
      return { success: true, dryRun: true };
    }

    // Actual copy operation
    verbose && logger.info("Copying ai/ folder...");
    await copyDirectory(paths)();

    // Create cursor symlink if requested
    if (cursor) {
      verbose && logger.info("Creating .cursor symlink...");
      await createCursorSymlink({ targetBase: paths.targetBase, force })();
    }

    // Success output
    formatSuccess()(logger);

    return { success: true, paths };
  } catch (error) {
    // Structured error handling
    return {
      success: false,
      error: {
        message: error.message,
        code: error.cause?.code,
        cause: error.cause,
      },
    };
  }
};

export {
  executeClone,
  resolvePaths,
  validateSource,
  validateTarget,
  createLogger,
};
