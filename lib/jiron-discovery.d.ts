export type JironContractConfig = {
  oauth: Record<string, unknown>;
  endpoints: Record<string, unknown>;
  apiBase: string | null;
  playerBase: string | null;
  playerUrlTemplate: string | null;
  raw: Record<string, unknown>;
};

export function parseJironPug(pugContent: string): JironContractConfig;

export function fetchJironContract(params: {
  apiBase: string;
  forceRefresh?: boolean;
  fetchFn?: (...args: any[]) => Promise<any>;
}): Promise<JironContractConfig>;

export function clearJironCache(): void;

export function getJironCacheState(): {
  hasCache: boolean;
  expiresAt: string | null;
  ttlRemaining: number;
};

export function getDefaultConfig(): Record<string, unknown>;
