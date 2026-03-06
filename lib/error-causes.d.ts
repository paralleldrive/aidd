/** Shape of every error created by the error-causes library via createError() */
export interface CausedError extends Error {
  cause: {
    code: string;
    name: string;
    message: string;
    [key: string]: unknown;
  };
}

/** Error template objects — spread into createError() to throw structured errors */
export const CloneError: { code: string; message: string };
export const FileSystemError: { code: string; message: string };
export const ValidationError: { code: string; message: string };

/**
 * Route a thrown CausedError to the matching handler by cause name.
 * The returned function is passed directly to .catch() or called with a result.error.
 */
export const handleCliErrors: (
  handlers: Record<string, (error: CausedError) => unknown>,
) => (error: Error) => unknown;
