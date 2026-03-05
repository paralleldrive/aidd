/**
 * Ambient type declaration for error-causes.
 *
 * TODO: upstream proper types to the error-causes package.
 * Tracking issue: https://github.com/paralleldrive/aidd/issues/109
 */
declare module "error-causes" {
  export interface ErrorCause {
    name?: string;
    message?: string;
    code?: string | number;
    cause?: unknown;
    [key: string]: unknown;
  }

  /**
   * Creates a structured Error with a typed cause object attached.
   */
  export function createError(
    options: ErrorCause,
  ): Error & { cause: ErrorCause };

  /**
   * Defines a set of named error causes and returns a matched error-handler factory.
   *
   * @returns [errorCauses, handleErrors] tuple
   */
  export function errorCauses<T extends Record<string, ErrorCause>>(
    causes: T,
  ): [
    { [K in keyof T]: T[K] & { name: K } },
    (
      handlers: {
        [K in keyof T]: (
          error: Error & { cause: T[K] & { name: K } },
        ) => unknown;
      },
    ) => (error: Error) => unknown,
  ];

  export function noop(): void;
}
