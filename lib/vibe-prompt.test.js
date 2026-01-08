import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import {
  buildVibePrompt,
  buildFromTemplate,
  vibeSystemPrompt,
  vibeSystemPromptCompact,
  platformLimits,
  forbiddenPatterns,
  validEntryExtensions,
  promptTemplates,
} from "./vibe-prompt.js";

// -----------------------------------------------------------------------------
// buildVibePrompt Tests
// -----------------------------------------------------------------------------

describe("buildVibePrompt", () => {
  test("returns success with valid user prompt", () => {
    const result = buildVibePrompt({
      userPrompt: "Create a bouncing ball animation",
    });

    assert({
      given: "valid user prompt",
      should: "return success true",
      actual: result.success,
      expected: true,
    });

    assert({
      given: "valid user prompt",
      should: "include user message",
      actual: result.userMessage.includes("bouncing ball"),
      expected: true,
    });
  });

  test("includes system prompt in full prompt", () => {
    const result = buildVibePrompt({
      userPrompt: "Create a counter app",
    });

    assert({
      given: "valid user prompt",
      should: "include system prompt content",
      actual: result.fullPrompt.includes("React/TypeScript developer"),
      expected: true,
    });
  });

  test("throws on empty user prompt", () => {
    let error = null;
    try {
      buildVibePrompt({
        userPrompt: "",
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "empty user prompt",
      should: "throw error",
      actual: error !== null,
      expected: true,
    });

    assert({
      given: "empty user prompt",
      should: "include INVALID_PROMPT error code",
      actual: error?.cause?.code,
      expected: "INVALID_PROMPT",
    });
  });

  test("throws on null user prompt", () => {
    let error = null;
    try {
      buildVibePrompt({
        userPrompt: null,
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "null user prompt",
      should: "throw error",
      actual: error !== null,
      expected: true,
    });

    assert({
      given: "null user prompt",
      should: "include INVALID_PROMPT error code",
      actual: error?.cause?.code,
      expected: "INVALID_PROMPT",
    });
  });

  test("throws on whitespace-only user prompt", () => {
    let error = null;
    try {
      buildVibePrompt({
        userPrompt: "   \t\n   ",
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "whitespace-only user prompt",
      should: "throw error",
      actual: error !== null,
      expected: true,
    });

    assert({
      given: "whitespace-only user prompt",
      should: "include INVALID_PROMPT error code",
      actual: error?.cause?.code,
      expected: "INVALID_PROMPT",
    });
  });

  test("estimates more tokens for Unicode text", () => {
    // ASCII text: 12 characters
    const asciiResult = buildVibePrompt({
      userPrompt: "Hello world!",
      constraints: { compact: true },
    });

    // Unicode text with emoji: same visible characters but more bytes
    const unicodeResult = buildVibePrompt({
      userPrompt: "Hello 世界! 🌍",
      constraints: { compact: true },
    });

    // Unicode should have higher token estimate because it uses byte length
    assert({
      given: "Unicode text vs ASCII text",
      should: "estimate more tokens for Unicode (uses byte length)",
      actual:
        unicodeResult.metadata.estimatedTokens >=
        asciiResult.metadata.estimatedTokens,
      expected: true,
    });
  });

  test("estimates more tokens for emoji-heavy text than ASCII of same char length", () => {
    // Emoji are 4 bytes each in UTF-8
    // 5 emoji = 5 chars but 20 bytes -> ~7 tokens (20/3)
    const emojiResult = buildVibePrompt({
      userPrompt: "🎮🎯🎨🎭🎪",
      constraints: { compact: true },
    });

    // 5 ASCII chars = 5 bytes -> ~2 tokens (5/3)
    const asciiResult = buildVibePrompt({
      userPrompt: "games",
      constraints: { compact: true },
    });

    // Both have 5 characters, but emoji should estimate MORE tokens
    // because byte-based estimation counts emoji as 4 bytes each
    assert({
      given: "emoji prompt vs ASCII prompt of same character count",
      should: "estimate more tokens for emoji (byte-based calculation)",
      actual:
        emojiResult.metadata.estimatedTokens >
        asciiResult.metadata.estimatedTokens,
      expected: true,
    });
  });

  test("estimates more tokens for CJK characters than ASCII of same char length", () => {
    // CJK characters are 3 bytes each in UTF-8
    // 7 CJK chars = 7 chars but 21 bytes -> ~7 tokens (21/3)
    const cjkResult = buildVibePrompt({
      userPrompt: "创建一个计数器",
      constraints: { compact: true },
    });

    // 7 ASCII chars = 7 bytes -> ~3 tokens (7/3)
    const asciiResult = buildVibePrompt({
      userPrompt: "counter",
      constraints: { compact: true },
    });

    // Both have 7 characters, but CJK should estimate MORE tokens
    // because byte-based estimation counts CJK as 3 bytes each
    assert({
      given: "CJK prompt vs ASCII prompt of same character count",
      should: "estimate more tokens for CJK (byte-based calculation)",
      actual:
        cjkResult.metadata.estimatedTokens >
        asciiResult.metadata.estimatedTokens,
      expected: true,
    });
  });

  test("estimates tokens proportionally to byte length", () => {
    // Test that token estimation scales with bytes, not characters
    // Single emoji: 4 bytes -> ceil(4/3) = 2 tokens
    // Two emoji: 8 bytes -> ceil(8/3) = 3 tokens
    // Four emoji: 16 bytes -> ceil(16/3) = 6 tokens
    const oneEmoji = buildVibePrompt({
      userPrompt: "🎮",
      constraints: { compact: true },
    });

    const fourEmoji = buildVibePrompt({
      userPrompt: "🎮🎮🎮🎮",
      constraints: { compact: true },
    });

    // Four emoji should estimate roughly 4x more tokens than one emoji
    // (for the user prompt portion - note system prompt adds constant overhead)
    // We just verify that more emoji = more tokens, confirming byte-based scaling
    assert({
      given: "4x emoji count",
      should: "estimate proportionally more tokens",
      actual:
        fourEmoji.metadata.estimatedTokens > oneEmoji.metadata.estimatedTokens,
      expected: true,
    });
  });

  test("uses compact prompt when requested", () => {
    const result = buildVibePrompt({
      userPrompt: "Create a simple app",
      constraints: { compact: true },
    });

    assert({
      given: "compact constraint",
      should: "use compact system prompt",
      actual: result.systemPrompt === vibeSystemPromptCompact,
      expected: true,
    });

    assert({
      given: "compact constraint",
      should: "set compact in metadata",
      actual: result.metadata?.compact,
      expected: true,
    });
  });

  test("includes tier limits in prompt", () => {
    const result = buildVibePrompt({
      userPrompt: "Create an app",
      constraints: { tier: "creator" },
    });

    assert({
      given: "creator tier",
      should: "include 50MB limit in prompt",
      actual: result.fullPrompt.includes("50MB"),
      expected: true,
    });
  });

  test("includes required features when specified", () => {
    const result = buildVibePrompt({
      userPrompt: "Create a game",
      constraints: {
        requiredFeatures: ["Score tracking", "Sound effects"],
      },
    });

    assert({
      given: "required features",
      should: "include features in prompt",
      actual:
        result.fullPrompt.includes("Score tracking") &&
        result.fullPrompt.includes("Sound effects"),
      expected: true,
    });

    assert({
      given: "required features",
      should: "set hasFeatures in metadata",
      actual: result.metadata?.hasFeatures,
      expected: true,
    });
  });

  test("includes style guidance when specified", () => {
    const result = buildVibePrompt({
      userPrompt: "Create a dashboard",
      constraints: { style: "Dark theme with neon accents" },
    });

    assert({
      given: "style constraint",
      should: "include style in prompt",
      actual: result.fullPrompt.includes("Dark theme with neon accents"),
      expected: true,
    });

    assert({
      given: "style constraint",
      should: "set hasStyle in metadata",
      actual: result.metadata?.hasStyle,
      expected: true,
    });
  });

  test("estimates token count", () => {
    const result = buildVibePrompt({
      userPrompt: "Create a simple counter",
    });

    assert({
      given: "valid prompt",
      should: "include estimated token count",
      actual: result.metadata?.estimatedTokens > 0,
      expected: true,
    });
  });

  test("throws on token limit exceeded", () => {
    const longPrompt = "Create ".repeat(10000);

    let error = null;
    try {
      buildVibePrompt({
        userPrompt: longPrompt,
        constraints: { maxTokens: 100 },
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "prompt exceeding token limit",
      should: "throw PROMPT_TOO_LONG error",
      actual: error?.cause?.code,
      expected: "PROMPT_TOO_LONG",
    });
  });
});

// -----------------------------------------------------------------------------
// buildFromTemplate Tests
// -----------------------------------------------------------------------------

describe("buildFromTemplate", () => {
  test("applies game template", () => {
    const result = buildFromTemplate("game", "a space shooter");

    assert({
      given: "game template",
      should: "include game prefix in prompt",
      actual: result.userMessage.includes("interactive game"),
      expected: true,
    });

    assert({
      given: "game template",
      should: "include score requirement",
      actual: result.fullPrompt.includes("Score"),
      expected: true,
    });
  });

  test("applies visualization template", () => {
    const result = buildFromTemplate("visualization", "stock price chart");

    assert({
      given: "visualization template",
      should: "include visualization prefix",
      actual: result.userMessage.includes("data visualization"),
      expected: true,
    });
  });

  test("applies tool template", () => {
    const result = buildFromTemplate("tool", "color picker");

    assert({
      given: "tool template",
      should: "include tool prefix",
      actual: result.userMessage.includes("utility tool"),
      expected: true,
    });
  });

  test("applies creative template", () => {
    const result = buildFromTemplate("creative", "generative art piece");

    assert({
      given: "creative template",
      should: "include creative prefix",
      actual: result.userMessage.includes("artistic/creative"),
      expected: true,
    });
  });

  test("falls back to basic prompt for unknown template", () => {
    const result = buildFromTemplate("unknown", "some app");

    assert({
      given: "unknown template name",
      should: "return valid result",
      actual: result.success,
      expected: true,
    });

    assert({
      given: "unknown template name",
      should: "include original prompt",
      actual: result.userMessage.includes("some app"),
      expected: true,
    });
  });

  test("merges constraints with template features", () => {
    const result = buildFromTemplate("game", "puzzle game", {
      requiredFeatures: ["Timer"],
    });

    assert({
      given: "template with additional features",
      should: "include both template and custom features",
      actual:
        result.fullPrompt.includes("Score") &&
        result.fullPrompt.includes("Timer"),
      expected: true,
    });
  });
});

// -----------------------------------------------------------------------------
// Constants Tests
// -----------------------------------------------------------------------------

describe("vibeSystemPrompt", () => {
  test("includes essential platform info", () => {
    assert({
      given: "system prompt",
      should: "mention React/TypeScript",
      actual: vibeSystemPrompt.includes("React/TypeScript"),
      expected: true,
    });

    assert({
      given: "system prompt",
      should: "mention Vibecodr",
      actual: vibeSystemPrompt.includes("Vibecodr"),
      expected: true,
    });

    assert({
      given: "system prompt",
      should: "mention sandboxed iframe",
      actual: vibeSystemPrompt.includes("sandboxed"),
      expected: true,
    });
  });

  test("includes forbidden patterns", () => {
    assert({
      given: "system prompt",
      should: "warn about entry.tsx",
      actual: vibeSystemPrompt.includes("entry.tsx"),
      expected: true,
    });

    assert({
      given: "system prompt",
      should: "warn about API keys",
      actual: vibeSystemPrompt.includes("API key"),
      expected: true,
    });
  });

  test("includes code examples", () => {
    assert({
      given: "system prompt",
      should: "include App component example",
      actual: vibeSystemPrompt.includes("export default function App"),
      expected: true,
    });
  });
});

describe("vibeSystemPromptCompact", () => {
  test("is shorter than full prompt", () => {
    assert({
      given: "compact prompt",
      should: "be shorter than full prompt",
      actual: vibeSystemPromptCompact.length < vibeSystemPrompt.length,
      expected: true,
    });
  });

  test("includes essential rules", () => {
    assert({
      given: "compact prompt",
      should: "mention entry point",
      actual: vibeSystemPromptCompact.includes("index.tsx"),
      expected: true,
    });

    assert({
      given: "compact prompt",
      should: "mention React globals",
      actual: vibeSystemPromptCompact.includes("React/ReactDOM"),
      expected: true,
    });
  });
});

describe("platformLimits", () => {
  test("defines free tier limits", () => {
    assert({
      given: "free tier",
      should: "have 10MB max bundle",
      actual: platformLimits.free.maxBundleSize,
      expected: 10 * 1024 * 1024,
    });

    assert({
      given: "free tier",
      should: "have 100 max files",
      actual: platformLimits.free.maxFiles,
      expected: 100,
    });
  });

  test("defines creator tier limits", () => {
    assert({
      given: "creator tier",
      should: "have 50MB max bundle",
      actual: platformLimits.creator.maxBundleSize,
      expected: 50 * 1024 * 1024,
    });
  });

  test("defines pro tier limits", () => {
    assert({
      given: "pro tier",
      should: "have 100MB max bundle",
      actual: platformLimits.pro.maxBundleSize,
      expected: 100 * 1024 * 1024,
    });
  });
});

describe("forbiddenPatterns", () => {
  test("includes reserved file names", () => {
    assert({
      given: "forbidden patterns",
      should: "include entry.tsx",
      actual: forbiddenPatterns.includes("entry.tsx"),
      expected: true,
    });
  });

  test("includes security risks", () => {
    assert({
      given: "forbidden patterns",
      should: "include .env",
      actual: forbiddenPatterns.includes(".env"),
      expected: true,
    });
  });
});

describe("validEntryExtensions", () => {
  test("includes tsx extension", () => {
    assert({
      given: "valid extensions",
      should: "include .tsx",
      actual: validEntryExtensions.includes(".tsx"),
      expected: true,
    });
  });

  test("includes html extension", () => {
    assert({
      given: "valid extensions",
      should: "include .html",
      actual: validEntryExtensions.includes(".html"),
      expected: true,
    });
  });
});

describe("promptTemplates", () => {
  test("defines game template", () => {
    assert({
      given: "prompt templates",
      should: "have game template",
      actual: promptTemplates.game !== undefined,
      expected: true,
    });

    assert({
      given: "game template",
      should: "include required features",
      actual: promptTemplates.game.requiredFeatures.length > 0,
      expected: true,
    });
  });

  test("defines visualization template", () => {
    assert({
      given: "prompt templates",
      should: "have visualization template",
      actual: promptTemplates.visualization !== undefined,
      expected: true,
    });
  });

  test("defines tool template", () => {
    assert({
      given: "prompt templates",
      should: "have tool template",
      actual: promptTemplates.tool !== undefined,
      expected: true,
    });
  });

  test("defines creative template", () => {
    assert({
      given: "prompt templates",
      should: "have creative template",
      actual: promptTemplates.creative !== undefined,
      expected: true,
    });
  });
});
