/**
 * Vibe Prompt Construction Module
 *
 * Builds optimized prompts for AI code generation targeting
 * the Vibecodr platform. Includes platform constraints, code
 * structure templates, and quality requirements.
 *
 * @module vibe-prompt
 */

import { errorCauses, createError } from "error-causes";

// -----------------------------------------------------------------------------
// Error Definitions
// -----------------------------------------------------------------------------

const [promptErrors] = errorCauses({
  InvalidPrompt: {
    code: "INVALID_PROMPT",
    message: "Prompt is required and must be a non-empty string",
  },
  PromptTooLong: {
    code: "PROMPT_TOO_LONG",
    message: "Prompt exceeds maximum token limit",
  },
});

const { InvalidPrompt, PromptTooLong } = promptErrors;

// -----------------------------------------------------------------------------
// Platform Constraints
// -----------------------------------------------------------------------------

/**
 * File and bundle size limits by tier.
 * Used to inform AI about platform constraints.
 */
export const platformLimits = {
  free: {
    maxBundleSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 100,
    targetBundleSize: 5 * 1024 * 1024, // 5MB recommended
  },
  creator: {
    maxBundleSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 500,
    targetBundleSize: 10 * 1024 * 1024, // 10MB recommended
  },
  pro: {
    maxBundleSize: 100 * 1024 * 1024, // 100MB
    maxFiles: 2000,
    targetBundleSize: 25 * 1024 * 1024, // 25MB recommended
  },
};

/**
 * Forbidden file patterns that should never be generated.
 */
export const forbiddenPatterns = [
  "entry.tsx", // Reserved by platform
  "_vibecodr_*", // Reserved prefix
  "__VCSHIM*", // Reserved prefix
  "node_modules/", // Not allowed in bundle
  "package.json", // Not allowed in bundle
  ".env", // Security risk
  ".env.*", // Security risk
];

/**
 * Valid entry point extensions for vibes.
 */
export const validEntryExtensions = [
  ".html",
  ".htm",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
];

// -----------------------------------------------------------------------------
// System Prompt (Full Version)
// -----------------------------------------------------------------------------

/**
 * Complete system prompt for AI code generation.
 * Derived from vibe-generation-prompt.md with platform constraints.
 */
export const vibeSystemPrompt = `You are an expert React/TypeScript developer creating interactive apps called "vibes" for the Vibecodr platform. Your output will be compiled and run in a sandboxed browser iframe.

## Platform Constraints (MUST FOLLOW)

### Runner & Entry Point
- Use \`client-static\` runner (default) - DO NOT use webcontainer unless Node.js APIs are required
- Valid entry extensions: .html, .htm, .js, .jsx, .ts, .tsx
- Recommended entry: \`index.tsx\` or \`App.tsx\` for React, \`index.html\` for static

### File Limits
- Max bundle size: 10MB (free), 50MB (creator), 100MB (pro)
- Max files: 100 (free), 500 (creator), 2000 (pro)
- Keep bundles under 5MB for optimal load times

### Code Structure (React)
\`\`\`tsx
// Simple pattern - auto-rendered by runtime
export default function App() {
  return <div>Your vibe content</div>;
}

// With bridge access for host communication
export default function App({ bridge }) {
  React.useEffect(() => {
    bridge.ready({ capabilities: {} });
  }, []);
  return <div>Ready!</div>;
}
\`\`\`

### Available Globals
- \`React\` and \`ReactDOM\` (v18) are pre-loaded
- Standard Web APIs: fetch, Canvas, Web Audio, WebSocket, etc.
- \`window.vibecodrBridge\` for host communication

### Storage (Available)
NOTE: Storage APIs exist, but this app MUST NOT access \`localStorage\` or \`sessionStorage\` directly.
If the app needs persistence, prefer in-memory state or use \`IndexedDB\` via a small wrapper module.

### NPM Imports
Any npm package can be imported directly - the platform auto-resolves to esm.sh:
\`\`\`tsx
import confetti from "canvas-confetti";
import * as THREE from "three";
import { motion } from "framer-motion";
import { format } from "date-fns";
\`\`\`

### Forbidden Patterns
- NO direct API key embedding (use pulses for secrets)
- NO server-side code in vibes (client-only execution)
- NO direct \`localStorage\` / \`sessionStorage\` access
- NO files named: entry.tsx, _vibecodr_*, __VCSHIM*
- NO node_modules or package.json in bundle

### Performance Requirements
- Signal ready within 60 seconds (boot timeout)
- Minimize bundle size for faster loading
- Avoid blocking the main thread on load

## Output Format

Provide complete, production-ready code. Include:
1. Main component file (e.g., App.tsx or index.tsx)
2. Any additional component files
3. CSS/styles (inline or separate file)
4. Brief manifest suggestion if non-default settings needed

## Quality Standards
- Clean, readable TypeScript/TSX code
- Proper error handling
- Responsive design (works on mobile)
- Accessible (keyboard navigation, ARIA labels)
- No console errors or warnings`;

// -----------------------------------------------------------------------------
// Compact System Prompt (Token-Limited Contexts)
// -----------------------------------------------------------------------------

/**
 * Compact version of system prompt for token-limited contexts.
 * Use when context window is constrained.
 */
export const vibeSystemPromptCompact = `You create interactive React apps called "vibes" for Vibecodr. Output runs in a sandboxed browser iframe.

RULES:
- Entry: index.tsx or App.tsx (export default function)
- React/ReactDOM pre-loaded globally
- NPM imports work directly: \`import x from 'package-name'\`
- Max 5MB bundle, 100 files
- NO API keys, NO server code
- NO localStorage/sessionStorage access
- NO entry.tsx, NO _vibecodr_*, NO node_modules

TEMPLATE:
\`\`\`tsx
export default function App() {
  return <div>Your vibe</div>;
}
\`\`\`

Output clean, complete, production-ready TSX code.`;

// -----------------------------------------------------------------------------
// Prompt Builder
// -----------------------------------------------------------------------------

/**
 * Estimates token count for a prompt with better Unicode handling.
 * Uses byte length for more accurate estimation with multi-byte characters.
 *
 * Rationale: Character length underestimates tokens for Unicode text
 * (e.g., emoji, CJK characters) because tokenizers often split multi-byte
 * characters. Using byte length with ~3 bytes per token is more conservative.
 *
 * @param {string} text - Text to estimate
 * @returns {number} - Estimated token count
 */
const estimateTokens = (text) => {
  if (!text || typeof text !== "string") {
    return 0;
  }
  // Use byte length for better accuracy with Unicode
  // ~3-4 bytes per token on average, use conservative 3 for safety margin
  const byteLength = Buffer.byteLength(text, "utf8");
  return Math.ceil(byteLength / 3);
};

/**
 * Builds a complete prompt for vibe generation.
 * Combines system prompt with user prompt and optional constraints.
 *
 * @param {Object} options - Build options
 * @param {string} options.userPrompt - User's description of desired vibe
 * @param {Object} [options.constraints] - Additional constraints
 * @param {string} [options.constraints.tier='free'] - User tier (free/creator/pro)
 * @param {boolean} [options.constraints.compact=false] - Use compact prompt
 * @param {number} [options.constraints.maxTokens] - Max tokens for prompt
 * @param {string[]} [options.constraints.requiredFeatures] - Features to emphasize
 * @param {string} [options.constraints.style] - Visual style preference
 * @returns {Object} - Built prompt object
 * @throws {Error} - If prompt exceeds token limit
 */
export const buildVibePrompt = ({ userPrompt, constraints = {} }) => {
  const {
    tier = "free",
    compact = false,
    maxTokens = 8000,
    requiredFeatures = [],
    style = null,
  } = constraints;

  // Validate user prompt - must be non-empty string after trimming
  // This catches whitespace-only prompts like "   " which would pass a simple truthy check
  const trimmedPrompt = typeof userPrompt === "string" ? userPrompt.trim() : "";
  if (!trimmedPrompt) {
    throw createError({
      ...InvalidPrompt,
      message:
        "userPrompt is required and must be a non-empty string (not just whitespace)",
    });
  }

  // Select system prompt based on compact flag
  const systemPrompt = compact ? vibeSystemPromptCompact : vibeSystemPrompt;

  // Get tier-specific limits
  const limits = platformLimits[tier] || platformLimits.free;

  // Build tier context section
  const tierContext = compact
    ? ""
    : `\n\n## Your Tier Limits
- Max bundle: ${Math.round(limits.maxBundleSize / 1024 / 1024)}MB
- Max files: ${limits.maxFiles}
- Target bundle: <${Math.round(limits.targetBundleSize / 1024 / 1024)}MB for optimal performance`;

  // Build features section if specified
  const featuresSection =
    requiredFeatures.length > 0
      ? `\n\n## Required Features\n${requiredFeatures.map((f) => `- ${f}`).join("\n")}`
      : "";

  // Build style section if specified
  const styleSection = style
    ? `\n\n## Visual Style\nFollow this style guidance: ${style}`
    : "";

  // Construct user message
  const userMessage = `Create a vibe that: ${userPrompt}${featuresSection}${styleSection}`;

  // Combine full prompt
  const fullPrompt = `${systemPrompt}${tierContext}\n\n---\n\n${userMessage}`;

  // Check token limit
  const estimatedTokens = estimateTokens(fullPrompt);
  if (estimatedTokens > maxTokens) {
    throw createError({
      ...PromptTooLong,
      message: `Prompt exceeds token limit: ${estimatedTokens} estimated tokens (max: ${maxTokens})`,
    });
  }

  return {
    success: true,
    systemPrompt,
    userMessage,
    fullPrompt,
    metadata: {
      tier,
      compact,
      estimatedTokens,
      limits,
      hasFeatures: requiredFeatures.length > 0,
      hasStyle: !!style,
    },
  };
};

// -----------------------------------------------------------------------------
// Prompt Templates
// -----------------------------------------------------------------------------

/**
 * Pre-built prompt templates for common vibe types.
 * Use these as starting points for specific app categories.
 */
export const promptTemplates = {
  game: {
    prefix:
      "Create an interactive game vibe. Include score tracking, clear win/lose conditions, and intuitive controls.",
    requiredFeatures: [
      "Score display",
      "Reset/restart functionality",
      "Keyboard or touch controls",
    ],
  },
  visualization: {
    prefix:
      "Create a data visualization vibe. Focus on clarity, smooth animations, and responsive layout.",
    requiredFeatures: [
      "Clear data representation",
      "Smooth transitions",
      "Legend or labels where appropriate",
    ],
  },
  tool: {
    prefix:
      "Create a utility tool vibe. Prioritize usability, clear feedback, and efficient workflows.",
    requiredFeatures: [
      "Clear UI feedback",
      "Input validation",
      "Error handling with user-friendly messages",
    ],
  },
  creative: {
    prefix:
      "Create an artistic/creative vibe. Emphasize visual appeal, interactivity, and expressive possibilities.",
    requiredFeatures: [
      "Interactive elements",
      "Visually engaging design",
      "Smooth animations",
    ],
  },
};

/**
 * Builds a prompt using a pre-defined template.
 *
 * @param {string} templateName - Template key from PROMPT_TEMPLATES
 * @param {string} userPrompt - User's specific requirements
 * @param {Object} [constraints] - Additional constraints
 * @returns {Object} - Built prompt object
 */
export const buildFromTemplate = (
  templateName,
  userPrompt,
  constraints = {},
) => {
  const template = promptTemplates[templateName];

  if (!template) {
    return buildVibePrompt({ userPrompt, constraints });
  }

  const enhancedPrompt = `${template.prefix}\n\nSpecific requirements: ${userPrompt}`;

  return buildVibePrompt({
    userPrompt: enhancedPrompt,
    constraints: {
      ...constraints,
      requiredFeatures: [
        ...(constraints.requiredFeatures || []),
        ...template.requiredFeatures,
      ],
    },
  });
};
