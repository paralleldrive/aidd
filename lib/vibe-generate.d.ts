export type GeneratedFile = {
  path: string;
  content: string;
  language?: string;
};

export type ParsedGeneratedCode = {
  files: GeneratedFile[];
  entry: string;
  metadata?: Record<string, unknown>;
};

export function parseGeneratedCode(aiResponse: string): ParsedGeneratedCode;

export function createDefaultVibe(params: {
  title?: string;
  minimal?: boolean;
}): ParsedGeneratedCode;

export function generateVibeCode(params: {
  prompt: string;
  verbose?: boolean;
  logger?: (msg: string) => void;
  generateFn?: ((prompt: string) => Promise<string>) | null;
}): Promise<ParsedGeneratedCode>;

export function validateGeneratedFiles(files: Array<{ path: string; content: string }>): {
  valid: boolean;
  warnings: string[];
  errors: string[];
  stats: Record<string, unknown>;
};
