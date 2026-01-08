export const platformLimits: Record<string, unknown>;

export const forbiddenPatterns: string[];

export const validEntryExtensions: string[];

export const vibeSystemPrompt: string;
export const vibeSystemPromptCompact: string;

export interface BuildVibePromptConstraints {
  tier?: "free" | "creator" | "pro";
  compact?: boolean;
  maxTokens?: number;
  requiredFeatures?: string[];
  style?: string | null;
}

export type BuiltVibePrompt = {
  success: true;
  fullPrompt: string;
  [key: string]: unknown;
};

export function buildVibePrompt(params: {
  userPrompt: string;
  constraints?: BuildVibePromptConstraints;
}): BuiltVibePrompt;

export const promptTemplates: Record<string, unknown>;

export function buildFromTemplate(
  templateName: string,
  userPrompt: string,
  constraints?: BuildVibePromptConstraints,
): BuiltVibePrompt;
