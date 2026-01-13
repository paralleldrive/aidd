export type VibeFileContent = string | Uint8Array;

export type VibeFileEntry = {
  path: string;
  content: VibeFileContent;
  [key: string]: unknown;
};

export const vibeFileErrors: Record<string, { code: string; message: string }>;

export function validateFileName(fileName: string): {
  valid: boolean;
  reason?: string;
};

export function validateBundle(
  files: VibeFileEntry[],
  options?: { maxSize?: number; maxFiles?: number },
): { valid: true; totalSize: number; fileCount: number };

export function createFileEntry(params: {
  path: string;
  content: VibeFileContent;
}): VibeFileEntry;

export function collectGeneratedFiles(generatedOutput: unknown): VibeFileEntry[];

export function calculateBundleSize(files: Array<{ path: string; content?: VibeFileContent; size?: number }> | null): {
  totalSize: number;
  fileCount: number;
  breakdown: Record<string, number>;
};

export const defaults: Record<string, unknown>;
