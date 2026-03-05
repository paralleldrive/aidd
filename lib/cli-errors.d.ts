/** Shared CLI error type definitions and handler factory */

export const CloneError: { code: string; message: string };
export const FileSystemError: { code: string; message: string };
export const ValidationError: { code: string; message: string };

/**
 * Error handler factory for CLI structured errors.
 * Accepts a map of handlers keyed by error name and returns a function
 * that routes a thrown error to the matching handler.
 */
export const handleCliErrors: (handlers: {
  CloneError: (error: Error) => unknown;
  FileSystemError: (error: Error) => unknown;
  ValidationError: (error: Error) => unknown;
}) => (error: Error) => unknown;
