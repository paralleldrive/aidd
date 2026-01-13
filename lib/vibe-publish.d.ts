export type VibeFileContent = string | Uint8Array;

export type PublishFile = { path: string; content: VibeFileContent };

export const vibePublishErrors: Record<string, { code: string; message: string }>;

export function getMimeType(filePath: string): string;

export function createCapsule(params: {
  apiBase: string;
  token: string;
  title: string;
  entry?: string;
  runner?: string;
}): Promise<Record<string, unknown>>;

export function uploadFile(params: {
  apiBase: string;
  token: string;
  capsuleId: string;
  path: string;
  content: VibeFileContent;
  etag?: string | null;
}): Promise<Record<string, unknown>>;

export function publishCapsule(params: {
  apiBase: string;
  token: string;
  capsuleId: string;
  visibility?: "public" | "unlisted" | "private";
}): Promise<Record<string, unknown>>;

export function publishVibe(params: {
  apiBase: string;
  token: string;
  files: PublishFile[];
  title: string;
  entry?: string;
  runner?: string;
  visibility?: "public" | "unlisted" | "private";
  verbose?: boolean;
  playerBase?: string;
}): Promise<{ success: true; [key: string]: unknown }>;

export function retryPublishCapsule(params: {
  apiBase: string;
  token: string;
  capsuleId: string;
  visibility?: "public" | "unlisted" | "private";
  verbose?: boolean;
  playerBase?: string;
}): Promise<{ success: true; [key: string]: unknown }>;

export function retryUploadFiles(params: {
  apiBase: string;
  token: string;
  capsuleId: string;
  files: PublishFile[];
  skipPaths?: string[];
  verbose?: boolean;
}): Promise<{ success: true; [key: string]: unknown }>;

export function withAuthRetry(
  getToken: () => Promise<string>,
): (operation: (overrideToken?: string) => Promise<unknown>) => Promise<unknown>;
