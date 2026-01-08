/**
 * File handling module for generated vibes.
 * Handles file validation, bundle size checks, and file collection
 * for the Vibecodr publish pipeline.
 *
 * @module vibe-files
 */

import { errorCauses, createError } from "error-causes";
import { isPathSafe } from "./vibe-utils.js";

// -----------------------------------------------------------------------------
// Error Definitions
// -----------------------------------------------------------------------------

/**
 * Error causes for vibe file operations.
 * Uses error-causes library for structured error handling.
 */
const [vibeFileErrors] = errorCauses({
  ForbiddenFileName: {
    code: "FORBIDDEN_FILE_NAME",
    message: "File name is not allowed",
  },
  BundleTooLarge: {
    code: "BUNDLE_TOO_LARGE",
    message: "Total bundle size exceeds limit",
  },
  TooManyFiles: {
    code: "TOO_MANY_FILES",
    message: "File count exceeds limit",
  },
});

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/**
 * Forbidden file patterns from Vibecodr constraints.
 * Files matching these patterns cannot be uploaded to a vibe.
 *
 * Rationale:
 * - entry.tsx: Reserved by Vibecodr runtime
 * - _vibecodr__*: Internal Vibecodr namespace
 * - __VCSHIM*: Internal shim files
 * - node_modules/: Should never be uploaded
 * - package.json/package-lock.json: Managed by Vibecodr
 * - .env*: Security - prevent credential leaks
 */
const forbiddenPatterns = [
  /^entry\.tsx$/,
  /^_vibecodr__/,
  /^__VCSHIM/,
  /^node_modules\//,
  /^package\.json$/,
  /^package-lock\.json$/,
  /^\.env/,
];

/**
 * Default bundle constraints.
 * These can be overridden when calling validateBundle.
 */
const defaultMaxSize = 5 * 1024 * 1024; // 5MB
const defaultMaxFiles = 100;

// -----------------------------------------------------------------------------
// File Name Validation
// -----------------------------------------------------------------------------

/**
 * Validate a file name against forbidden patterns.
 *
 * @param {string} fileName - The file name or path to validate
 * @returns {{ valid: true } | { valid: false, reason: string }} Validation result
 *
 * @example
 * validateFileName("App.tsx") // { valid: true }
 * validateFileName("entry.tsx") // { valid: false, reason: "..." }
 */
export const validateFileName = (fileName) => {
  if (typeof fileName !== "string" || fileName.length === 0) {
    return { valid: false, reason: "File name must be a non-empty string" };
  }

  // Check each forbidden pattern
  const matchedPattern = forbiddenPatterns.find((pattern) =>
    pattern.test(fileName),
  );
  if (matchedPattern) {
    return {
      valid: false,
      reason: `File "${fileName}" matches forbidden pattern: ${matchedPattern.toString()}`,
    };
  }

  return { valid: true };
};

// -----------------------------------------------------------------------------
// Bundle Validation
// -----------------------------------------------------------------------------

/**
 * Validate an entire bundle of files against size and count limits.
 * Throws structured errors for validation failures.
 *
 * @param {Array<{ path: string, content: string | Buffer, size?: number }>} files - Array of file entries
 * @param {Object} [options] - Validation options
 * @param {number} [options.maxSize=5242880] - Maximum total bundle size in bytes (default 5MB)
 * @param {number} [options.maxFiles=100] - Maximum number of files (default 100)
 * @returns {{ valid: true, totalSize: number, fileCount: number }} Validation result with metrics
 * @throws {Error} FORBIDDEN_FILE_NAME if any file path matches a forbidden pattern or files is not an array
 * @throws {Error} BUNDLE_TOO_LARGE if total bundle size exceeds maxSize limit
 * @throws {Error} TOO_MANY_FILES if file count exceeds maxFiles limit
 *
 * @example
 * const files = [{ path: "App.tsx", content: "...", size: 1000 }];
 * validateBundle(files); // { valid: true, totalSize: 1000, fileCount: 1 }
 */
export const validateBundle = (
  files,
  { maxSize = defaultMaxSize, maxFiles = defaultMaxFiles } = {},
) => {
  // Validate input
  if (!Array.isArray(files)) {
    throw createError({
      ...vibeFileErrors.ForbiddenFileName,
      message: "Files must be an array",
    });
  }

  // Check file count limit
  if (files.length > maxFiles) {
    throw createError({
      ...vibeFileErrors.TooManyFiles,
      message: `Bundle contains ${files.length} files, exceeds limit of ${maxFiles}`,
    });
  }

  const invalidFile = files
    .map((file) => ({
      file,
      validation: validateFileName(file.path),
    }))
    .find(({ validation }) => !validation.valid);

  if (invalidFile) {
    throw createError({
      ...vibeFileErrors.ForbiddenFileName,
      message: invalidFile.validation.reason,
    });
  }

  const totalSize = files.reduce(
    (sum, file) => sum + (file.size ?? getContentSize(file.content)),
    0,
  );

  // Check total size limit
  if (totalSize > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    const actualSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    throw createError({
      ...vibeFileErrors.BundleTooLarge,
      message: `Bundle size ${actualSizeMB}MB exceeds limit of ${maxSizeMB}MB`,
    });
  }

  return {
    valid: true,
    totalSize,
    fileCount: files.length,
  };
};

// -----------------------------------------------------------------------------
// File Entry Creation
// -----------------------------------------------------------------------------

/**
 * Get the byte size of content (string or Buffer).
 *
 * @param {string | Buffer} content - The file content
 * @returns {number} Size in bytes
 */
const getContentSize = (content) => {
  if (Buffer.isBuffer(content)) {
    return content.length;
  }
  // For strings, use Buffer to get accurate byte length (handles UTF-8)
  return Buffer.byteLength(content, "utf8");
};

/**
 * Threshold for non-printable character ratio to classify as binary.
 * Files with more than 10% non-printable characters are considered binary.
 */
const binaryThreshold = 0.1;

/**
 * Sample size for binary detection (in bytes).
 * Larger samples improve accuracy but cost more performance.
 */
const sampleSize = 4000;

/**
 * Check if a buffer sample contains binary content.
 * Binary is detected by presence of null bytes or high concentration
 * of non-printable characters (excluding common whitespace).
 *
 * @param {Buffer} sample - Buffer sample to analyze
 * @returns {boolean} True if sample appears to be binary
 */
const isSampleBinary = (sample) => {
  if (!sample || sample.length === 0) {
    return false;
  }

  // Null byte is a strong binary indicator
  if (sample.includes(0)) {
    return true;
  }

  // Count non-printable chars (excluding tab, newline, carriage return)
  const nonPrintable = sample.reduce(
    (count, byte) =>
      count + (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13 ? 1 : 0),
    0,
  );

  // High ratio of non-printable chars indicates binary
  return nonPrintable / sample.length > binaryThreshold;
};

/**
 * Determine if content is binary based on type or content analysis.
 * Samples from beginning, middle, and end to catch files with
 * text headers but binary body (e.g., some archive formats).
 *
 * @param {string | Buffer} content - The file content
 * @returns {"text" | "binary"} Content type
 */
const getContentType = (content) => {
  // Strings are always text
  if (typeof content === "string") {
    return "text";
  }

  if (!Buffer.isBuffer(content)) {
    return "text";
  }

  const len = content.length;
  if (len === 0) {
    return "text";
  }

  // Sample from beginning
  const startSample = content.slice(0, Math.min(sampleSize, len));
  if (isSampleBinary(startSample)) {
    return "binary";
  }

  // For small files, beginning sample is sufficient
  if (len <= sampleSize) {
    return "text";
  }

  // Sample from middle
  const midStart = Math.floor(len / 2) - Math.floor(sampleSize / 2);
  const midEnd = midStart + sampleSize;
  const midSample = content.slice(Math.max(0, midStart), Math.min(len, midEnd));
  if (isSampleBinary(midSample)) {
    return "binary";
  }

  // Sample from end
  const endSample = content.slice(Math.max(0, len - sampleSize));
  if (isSampleBinary(endSample)) {
    return "binary";
  }

  return "text";
};

/**
 * Create a standardized file entry with metadata.
 *
 * @param {Object} params - File parameters
 * @param {string} params.path - Relative file path
 * @param {string | Buffer} params.content - File content
 * @returns {{ path: string, content: string | Buffer, size: number, type: "text" | "binary" }} File entry with metadata
 *
 * @example
 * createFileEntry({ path: "App.tsx", content: "export const App = () => <div>Hello</div>" })
 * // { path: "App.tsx", content: "...", size: 41, type: "text" }
 */
export const createFileEntry = ({ path, content }) => {
  const size = getContentSize(content);
  const type = getContentType(content);

  return {
    path,
    content,
    size,
    type,
  };
};

// -----------------------------------------------------------------------------
// File Collection from AI Output
// -----------------------------------------------------------------------------

/**
 * Common language specifiers used in markdown code blocks.
 * These should be skipped when parsing for file names.
 */
const languageSpecifiers = new Set([
  // Common languages
  "javascript",
  "typescript",
  "python",
  "ruby",
  "go",
  "rust",
  "java",
  "csharp",
  "cpp",
  "c",
  "php",
  "swift",
  "kotlin",
  "scala",
  "shell",
  "bash",
  "sh",
  "zsh",
  "powershell",
  "sql",
  "graphql",
  // Short forms
  "js",
  "ts",
  "tsx",
  "jsx",
  "py",
  "rb",
  "rs",
  "cs",
  // Web/markup
  "html",
  "css",
  "scss",
  "sass",
  "less",
  "xml",
  "yaml",
  "yml",
  "json",
  "toml",
  "ini",
  "markdown",
  "md",
  // Other
  "text",
  "plaintext",
  "plain",
  "diff",
  "dockerfile",
  "makefile",
]);

/**
 * Parse AI-generated output that may contain file markers.
 * Supports format: ```filename.ext\n...content...\n```
 *
 * SECURITY: Validates paths to prevent path traversal attacks from
 * AI-generated output. Malicious paths are silently skipped.
 *
 * @param {string} output - Raw AI output text
 * @returns {Array<{ path: string, content: string }>} Parsed files (with safe paths only)
 */
const parseMarkedFiles = (output) => {
  // Pattern matches code blocks with optional filename
  // Format: ```filename.ext\ncontent\n``` or ```lang:filename.ext\ncontent\n```
  const codeBlockRegex = /```(?:(\w+):)?([^\n`]+)?\n([\s\S]*?)```/g;

  return [...output.matchAll(codeBlockRegex)]
    .map((match) => ({
      filename: match[2],
      content: match[3],
    }))
    .filter(
      ({ filename }) =>
        typeof filename === "string" && filename.trim().length > 0,
    )
    .map(({ filename, content }) => ({
      cleanFilename: filename.trim(),
      content,
    }))
    .filter(({ cleanFilename }) => {
      const lowerFilename = cleanFilename.toLowerCase();
      const isLanguageSpecifier =
        !cleanFilename.includes(".") &&
        !cleanFilename.includes("/") &&
        !cleanFilename.includes("\\") &&
        languageSpecifiers.has(lowerFilename);
      return !isLanguageSpecifier;
    })
    .filter(({ cleanFilename }) => isPathSafe(cleanFilename).safe)
    .map(({ cleanFilename, content }) => ({
      path: cleanFilename,
      content: String(content ?? "").trimEnd(),
    }));
};

/**
 * Convert AI generation output to standardized file entries.
 * Handles both single file and multiple file output formats.
 *
 * @param {string | Object | Array} generatedOutput - AI generation output
 *   - string: Raw text, possibly with code block markers
 *   - Object: { files: Array } or single file { path, content }
 *   - Array: Array of file objects
 * @returns {Array<{ path: string, content: string | Buffer, size: number, type: "text" | "binary" }>} File entries
 *
 * @example
 * // From structured output
 * collectGeneratedFiles({ files: [{ path: "App.tsx", content: "..." }] })
 *
 * // From raw AI text with markers
 * collectGeneratedFiles("```App.tsx\nexport const App = () => ...\n```")
 */
export const collectGeneratedFiles = (generatedOutput) => {
  // Handle null/undefined
  if (generatedOutput == null) {
    return [];
  }

  // Handle array directly
  if (Array.isArray(generatedOutput)) {
    return generatedOutput.map((file) => createFileEntry(file));
  }

  // Handle object with files property
  if (typeof generatedOutput === "object" && generatedOutput !== null) {
    // Check for files array property
    if (Array.isArray(generatedOutput.files)) {
      return generatedOutput.files.map((file) => createFileEntry(file));
    }

    // Check for single file object with path and content
    if (
      typeof generatedOutput.path === "string" &&
      generatedOutput.content !== undefined
    ) {
      return [createFileEntry(generatedOutput)];
    }

    // Empty or unrecognized object
    return [];
  }

  // Handle string output - try to parse marked files
  if (typeof generatedOutput === "string") {
    const parsedFiles = parseMarkedFiles(generatedOutput);

    if (parsedFiles.length > 0) {
      return parsedFiles.map((file) => createFileEntry(file));
    }

    // Single file without markers - return empty (caller should specify path)
    return [];
  }

  return [];
};

// -----------------------------------------------------------------------------
// Bundle Size Calculation
// -----------------------------------------------------------------------------

/**
 * Get file extension from path.
 *
 * @param {string} filePath - File path
 * @returns {string} Extension including dot, or empty string
 */
const getExtension = (filePath) => {
  const lastDot = filePath.lastIndexOf(".");
  const lastSlash = Math.max(
    filePath.lastIndexOf("/"),
    filePath.lastIndexOf("\\"),
  );

  if (lastDot > lastSlash && lastDot > 0) {
    return filePath.slice(lastDot).toLowerCase();
  }
  return "";
};

/**
 * Calculate total bundle size with breakdown by file extension.
 *
 * @param {Array<{ path: string, content?: string | Buffer, size?: number }>} files - Array of file entries
 * @returns {{ totalSize: number, fileCount: number, breakdown: Record<string, number> }} Size metrics
 *
 * @example
 * calculateBundleSize([
 *   { path: "App.tsx", size: 1000 },
 *   { path: "styles.css", size: 500 }
 * ])
 * // { totalSize: 1500, fileCount: 2, breakdown: { ".tsx": 1000, ".css": 500 } }
 */
export const calculateBundleSize = (files) => {
  if (!Array.isArray(files)) {
    return { totalSize: 0, fileCount: 0, breakdown: {} };
  }

  const metrics = files.reduce(
    (acc, file) => {
      const size = file.size ?? getContentSize(file.content ?? "");
      const ext = getExtension(file.path);
      const key = typeof ext === "string" && ext.length > 0 ? ext : "(no ext)";
      return {
        totalSize: acc.totalSize + size,
        breakdown: {
          ...acc.breakdown,
          [key]: (acc.breakdown[key] ?? 0) + size,
        },
      };
    },
    { totalSize: 0, breakdown: {} },
  );

  return {
    totalSize: metrics.totalSize,
    fileCount: files.length,
    breakdown: metrics.breakdown,
  };
};

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

// Export error definitions for external use
export { vibeFileErrors };

// Export constants for testing/configuration
export const defaults = {
  maxSize: defaultMaxSize,
  maxFiles: defaultMaxFiles,
  forbiddenPatterns: forbiddenPatterns,
};
