/**
 * vibe-publish.js
 *
 * Publish pipeline module for Vibecodr capsules.
 * Handles capsule creation, file upload, and publishing.
 *
 * Reference: vibecodr-publish.js in project root for publish patterns
 */
import path from "node:path";
import { errorCauses, createError } from "error-causes";
import {
  normalizeOrigin,
  verboseLog,
  fetchJson,
  isAuthError,
  isPathSafe,
  validateApiBase,
  validatePlayerBase,
} from "./vibe-utils.js";

// =============================================================================
// Error Definitions
// =============================================================================

const [vibePublishErrors] = errorCauses({
  PublishFailed: {
    code: "PUBLISH_FAILED",
    message: "Publish operation failed",
  },
  CapsuleCreateError: {
    code: "CAPSULE_CREATE_ERROR",
    message: "Failed to create capsule",
  },
  FileUploadError: {
    code: "FILE_UPLOAD_ERROR",
    message: "Failed to upload file",
  },
  CapsulePublishError: {
    code: "CAPSULE_PUBLISH_ERROR",
    message: "Failed to publish capsule",
  },
  ValidationError: {
    code: "VALIDATION_ERROR",
    message: "Input validation failed",
  },
  SecurityBlockError: {
    code: "SECURITY_BLOCK",
    message: "Security block: unsafe code detected",
  },
  RateLimitError: {
    code: "RATE_LIMITED",
    message: "Rate limited by API",
  },
});

const {
  PublishFailed,
  CapsuleCreateError,
  FileUploadError,
  CapsulePublishError,
  ValidationError,
  SecurityBlockError,
  RateLimitError,
} = vibePublishErrors;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Module-specific verbose logger using shared verboseLog
 * @param {string} message - Message to log
 * @param {boolean} verbose - Whether to actually log
 */
const log = (message, verbose) => verboseLog("vibe-publish", message, verbose);

/**
 * MIME type mapping for common file extensions.
 * Used to set correct Content-Type header when uploading files.
 */
const mimeTypes = {
  ".html": "text/html",
  ".htm": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".jsx": "application/javascript",
  ".ts": "application/typescript",
  ".tsx": "application/typescript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".eot": "application/vnd.ms-fontobject",
  ".md": "text/markdown",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".yaml": "text/yaml",
  ".yml": "text/yaml",
  ".wasm": "application/wasm",
  ".map": "application/json",
};

/**
 * Get MIME type for a file path based on extension.
 * Falls back to application/octet-stream for unknown types.
 *
 * @param {string} filePath - File path to get MIME type for
 * @returns {string} MIME type string
 *
 * @example
 * getMimeType("src/App.tsx") // "application/typescript"
 * getMimeType("styles.css") // "text/css"
 * getMimeType("unknown.xyz") // "application/octet-stream"
 */
export const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || "application/octet-stream";
};

// =============================================================================
// Main Exported Functions
// =============================================================================

/**
 * Create an empty capsule on Vibecodr
 *
 * @param {object} params - Capsule creation parameters
 * @param {string} params.apiBase - Vibecodr API base URL
 * @param {string} params.token - Authentication token
 * @param {string} params.title - Capsule title
 * @param {string} [params.entry] - Entry file path (e.g., 'App.tsx')
 * @param {string} [params.runner] - Runner type ('client-static' or 'webcontainer')
 * @returns {Promise<{capsuleId: string}>} Created capsule ID
 * @throws {Error} VALIDATION_ERROR if required params (apiBase, token, title) are missing
 * @throws {Error} CAPSULE_CREATE_ERROR if API call fails or returns unexpected response
 */
export const createCapsule = async ({
  apiBase,
  token,
  title,
  entry,
  runner,
}) => {
  if (!apiBase || !token || !title) {
    throw createError({
      ...ValidationError,
      message: "createCapsule requires apiBase, token, and title",
      params: { hasApiBase: !!apiBase, hasToken: !!token, hasTitle: !!title },
    });
  }

  // SECURITY: Validate apiBase before sending token to prevent token theft
  const apiCheck = validateApiBase(apiBase);
  if (!apiCheck.valid) {
    throw createError({
      ...SecurityBlockError,
      message: `Refusing to send token to untrusted API: ${apiCheck.reason}`,
      apiBase,
    });
  }

  const url = `${normalizeOrigin(apiBase)}/capsules/empty`;
  const bodyObj = { title };
  if (entry) bodyObj.entry = entry;
  if (runner) bodyObj.runner = runner;

  try {
    const res = await fetchJson(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(bodyObj),
    });

    if (!res || res.success !== true || typeof res.capsuleId !== "string") {
      // SECURITY: Don't include full response which may contain echoed tokens
      // Only include safe structural metadata for debugging
      throw createError({
        ...CapsuleCreateError,
        message: "Unexpected /capsules/empty response shape",
        responseShape: {
          hasSuccess: res?.success === true,
          hasCapsuleId: typeof res?.capsuleId === "string",
          keys: res ? Object.keys(res) : [],
        },
      });
    }

    return { capsuleId: res.capsuleId };
  } catch (err) {
    // If already our structured error, rethrow
    if (err.cause?.code === "CAPSULE_CREATE_ERROR") {
      throw err;
    }

    throw createError({
      ...CapsuleCreateError,
      message: `Failed to create capsule: ${err.message}`,
      cause: err,
      url,
      title,
    });
  }
};

/**
 * Upload a file to a capsule
 *
 * API Response Format (from Vibecodr backend):
 * {
 *   ok: true,           // boolean - always true on success
 *   path: string,       // The file path uploaded
 *   size: number,       // Size in bytes
 *   totalSize: number,  // Total capsule size after upload
 *   etag?: string       // Optional SHA256 hash for concurrency control
 * }
 *
 * Error Response Formats:
 * - 403 Security Block: { error, code: "E-VIBECODR-SECURITY-BLOCK", reasons[], tags[] }
 * - 429 Rate Limited: { error, retryAfter } + Retry-After header
 * - 409 Conflict: ETag mismatch for optimistic concurrency
 *
 * @param {object} params - Upload parameters
 * @param {string} params.apiBase - Vibecodr API base URL
 * @param {string} params.token - Authentication token
 * @param {string} params.capsuleId - Target capsule ID
 * @param {string} params.path - File path within capsule (e.g., 'src/App.tsx')
 * @param {string|Buffer} params.content - File content
 * @param {string} [params.etag] - Optional ETag for optimistic concurrency (If-Match header)
 * @returns {Promise<{ok: boolean, path: string, size: number, totalSize: number, etag?: string}>} Upload result from API
 * @throws {Error} VALIDATION_ERROR if required params are missing or path contains traversal sequences
 * @throws {Error} FILE_UPLOAD_ERROR if upload fails or response is invalid
 * @throws {Error} SECURITY_BLOCK if server rejects code as unsafe or apiBase is untrusted
 * @throws {Error} RATE_LIMITED if rate limit exceeded
 */
export const uploadFile = async ({
  apiBase,
  token,
  capsuleId,
  path: filePath,
  content,
  etag = null,
}) => {
  if (!apiBase || !token || !capsuleId || !filePath || content === undefined) {
    throw createError({
      ...ValidationError,
      message:
        "uploadFile requires apiBase, token, capsuleId, path, and content",
      params: {
        hasApiBase: !!apiBase,
        hasToken: !!token,
        hasCapsuleId: !!capsuleId,
        hasPath: !!filePath,
        hasContent: content !== undefined,
      },
    });
  }

  // SECURITY: Validate apiBase before sending token to prevent token theft
  const apiCheck = validateApiBase(apiBase);
  if (!apiCheck.valid) {
    throw createError({
      ...SecurityBlockError,
      message: `Refusing to send token to untrusted API: ${apiCheck.reason}`,
      apiBase,
    });
  }

  // SECURITY: Validate path to prevent path traversal attacks
  const pathCheck = isPathSafe(filePath);
  if (!pathCheck.safe) {
    throw createError({
      ...ValidationError,
      message: `Invalid file path: ${pathCheck.reason}`,
      path: filePath,
    });
  }

  const encodedPath = encodeURIComponent(filePath);
  const url = `${normalizeOrigin(apiBase)}/capsules/${capsuleId}/files/${encodedPath}`;

  // Convert string content to buffer if needed
  const body =
    typeof content === "string" ? Buffer.from(content, "utf8") : content;

  // Build headers with correct MIME type based on file extension
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": getMimeType(filePath),
    Accept: "application/json",
  };

  // Add If-Match header for optimistic concurrency if etag provided
  if (etag) {
    headers["If-Match"] = `"${etag}"`;
  }

  try {
    const res = await fetchJson(url, {
      method: "PUT",
      headers,
      body,
    });

    // Validate response per API spec: { ok: true, path, size, totalSize, etag? }
    if (!res || res.ok !== true) {
      // SECURITY: Don't include full response which may contain echoed tokens
      // Only include safe structural metadata for debugging
      throw createError({
        ...FileUploadError,
        message: `Unexpected file upload response: expected ok=true`,
        responseShape: {
          hasOk: res?.ok === true,
          keys: res ? Object.keys(res) : [],
        },
        path: filePath,
      });
    }

    // Return the full API response with validated fields
    return {
      ok: true,
      path: res.path ?? filePath,
      size: typeof res.size === "number" ? res.size : body.length,
      totalSize: typeof res.totalSize === "number" ? res.totalSize : res.size,
      ...(res.etag && { etag: res.etag }),
    };
  } catch (err) {
    // If already our structured error, rethrow
    if (
      err.cause?.code === "FILE_UPLOAD_ERROR" ||
      err.cause?.code === "SECURITY_BLOCK" ||
      err.cause?.code === "RATE_LIMITED"
    ) {
      throw err;
    }

    // Handle security block errors (403 with security code)
    if (err.status === 403 && err.body?.code?.includes?.("SECURITY")) {
      const reasons = err.body.reasons || [];
      throw createError({
        ...SecurityBlockError,
        message: `Security block: ${reasons.join(", ") || "Unsafe code detected"}`,
        securityReasons: reasons,
        securityTags: err.body.tags || [],
        cause: err,
        url,
        path: filePath,
        capsuleId,
      });
    }

    // Handle rate limit errors (429)
    // Can come from direct 429 response (err.status) or from exhausted retries (err.cause?.lastStatus)
    const isRateLimited =
      err.status === 429 ||
      (err.cause?.code === "FETCH_RETRY_EXHAUSTED" &&
        err.cause?.lastStatus === 429);
    if (isRateLimited) {
      // Extract retry-after from headers or body
      const retryAfter =
        err.headers?.get?.("Retry-After") || err.body?.retryAfter;
      const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : null;
      throw createError({
        ...RateLimitError,
        message: `Rate limited. Retry after ${retryAfterSeconds ?? "a few"} seconds.`,
        retryAfterSeconds,
        cause: err,
        url,
        path: filePath,
        capsuleId,
      });
    }

    throw createError({
      ...FileUploadError,
      message: `Failed to upload file '${filePath}': ${err.message}`,
      cause: err,
      url,
      path: filePath,
      capsuleId,
    });
  }
};

/**
 * Publish a capsule to make it live
 *
 * @param {object} params - Publish parameters
 * @param {string} params.apiBase - Vibecodr API base URL
 * @param {string} params.token - Authentication token
 * @param {string} params.capsuleId - Capsule ID to publish
 * @param {string} [params.visibility='public'] - Visibility ('public', 'unlisted', 'private')
 * @returns {Promise<{postId: string}>} Published post ID
 * @throws {Error} VALIDATION_ERROR if required params are missing or visibility is invalid
 * @throws {Error} CAPSULE_PUBLISH_ERROR if API call fails or returns unexpected response
 */
export const publishCapsule = async ({
  apiBase,
  token,
  capsuleId,
  visibility = "public",
}) => {
  if (!apiBase || !token || !capsuleId) {
    throw createError({
      ...ValidationError,
      message: "publishCapsule requires apiBase, token, and capsuleId",
      params: {
        hasApiBase: !!apiBase,
        hasToken: !!token,
        hasCapsuleId: !!capsuleId,
      },
    });
  }

  if (!["public", "unlisted", "private"].includes(visibility)) {
    throw createError({
      ...ValidationError,
      message: `Invalid visibility '${visibility}'. Must be 'public', 'unlisted', or 'private'.`,
      visibility,
    });
  }

  // SECURITY: Validate apiBase before sending token to prevent token theft
  const apiCheck = validateApiBase(apiBase);
  if (!apiCheck.valid) {
    throw createError({
      ...SecurityBlockError,
      message: `Refusing to send token to untrusted API: ${apiCheck.reason}`,
      apiBase,
    });
  }

  const url = `${normalizeOrigin(apiBase)}/capsules/${capsuleId}/publish`;

  const init = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  };

  // Only include body for non-public visibility
  if (visibility !== "public") {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify({ visibility });
  }

  try {
    const res = await fetchJson(url, init);

    const postId = res?.postId;
    if (typeof postId !== "string" || !postId) {
      // SECURITY: Don't include full response which may contain echoed tokens
      // Only include safe structural metadata for debugging
      throw createError({
        ...CapsulePublishError,
        message:
          "Unexpected /capsules/:id/publish response shape (missing postId)",
        responseShape: {
          hasPostId: typeof res?.postId === "string",
          keys: res ? Object.keys(res) : [],
        },
      });
    }

    return { postId };
  } catch (err) {
    // If already our structured error, rethrow
    if (err.cause?.code === "CAPSULE_PUBLISH_ERROR") {
      throw err;
    }

    throw createError({
      ...CapsulePublishError,
      message: `Failed to publish capsule: ${err.message}`,
      cause: err,
      url,
      capsuleId,
    });
  }
};

/**
 * Validate publishVibe required parameters.
 *
 * @param {object} params - Parameters to validate
 * @throws {Error} VALIDATION_ERROR if required params are missing
 */
const validatePublishParams = ({ apiBase, token, files, title }) => {
  if (!apiBase || !token || !files || !title) {
    throw createError({
      ...ValidationError,
      message: "publishVibe requires apiBase, token, files, and title",
      params: {
        hasApiBase: !!apiBase,
        hasToken: !!token,
        hasFiles: !!files,
        hasTitle: !!title,
      },
    });
  }

  if (!Array.isArray(files) || files.length === 0) {
    throw createError({
      ...ValidationError,
      message: "files must be a non-empty array",
      fileCount: Array.isArray(files) ? files.length : 0,
    });
  }
};

/**
 * Upload all files to a capsule with progress tracking.
 * Uses recursion with immutable accumulator per javascript.mdc.
 *
 * @param {object} params - Upload parameters
 * @returns {Promise<string[]>} List of uploaded file paths
 * @throws {Error} FILE_UPLOAD_ERROR with recovery metadata if upload fails
 */
const uploadAllFiles = async ({
  apiBase,
  token,
  capsuleId,
  files,
  verbose,
}) => {
  log(`Uploading ${files.length} file(s)...`, verbose);

  const uploadRecursively = async (remaining, uploaded = []) => {
    if (remaining.length === 0) {
      log("All files uploaded", verbose);
      return uploaded;
    }

    const [file, ...rest] = remaining;
    const index = files.length - remaining.length;

    log(`  [${index + 1}/${files.length}] ${file.path}`, verbose);

    try {
      await uploadFile({
        apiBase,
        token,
        capsuleId,
        path: file.path,
        content: file.content,
      });
      return uploadRecursively(rest, [...uploaded, file.path]);
    } catch (uploadErr) {
      log(`Upload failed for ${file.path}. CapsuleId: ${capsuleId}`, verbose);
      throw createError({
        ...FileUploadError,
        message: `Upload failed after ${uploaded.length}/${files.length} files: ${uploadErr.message}`,
        cause: uploadErr,
        capsuleId,
        failedFile: file.path,
        uploadedFiles: uploaded,
        filesUploaded: uploaded.length,
        totalFiles: files.length,
        canRetryUpload: true,
        allFilesUploaded: false,
      });
    }
  };

  return uploadRecursively(files);
};

/**
 * Publish capsule and build result URL.
 *
 * @param {object} params - Publish parameters
 * @returns {Promise<{postId: string, url: string}>}
 * @throws {Error} CAPSULE_PUBLISH_ERROR with recovery metadata if publish fails
 */
const publishAndBuildUrl = async ({
  apiBase,
  token,
  capsuleId,
  visibility,
  playerBase,
  uploadedFiles,
  totalFiles,
  verbose,
}) => {
  log(`Publishing with visibility: ${visibility}...`, verbose);

  try {
    const { postId } = await publishCapsule({
      apiBase,
      token,
      capsuleId,
      visibility,
    });
    log(`Published: postId=${postId}`, verbose);

    const url = `${normalizeOrigin(playerBase)}/player/${postId}`;
    return { postId, url };
  } catch (publishErr) {
    log(
      `Publish failed after successful upload. CapsuleId: ${capsuleId}`,
      verbose,
    );
    throw createError({
      ...CapsulePublishError,
      message: `Publish failed after successful upload: ${publishErr.message}`,
      cause: publishErr,
      capsuleId,
      uploadedFiles,
      filesUploaded: uploadedFiles.length,
      totalFiles,
      visibility,
      canRetryPublish: true,
      allFilesUploaded: true,
    });
  }
};

/**
 * Extract recovery metadata from error for error wrapping.
 *
 * @param {Error} err - Error with potential recovery data
 * @param {number} totalFiles - Total number of files
 * @returns {object} Recovery metadata
 */
const extractRecoveryData = (err, totalFiles) => ({
  capsuleId: err.capsuleId || null,
  uploadedFiles: err.uploadedFiles || [],
  filesUploaded: err.filesUploaded ?? (err.uploadedFiles?.length || 0),
  totalFiles: err.totalFiles ?? totalFiles,
  canRetryUpload: err.canRetryUpload || false,
  canRetryPublish: err.canRetryPublish || false,
  allFilesUploaded: err.allFilesUploaded || false,
});

/**
 * Full publish flow: create capsule -> upload files -> publish
 *
 * ERROR RECOVERY:
 * - If upload fails after capsule creation, error includes capsuleId and uploadProgress
 *   so caller can retry uploads with retryUploadFiles() or clean up
 * - If publish fails after uploads, error includes capsuleId and allFilesUploaded=true
 *   so caller can retry publish with retryPublishCapsule()
 *
 * @param {object} params - Publish parameters
 * @param {string} params.apiBase - Vibecodr API base URL
 * @param {string} params.token - Authentication token
 * @param {Array<{path: string, content: string|Buffer}>} params.files - Files to upload
 * @param {string} params.title - Capsule title
 * @param {string} [params.entry] - Entry file path
 * @param {string} [params.runner] - Runner type
 * @param {string} [params.visibility='public'] - Visibility setting
 * @param {boolean} [params.verbose=false] - Enable verbose logging
 * @param {string} [params.playerBase='https://vibecodr.space'] - Player base URL
 * @returns {Promise<{success: boolean, postId: string, capsuleId: string, url: string}>}
 * @throws {Error} VALIDATION_ERROR if required params are missing or files array is empty
 * @throws {Error} PUBLISH_FAILED with cause chain and recovery metadata if any step fails
 */
export const publishVibe = async ({
  apiBase,
  token,
  files,
  title,
  entry,
  runner,
  visibility = "public",
  verbose = false,
  playerBase = "https://vibecodr.space",
}) => {
  // Step 1: Validate parameters
  validatePublishParams({ apiBase, token, files, title });

  try {
    // Step 2: Create capsule
    log(`Creating capsule: "${title}"...`, verbose);
    const { capsuleId } = await createCapsule({
      apiBase,
      token,
      title,
      entry,
      runner,
    });
    log(`Created capsule: ${capsuleId}`, verbose);

    // Step 3: Upload all files
    const uploadedFiles = await uploadAllFiles({
      apiBase,
      token,
      capsuleId,
      files,
      verbose,
    });

    // Step 4: Publish and build URL
    const { postId, url } = await publishAndBuildUrl({
      apiBase,
      token,
      capsuleId,
      visibility,
      playerBase,
      uploadedFiles,
      totalFiles: files.length,
      verbose,
    });

    return {
      success: true,
      postId,
      capsuleId,
      url,
    };
  } catch (err) {
    // Wrap errors preserving recovery data
    const knownCodes = [
      "CAPSULE_CREATE_ERROR",
      "FILE_UPLOAD_ERROR",
      "CAPSULE_PUBLISH_ERROR",
      "VALIDATION_ERROR",
    ];
    const errCode = err.cause?.code || err.code;
    const recoveryData = extractRecoveryData(err, files.length);

    throw createError({
      ...PublishFailed,
      message: `Publish failed: ${err.message}`,
      cause: err,
      title,
      ...recoveryData,
    });
  }
};

/**
 * Retry publishing an existing capsule.
 * Use this when publishVibe fails after files were successfully uploaded.
 *
 * @param {object} params - Retry parameters
 * @param {string} params.apiBase - Vibecodr API base URL
 * @param {string} params.token - Authentication token
 * @param {string} params.capsuleId - Existing capsule ID from failed publish
 * @param {string} [params.visibility='public'] - Visibility setting
 * @param {boolean} [params.verbose=false] - Enable verbose logging
 * @param {string} [params.playerBase='https://vibecodr.space'] - Player base URL
 * @returns {Promise<{success: boolean, postId: string, capsuleId: string, url: string}>}
 * @throws {Error} CAPSULE_PUBLISH_ERROR if publish fails
 *
 * @example
 * try {
 *   result = await publishVibe({ ... });
 * } catch (err) {
 *   if (err.canRetryPublish && err.capsuleId) {
 *     // All files uploaded, just publish failed - retry publish only
 *     result = await retryPublishCapsule({
 *       apiBase, token,
 *       capsuleId: err.capsuleId,
 *       visibility: err.visibility
 *     });
 *   }
 * }
 */
export const retryPublishCapsule = async ({
  apiBase,
  token,
  capsuleId,
  visibility = "public",
  verbose = false,
  playerBase = "https://vibecodr.space",
}) => {
  if (!apiBase || !token || !capsuleId) {
    throw createError({
      ...ValidationError,
      message: "retryPublishCapsule requires apiBase, token, and capsuleId",
      params: {
        hasApiBase: !!apiBase,
        hasToken: !!token,
        hasCapsuleId: !!capsuleId,
      },
    });
  }

  log(`Retrying publish for capsule: ${capsuleId}`, verbose);

  const { postId } = await publishCapsule({
    apiBase,
    token,
    capsuleId,
    visibility,
  });

  log(`Retry successful: postId=${postId}`, verbose);

  const url = `${normalizeOrigin(playerBase)}/player/${postId}`;

  return {
    success: true,
    postId,
    capsuleId,
    url,
  };
};

/**
 * Retry uploading remaining files to an existing capsule.
 * Use this when publishVibe fails during file upload.
 *
 * @param {object} params - Retry parameters
 * @param {string} params.apiBase - Vibecodr API base URL
 * @param {string} params.token - Authentication token
 * @param {string} params.capsuleId - Existing capsule ID from failed upload
 * @param {Array<{path: string, content: string|Buffer}>} params.files - All files to upload
 * @param {string[]} [params.skipPaths=[]] - Paths already uploaded (from error.uploadedFiles)
 * @param {boolean} [params.verbose=false] - Enable verbose logging
 * @returns {Promise<{success: boolean, uploadedFiles: string[], totalUploaded: number}>}
 * @throws {Error} FILE_UPLOAD_ERROR if upload fails
 *
 * @example
 * try {
 *   result = await publishVibe({ files, ... });
 * } catch (err) {
 *   if (err.canRetryUpload && err.capsuleId) {
 *     // Upload failed partway - retry remaining files
 *     await retryUploadFiles({
 *       apiBase, token,
 *       capsuleId: err.capsuleId,
 *       files,
 *       skipPaths: err.uploadedFiles
 *     });
 *     // Then retry publish
 *     result = await retryPublishCapsule({ ... });
 *   }
 * }
 */
export const retryUploadFiles = async ({
  apiBase,
  token,
  capsuleId,
  files,
  skipPaths = [],
  verbose = false,
}) => {
  if (!apiBase || !token || !capsuleId || !files) {
    throw createError({
      ...ValidationError,
      message: "retryUploadFiles requires apiBase, token, capsuleId, and files",
      params: {
        hasApiBase: !!apiBase,
        hasToken: !!token,
        hasCapsuleId: !!capsuleId,
        hasFiles: !!files,
      },
    });
  }

  const skipSet = new Set(skipPaths);
  const filesToUpload = files.filter((f) => !skipSet.has(f.path));

  log(
    `Retrying upload: ${filesToUpload.length} files remaining (${skipPaths.length} already uploaded)`,
    verbose,
  );

  // Recursive upload with immutable accumulator per javascript.mdc
  const uploadRecursively = async (remaining, uploaded = [...skipPaths]) => {
    if (remaining.length === 0) {
      log(`Retry upload complete: ${uploaded.length} files`, verbose);
      return {
        success: true,
        uploadedFiles: uploaded,
        totalUploaded: uploaded.length,
      };
    }

    const [file, ...rest] = remaining;
    const index = filesToUpload.length - remaining.length;

    log(`  [${index + 1}/${filesToUpload.length}] ${file.path}`, verbose);

    try {
      await uploadFile({
        apiBase,
        token,
        capsuleId,
        path: file.path,
        content: file.content,
      });
      return uploadRecursively(rest, [...uploaded, file.path]);
    } catch (uploadErr) {
      throw createError({
        ...FileUploadError,
        message: `Retry upload failed for ${file.path}: ${uploadErr.message}`,
        cause: uploadErr,
        capsuleId,
        failedFile: file.path,
        uploadedFiles: uploaded,
        filesUploaded: uploaded.length,
        totalFiles: files.length,
        canRetryUpload: true,
        allFilesUploaded: false,
      });
    }
  };

  return uploadRecursively(filesToUpload);
};

/**
 * Create auth retry wrapper for publish operations
 * Retries operation once if auth error detected
 *
 * @param {Function} getToken - Async function to get fresh token
 * @returns {Function} Wrapper function for auth retry
 */
export const withAuthRetry = (getToken) => async (operation) => {
  try {
    return await operation();
  } catch (err) {
    if (isAuthError(err)) {
      // Get fresh token and retry once
      const newToken = await getToken();
      return await operation(newToken);
    }
    throw err;
  }
};

// Re-export utilities that consumers may need (for backward compatibility)
// NOTE: Prefer importing directly from vibe-utils.js in new code
export { isAuthError, normalizeOrigin } from "./vibe-utils.js";
