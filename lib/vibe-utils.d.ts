export function normalizeOrigin(origin: string): string;

export function validateApiBase(
  apiBase: string,
  options?: { _testOnlyOrigins?: string[] },
): { valid: boolean; reason?: string; origin?: string };

export function validatePlayerBase(
  playerBase: string,
  options?: { _testOnlyOrigins?: string[] },
): { valid: boolean; reason?: string; origin?: string };

export function createVerboseLogger(
  moduleName: string,
): (message: string, verbose: boolean) => void;

export function verboseLog(prefix: string, message: string, verbose: boolean): void;

export function fetchWithTimeout(
  url: string,
  init?: unknown,
  timeoutMs?: number,
): Promise<unknown>;

export function fetchWithRetry(
  url: string,
  init?: unknown,
  options?: {
    maxRetries?: number;
    baseDelayMs?: number;
    timeoutMs?: number;
    verbose?: boolean;
  },
): Promise<unknown>;

export function fetchJson(
  url: string,
  init?: unknown,
  options?: {
    timeoutMs?: number;
    maxRetries?: number;
    baseDelayMs?: number;
    verbose?: boolean;
  },
): Promise<unknown>;

export function isAuthError(err: unknown): boolean;
export const isLikelyClerkTokenProblem: typeof isAuthError;

export function isPathSafe(filePath: string): { safe: boolean; reason?: string };

export function deepClone<T>(obj: T): T;

export function mergeConfig<T extends object, U extends object>(
  target: T,
  source: U,
): T & U;

export const allowedOrigins: Record<string, string[]>;
