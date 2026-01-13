export interface EnsureVibecodrAuthParams {
  apiBase?: string;
  configPath?: string;
  verbose?: boolean;
  minValidSeconds?: number;
}

export function ensureVibecodrAuth(
  params?: EnsureVibecodrAuthParams,
): Promise<{ token: string; expiresAt: number }>;

export interface RefreshVibecodrTokenParams {
  configPath?: string;
  apiBase?: string;
  verbose?: boolean;
}

export function refreshVibecodrToken(
  params?: RefreshVibecodrTokenParams,
): Promise<{ token: string; expiresAt: number }>;

export function defaultConfigPath(): string;

export function normalizeOrigin(origin: string): string;

export function isLikelyClerkTokenProblem(err: unknown): boolean;

export function getStoredCredentials(params?: {
  configPath?: string;
}): {
  hasCredentials: boolean;
  expiresAt?: number;
  isExpired?: boolean;
  configPath: string;
};

export function fixWindowsPermissions(
  filePath: string,
  options?: { verbose?: boolean },
): { success: boolean; warning?: string; commandRun?: string };
