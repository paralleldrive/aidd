/** Shape of every error created by the error-causes library via createError() */
export interface CausedError extends Error {
  cause: {
    code: string;
    name: string;
    message: string;
    [key: string]: unknown;
  };
}

/** Base shape for error type objects used as createError() spread targets */
export interface ErrorType {
  code: string;
  name: string;
  message: string;
}

export const CloneError: ErrorType;
export const FileSystemError: ErrorType;
export const ValidationError: ErrorType;

/**
 * Route a thrown CausedError to the matching handler by cause name.
 * The returned function is passed directly to .catch() or called with a result.error.
 */
export const handleCliErrors: (
  handlers: Record<string, (error: CausedError) => unknown>,
) => (error: Error) => unknown;
