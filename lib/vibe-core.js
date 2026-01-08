/**
 * vibe-core.js
 *
 * Main orchestration module for vibe generation and publishing.
 * Coordinates authentication, code generation, file validation, and publish flow.
 *
 * This is the primary entry point for the --vibe CLI command.
 */
import { errorCauses } from "error-causes";
import { ensureVibecodrAuth, refreshVibecodrToken } from "./vibe-auth.js";
import {
  publishVibe,
  withAuthRetry as createAuthRetry,
} from "./vibe-publish.js";
import { generateVibeCode } from "./vibe-generate.js";
import { validateBundle } from "./vibe-files.js";
import {
  createVerboseLogger,
  validateApiBase,
  validatePlayerBase,
} from "./vibe-utils.js";

// =============================================================================
// Error Definitions
// =============================================================================

const [vibeCoreErrors] = errorCauses({
  ValidationError: {
    code: "VALIDATION_ERROR",
    message: "Input validation failed",
  },
  AuthRequired: {
    code: "AUTH_REQUIRED",
    message: "Authentication required",
  },
  AuthExpired: {
    code: "AUTH_EXPIRED",
    message: "Token expired and refresh failed",
  },
  PublishFailed: {
    code: "PUBLISH_FAILED",
    message: "Publish operation failed",
  },
  GenerationFailed: {
    code: "GENERATION_FAILED",
    message: "Code generation failed",
  },
  SecurityError: {
    code: "SECURITY_ERROR",
    message: "Security validation failed",
  },
});

// =============================================================================
// Helper Functions
// =============================================================================

// Create module-specific logger
const verboseLog = createVerboseLogger("vibe-core");

/**
 * Validate vibe execution parameters
 * @param {object} params - Parameters to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
const validateParams = ({ title, prompt, files }) => {
  const errors = [];

  if (!title || typeof title !== "string" || !title.trim()) {
    errors.push("title is required and must be a non-empty string");
  }

  // Either prompt or files must be provided
  if (!prompt && (!files || !Array.isArray(files) || files.length === 0)) {
    errors.push("either prompt or files must be provided");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Generate files from prompt if needed, or use provided files.
 * Extracted from executeVibe to avoid IIFE pattern per javascript.mdc.
 *
 * @param {object} params - Generation parameters
 * @param {string} [params.prompt] - AI prompt for code generation
 * @param {Array} [params.files] - Pre-provided files
 * @param {string} [params.entry] - Entry file path
 * @param {boolean} [params.verbose] - Enable verbose logging
 * @param {Function} [params.generateFn] - AI generation function
 * @returns {Promise<{success: boolean, filesToPublish?: Array, generatedEntry?: string, error?: object}>}
 */
const generateFilesIfNeeded = async ({
  prompt,
  files,
  entry,
  verbose,
  generateFn,
}) => {
  // If no prompt or files already provided, use provided values
  if (!prompt || (files && files.length > 0)) {
    return {
      success: true,
      filesToPublish: files,
      generatedEntry: entry,
    };
  }

  // Generate code from prompt
  verboseLog("Generating code from prompt...", verbose);

  try {
    const generated = await generateVibeCode({
      prompt,
      verbose,
      generateFn,
    });

    verboseLog(
      `Generated ${generated.files.length} file(s), entry: ${generated.entry || entry}`,
      verbose,
    );

    // If no AI function provided and we got placeholder output, warn user
    if (generated.metadata?.placeholder) {
      verboseLog(
        "WARNING: Using placeholder template (AI generation not configured)",
        verbose,
      );
    }

    return {
      success: true,
      filesToPublish: generated.files,
      generatedEntry: entry || generated.entry,
    };
  } catch (genErr) {
    return {
      success: false,
      error: {
        code: "GENERATION_FAILED",
        message: genErr.message,
        hint: "Provide files directly or configure AI generation",
        cause: genErr.cause,
      },
    };
  }
};

/**
 * Authenticate for publish operation.
 * Extracted from executeVibe to avoid IIFE pattern per javascript.mdc.
 *
 * @param {object} params - Auth parameters
 * @param {string} params.apiBase - API base URL
 * @param {string} [params.configPath] - Config file path
 * @param {boolean} [params.verbose] - Enable verbose logging
 * @returns {Promise<{success: boolean, auth?: object, error?: object}>}
 */
const authenticateForPublish = async ({ apiBase, configPath, verbose }) => {
  try {
    const auth = await ensureVibecodrAuth({
      apiBase,
      configPath,
      verbose,
    });
    return { success: true, auth };
  } catch (authErr) {
    // Convert auth errors to structured response
    const errCode = authErr.cause?.code;
    if (errCode === "AUTH_REQUIRED" || errCode === "AUTH_EXPIRED") {
      return {
        success: false,
        error: {
          code: errCode,
          message: authErr.message,
          hint: "Run 'vibecodr-auth.js login' to authenticate",
        },
      };
    }
    throw authErr;
  }
};

/**
 * Validate security origins for API and player URLs.
 * Prevents token theft via malicious URL injection.
 *
 * @param {object} params - Validation parameters
 * @param {string} params.apiBase - API base URL to validate
 * @param {string} params.playerBase - Player base URL to validate
 * @returns {{valid: boolean, error?: object}} Validation result
 */
const validateSecurityOrigins = ({ apiBase, playerBase }) => {
  const apiCheck = validateApiBase(apiBase);
  if (!apiCheck.valid) {
    return {
      valid: false,
      error: {
        code: "SECURITY_ERROR",
        message: apiCheck.reason,
        hint: "Use a trusted Vibecodr API endpoint",
      },
    };
  }

  const playerCheck = validatePlayerBase(playerBase);
  if (!playerCheck.valid) {
    return {
      valid: false,
      error: {
        code: "SECURITY_ERROR",
        message: playerCheck.reason,
        hint: "Use a trusted Vibecodr player endpoint",
      },
    };
  }

  return { valid: true };
};

/**
 * Validate files array structure - each file must have path and content.
 *
 * @param {Array} files - Files array to validate
 * @returns {{valid: boolean, error?: object}} Validation result
 */
const validateFilesStructure = (files) => {
  if (!files || !Array.isArray(files) || files.length === 0) {
    return {
      valid: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "No files to publish",
      },
    };
  }

  // Check each file has required fields
  const invalidFile = files.find(
    (file) => !file.path || file.content === undefined,
  );

  if (invalidFile) {
    return {
      valid: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid file entry: each file must have 'path' and 'content'",
        invalidFile,
      },
    };
  }

  return { valid: true };
};

/**
 * Validate bundle files against size and pattern limits.
 *
 * @param {Array} files - Files to validate
 * @param {boolean} verbose - Enable verbose logging
 * @returns {{valid: boolean, fileCount?: number, totalSize?: number, error?: object}}
 */
const validateBundleFiles = (files, verbose) => {
  try {
    const bundleValidation = validateBundle(files);
    verboseLog(
      `Bundle valid: ${bundleValidation.fileCount} files, ${bundleValidation.totalSize} bytes`,
      verbose,
    );
    return {
      valid: true,
      fileCount: bundleValidation.fileCount,
      totalSize: bundleValidation.totalSize,
    };
  } catch (bundleErr) {
    return {
      valid: false,
      error: {
        code: bundleErr.cause?.code || "VALIDATION_ERROR",
        message: bundleErr.message,
        hint: "Check file names and bundle size",
      },
    };
  }
};

/**
 * Build dry run response showing what would be published.
 *
 * @param {object} params - Dry run parameters
 * @returns {object} Dry run result object
 */
const buildDryRunResult = ({
  title,
  entry,
  generatedEntry,
  runner,
  visibility,
  files,
}) => ({
  success: true,
  dryRun: true,
  wouldPublish: {
    title,
    entry: generatedEntry || entry,
    runner,
    visibility,
    fileCount: files.length,
    files: files.map((f) => f.path),
  },
});

/**
 * Execute the publish operation with auth retry.
 *
 * @param {object} params - Publish parameters
 * @returns {Promise<{success: boolean, url: string, postId: string, capsuleId: string}>}
 */
const executePublishWithRetry = async ({
  auth,
  apiBase,
  configPath,
  verbose,
  playerBase,
  files,
  title,
  entry,
  runner,
  visibility,
}) => {
  // Create token getter for auth retry
  const getToken = async () => {
    const refreshed = await refreshVibecodrToken({
      configPath,
      apiBase,
      verbose,
    });
    return refreshed.token;
  };

  // Create auth retry wrapper
  const withAuthRetry = createAuthRetry(getToken);

  // Execute publish with retry on auth failure
  const result = await withAuthRetry(async (overrideToken) => {
    const tokenToUse = overrideToken || auth.token;
    return publishVibe({
      apiBase,
      token: tokenToUse,
      files,
      title,
      entry,
      runner,
      visibility,
      verbose,
      playerBase,
    });
  });

  return {
    success: true,
    url: result.url,
    postId: result.postId,
    capsuleId: result.capsuleId,
  };
};

/**
 * Convert unexpected errors to structured response.
 *
 * @param {Error} err - Error to convert
 * @param {boolean} verbose - Enable verbose logging
 * @returns {object} Structured error response
 */
const handleUnexpectedError = (err, verbose) => {
  verboseLog(`Error: ${err.message}`, verbose);

  const errCode = err.cause?.code;
  if (errCode) {
    return {
      success: false,
      error: {
        code: errCode,
        message: err.message,
        cause: err.cause,
      },
    };
  }

  return {
    success: false,
    error: {
      code: "UNKNOWN_ERROR",
      message: err.message,
      cause: err,
    },
  };
};

// =============================================================================
// Main Exported Functions
// =============================================================================

/**
 * Execute the full vibe orchestration flow:
 * 1. Validate inputs
 * 2. Ensure authentication
 * 3. Generate code from prompt (if provided)
 * 4. Publish to Vibecodr
 *
 * @param {object} params - Vibe execution parameters
 * @param {string} params.title - Title for the vibe
 * @param {string} [params.prompt] - AI prompt for code generation
 * @param {Array<{path: string, content: string|Buffer}>} [params.files] - Pre-generated files to publish
 * @param {string} [params.entry] - Entry file path (e.g., 'App.tsx')
 * @param {string} [params.runner] - Runner type ('client-static' or 'webcontainer')
 * @param {string} [params.visibility='public'] - Visibility ('public', 'unlisted', 'private')
 * @param {boolean} [params.dryRun=false] - If true, validate without making API calls
 * @param {boolean} [params.verbose=false] - Enable verbose logging
 * @param {string} [params.apiBase='https://api.vibecodr.space'] - Vibecodr API base URL
 * @param {string} [params.playerBase='https://vibecodr.space'] - Vibecodr player base URL
 * @param {string} [params.configPath] - Path to auth config file
 * @returns {Promise<{success: boolean, url?: string, postId?: string, capsuleId?: string, error?: object}>}
 */
export const executeVibe = async ({
  title,
  prompt,
  files,
  entry,
  runner,
  visibility = "public",
  dryRun = false,
  verbose = false,
  apiBase = "https://api.vibecodr.space",
  playerBase = "https://vibecodr.space",
  configPath,
  generateFn = null,
} = {}) => {
  try {
    // Step 1: Security validation
    verboseLog("Validating URL origins...", verbose);
    const securityCheck = validateSecurityOrigins({ apiBase, playerBase });
    if (!securityCheck.valid) {
      return { success: false, error: securityCheck.error };
    }

    // Step 2: Validate inputs
    verboseLog("Validating inputs...", verbose);
    const validation = validateParams({ title, prompt, files });
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `Validation failed: ${validation.errors.join(", ")}`,
          errors: validation.errors,
        },
      };
    }

    // Step 3: Generate files if needed
    const generationResult = await generateFilesIfNeeded({
      prompt,
      files,
      entry,
      verbose,
      generateFn,
    });
    if (!generationResult.success) {
      return generationResult;
    }
    const { filesToPublish, generatedEntry } = generationResult;

    // Step 4: Validate files structure
    const filesCheck = validateFilesStructure(filesToPublish);
    if (!filesCheck.valid) {
      return { success: false, error: filesCheck.error };
    }

    // Step 5: Validate bundle
    verboseLog("Validating file bundle...", verbose);
    const bundleCheck = validateBundleFiles(filesToPublish, verbose);
    if (!bundleCheck.valid) {
      return { success: false, error: bundleCheck.error };
    }

    // Step 6: Handle dry run mode
    if (dryRun) {
      verboseLog("Dry run mode - simulating publish flow", verbose);
      return buildDryRunResult({
        title,
        entry,
        generatedEntry,
        runner,
        visibility,
        files: filesToPublish,
      });
    }

    // Step 7: Authenticate
    verboseLog("Checking authentication...", verbose);
    const authResult = await authenticateForPublish({
      apiBase,
      configPath,
      verbose,
    });
    if (!authResult.success) {
      return authResult;
    }

    // Log auth status (relative time for security)
    const minutesRemaining = Math.floor(
      (authResult.auth.expiresAt - Date.now() / 1000) / 60,
    );
    verboseLog(
      `Authenticated, token valid for ~${minutesRemaining} minutes`,
      verbose,
    );

    // Step 8: Execute publish
    verboseLog("Starting publish flow...", verbose);
    const result = await executePublishWithRetry({
      auth: authResult.auth,
      apiBase,
      configPath,
      verbose,
      playerBase,
      files: filesToPublish,
      title,
      entry: generatedEntry || entry,
      runner,
      visibility,
    });

    verboseLog(`Published successfully: ${result.url}`, verbose);
    return result;
  } catch (err) {
    return handleUnexpectedError(err, verbose);
  }
};

/**
 * Validate vibe parameters without executing
 * Useful for CLI validation before starting the flow
 *
 * @param {object} params - Parameters to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export const validateVibeParams = ({
  title,
  prompt,
  files,
  runner,
  visibility,
}) => {
  const errors = [];

  // Validate title
  if (!title || typeof title !== "string" || !title.trim()) {
    errors.push("--title is required");
  }

  // Validate prompt or files
  if (!prompt && (!files || !Array.isArray(files) || files.length === 0)) {
    errors.push(
      "--prompt is required (file-based publish coming in future release)",
    );
  }

  // Validate runner if provided
  if (runner && !["client-static", "webcontainer"].includes(runner)) {
    errors.push(
      `--runner must be 'client-static' or 'webcontainer', got '${runner}'`,
    );
  }

  // Validate visibility if provided
  if (visibility && !["public", "unlisted", "private"].includes(visibility)) {
    errors.push(
      `--visibility must be 'public', 'unlisted', or 'private', got '${visibility}'`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Export error types for external use
export { vibeCoreErrors };
