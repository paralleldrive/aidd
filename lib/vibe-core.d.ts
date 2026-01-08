export type VibeFile = {
  path: string;
  content: string | Uint8Array;
  size?: number;
};

export function executeVibe(params?: {
  title: string;
  prompt?: string;
  files?: VibeFile[];
  entry?: string;
  runner?: string;
  visibility?: "public" | "unlisted" | "private";
  dryRun?: boolean;
  verbose?: boolean;
  apiBase?: string;
  playerBase?: string;
  configPath?: string;
  generateFn?: ((prompt: string) => Promise<string>) | null;
}): Promise<{ success: boolean; [key: string]: unknown }>;

export function validateVibeParams(params: {
  title?: string;
  prompt?: string;
  files?: VibeFile[];
  runner?: string;
  visibility?: string;
}): { valid: boolean; errors: string[] };

export const vibeCoreErrors: Record<string, { code: string; message: string }>;
