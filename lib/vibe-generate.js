/**
 * Vibe Code Generation Module
 *
 * Orchestrates AI code generation for Vibecodr vibes.
 * Provides placeholder generation for development and
 * parsing utilities for AI responses.
 *
 * @module vibe-generate
 */

import { errorCauses, createError } from "error-causes";
import { buildVibePrompt } from "./vibe-prompt.js";

// -----------------------------------------------------------------------------
// Error Definitions
// -----------------------------------------------------------------------------

const [generateErrors] = errorCauses({
  GenerationFailed: {
    code: "GENERATION_FAILED",
    message: "Code generation failed",
  },
  ParseError: {
    code: "GENERATION_PARSE_ERROR",
    message: "Failed to parse generated code",
  },
});

const { GenerationFailed, ParseError } = generateErrors;

// -----------------------------------------------------------------------------
// Default Templates
// -----------------------------------------------------------------------------

/**
 * Default React App template.
 * Used as fallback or placeholder when generation is skipped.
 */
const defaultAppTemplate = `export default function App() {
  const [count, setCount] = React.useState(0);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{{TITLE}}</h1>
      <p style={styles.subtitle}>Your new vibe is ready!</p>
      <div style={styles.counter}>
        <button
          style={styles.button}
          onClick={() => setCount(c => c - 1)}
        >
          -
        </button>
        <span style={styles.count}>{count}</span>
        <button
          style={styles.button}
          onClick={() => setCount(c => c + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '20px',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '1.25rem',
    opacity: 0.9,
    marginBottom: '2rem',
  },
  counter: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  button: {
    fontSize: '1.5rem',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  count: {
    fontSize: '2rem',
    fontWeight: 'bold',
    minWidth: '3rem',
    textAlign: 'center',
  },
};
`;

/**
 * Minimal App template for simple vibes.
 */
const minimalAppTemplate = `export default function App() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#1a1a2e',
      color: 'white',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <h1>{{TITLE}}</h1>
    </div>
  );
}
`;

// -----------------------------------------------------------------------------
// Code Parsing
// -----------------------------------------------------------------------------

/**
 * Extracts code blocks from AI response text.
 * Handles markdown code fences with language tags.
 *
 * @param {string} text - Raw AI response text
 * @returns {Object[]} - Array of extracted code blocks
 */
const extractCodeBlocks = (text) => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  return [...text.matchAll(codeBlockRegex)].map((match) => ({
    language: match[1] ?? "text",
    content: match[2].trim(),
  }));
};

/**
 * Infers file path from code content and language.
 *
 * @param {Object} block - Code block object
 * @param {number} index - Block index for naming
 * @returns {string} - Inferred file path
 */
const inferFilePath = (block, index) => {
  const { language, content } = block;

  // Check for explicit file path comments
  const filePathMatch = content.match(/^\/\/\s*(?:file:|filename:)?\s*(\S+)/i);
  if (filePathMatch) {
    return filePathMatch[1];
  }

  // Infer from language
  const extensions = {
    tsx: ".tsx",
    typescript: ".tsx",
    ts: ".ts",
    jsx: ".jsx",
    javascript: ".js",
    js: ".js",
    css: ".css",
    html: ".html",
    json: ".json",
  };

  const ext = extensions[language.toLowerCase()] ?? ".txt";

  // Check if it looks like a component
  if (content.includes("export default function App")) {
    return "App.tsx";
  }
  if (content.includes("export default function")) {
    const componentMatch = content.match(/export default function\s+(\w+)/);
    if (componentMatch) {
      return `${componentMatch[1]}${ext}`;
    }
  }

  // Default naming
  if (index === 0 && (language === "tsx" || language === "jsx")) {
    return "App.tsx";
  }

  return `file${index + 1}${ext}`;
};

/**
 * Parses AI-generated response into file structure.
 * Handles single file, multiple files, and mixed content.
 *
 * @param {string} aiResponse - Raw AI response text
 * @returns {Object} - Parsed result with files array and entry point
 * @throws {Error} GENERATION_PARSE_ERROR if aiResponse is invalid, empty, or contains no relevant code blocks
 */
export const parseGeneratedCode = (aiResponse) => {
  if (!aiResponse) {
    throw createError({
      ...ParseError,
      message: "Invalid AI response: expected non-empty string",
    });
  }

  if (typeof aiResponse !== "string") {
    throw createError({
      ...ParseError,
      message: "Invalid AI response: expected non-empty string",
    });
  }

  const blocks = extractCodeBlocks(aiResponse);

  if (blocks.length === 0) {
    throw createError({
      ...ParseError,
      message: "No code blocks found in AI response",
    });
  }

  // Filter to relevant code types (tsx, jsx, ts, js, css, html)
  const relevantLanguages = [
    "tsx",
    "jsx",
    "ts",
    "js",
    "typescript",
    "javascript",
    "css",
    "html",
  ];

  const codeBlocks = blocks.filter((b) =>
    relevantLanguages.includes(b.language.toLowerCase())
      ? true
      : b.content.includes("export default"),
  );

  if (codeBlocks.length === 0) {
    throw createError({
      ...ParseError,
      message: "No relevant code blocks found (tsx, jsx, ts, js, css, html)",
    });
  }

  // Convert to files array
  const files = codeBlocks.map((block, index) => ({
    path: inferFilePath(block, index),
    content: block.content,
    language: block.language,
  }));

  // Determine entry point
  const entryOrder = [
    "App.tsx",
    "index.tsx",
    "App.jsx",
    "index.jsx",
    "index.html",
  ];

  const existingPaths = new Set(files.map((f) => f.path));
  const entry =
    entryOrder.find((candidate) => existingPaths.has(candidate)) ??
    files[0].path;

  return {
    files,
    entry,
    metadata: {
      totalBlocks: blocks.length,
      codeBlocks: codeBlocks.length,
      hasMultipleFiles: files.length > 1,
    },
  };
};

// -----------------------------------------------------------------------------
// Default Vibe Generator
// -----------------------------------------------------------------------------

/**
 * Creates a default vibe structure with template code.
 * Used when AI generation is skipped or as a fallback.
 *
 * @param {Object} options - Generation options
 * @param {string} options.title - Vibe title
 * @param {boolean} [options.minimal=false] - Use minimal template
 * @returns {Object} - Generated file structure
 */
export const createDefaultVibe = ({ title, minimal = false }) => {
  const safeTitle =
    typeof title === "string" && title.length > 0 ? title : "New Vibe";
  const template = minimal ? minimalAppTemplate : defaultAppTemplate;
  const content = template.replace(/\{\{TITLE\}\}/g, safeTitle);

  const files = [
    {
      path: "App.tsx",
      content,
    },
  ];

  return {
    files,
    entry: "App.tsx",
    metadata: {
      generated: false,
      template: minimal ? "minimal" : "default",
      title: safeTitle,
    },
  };
};

// -----------------------------------------------------------------------------
// Code Generation Orchestrator
// -----------------------------------------------------------------------------

/**
 * Generates vibe code from a prompt.
 *
 * NOTE: This is a placeholder implementation. In production, this would:
 * 1. Call an AI API (Claude, GPT, etc.) with the built prompt
 * 2. Parse the response into file structure
 * 3. Validate the generated code
 *
 * For now, returns a template-based result for testing the pipeline.
 *
 * @param {Object} options - Generation options
 * @param {string} options.prompt - User prompt describing the vibe
 * @param {boolean} [options.verbose=false] - Enable verbose logging
 * @param {Function} [options.logger] - Custom logger function
 * @param {Function} [options.generateFn] - AI generation function (for injection)
 * @returns {Promise<Object>} - Generated file structure
 * @throws {Error} GENERATION_FAILED if generateFn is provided and fails during AI code generation
 */
export const generateVibeCode = async ({
  prompt,
  verbose = false,
  logger = console.log,
  generateFn = null,
}) => {
  const log = verbose ? logger : () => {};

  const preview =
    typeof prompt === "string"
      ? `${prompt.slice(0, 50)}...`
      : `${String(prompt).slice(0, 50)}...`;

  log(`Generating vibe code for prompt: "${preview}"`);

  // Build wrapped prompt using platform constraints (vibe-prompt)
  // This is the prompt we send to the AI model.
  const wrapped = buildVibePrompt({ userPrompt: prompt });
  const wrappedPrompt = wrapped.fullPrompt;

  // If a generation function is provided (AI API), use it
  if (generateFn && typeof generateFn === "function") {
    try {
      log("Calling AI generation function...");
      const aiResponse = await generateFn(wrappedPrompt);
      log("Parsing AI response...");
      const result = parseGeneratedCode(aiResponse);
      log(`Generated ${result.files.length} file(s)`);
      return {
        ...result,
        metadata: {
          ...result.metadata,
          generated: true,
          prompt: typeof prompt === "string" ? prompt.slice(0, 100) : "",
          wrappedPromptEstimatedTokens: wrapped.metadata?.estimatedTokens,
        },
      };
    } catch (error) {
      // If generation fails, fall through to default
      log(`AI generation failed: ${error.message}`);
      throw createError({
        ...GenerationFailed,
        message: `AI code generation failed: ${error.message}`,
        cause: error,
      });
    }
  }

  // Placeholder: Return default template
  log("Using default template (AI generation not configured)");

  // Extract a title from the prompt
  const titleMatch = prompt.match(
    /(?:create|make|build)\s+(?:a\s+)?(.+?)(?:\s+that|\s+with|\.|$)/i,
  );
  const inferredTitle = titleMatch
    ? titleMatch[1].trim().replace(/^vibe\s+/i, "")
    : "New Vibe";

  const result = createDefaultVibe({
    title: inferredTitle.charAt(0).toUpperCase() + inferredTitle.slice(1),
  });

  return {
    ...result,
    metadata: {
      ...result.metadata,
      placeholder: true,
      prompt: prompt.slice(0, 100),
    },
  };
};

// -----------------------------------------------------------------------------
// Validation Helpers
// -----------------------------------------------------------------------------

/**
 * Validates generated files against platform constraints.
 *
 * @param {Object[]} files - Array of file objects
 * @returns {Object} - Validation result with warnings
 */
export const validateGeneratedFiles = (files) => {
  const fileCountError =
    files.length > 100
      ? [`Too many files: ${files.length} (max 100 for free tier)`]
      : [];

  // Check for forbidden patterns
  const forbiddenPatterns = [
    /^entry\.tsx$/,
    /^_vibecodr_/,
    /^__VCSHIM/,
    /^node_modules\//,
    /^package\.json$/,
    /^\.env/,
  ];

  const forbiddenPatternErrors = files
    .filter((file) =>
      forbiddenPatterns.some((pattern) => pattern.test(file.path)),
    )
    .map((file) => `Forbidden file pattern: ${file.path}`);

  const apiKeyWarnings = files
    .filter((file) =>
      file.content.match(
        /(?:api[_-]?key|secret|password)\s*[:=]\s*['"][^'"]+['"]/i,
      ),
    )
    .map((file) => `Possible API key detected in ${file.path}`);

  // Calculate total size
  const totalSize = files.reduce((sum, f) => sum + f.content.length, 0);
  const sizeWarnings =
    totalSize > 5 * 1024 * 1024
      ? [
          `Bundle size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds recommended 5MB`,
        ]
      : [];

  const warnings = [...apiKeyWarnings, ...sizeWarnings];
  const errors = [...fileCountError, ...forbiddenPatternErrors];

  return {
    valid: errors.length === 0,
    warnings,
    errors,
    stats: {
      fileCount: files.length,
      totalSize,
      totalSizeFormatted: `${(totalSize / 1024).toFixed(2)}KB`,
    },
  };
};
