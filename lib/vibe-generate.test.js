import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import {
  parseGeneratedCode,
  createDefaultVibe,
  generateVibeCode,
  validateGeneratedFiles,
} from "./vibe-generate.js";

// -----------------------------------------------------------------------------
// Sample AI Responses for Testing
// -----------------------------------------------------------------------------

const SAMPLE_SINGLE_FILE_RESPONSE = `
Here's a simple counter app:

\`\`\`tsx
export default function App() {
  const [count, setCount] = React.useState(0);
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
\`\`\`

This creates a simple counter with increment functionality.
`;

const SAMPLE_MULTI_FILE_RESPONSE = `
I'll create a counter app with separate styles:

\`\`\`tsx
// file: App.tsx
export default function App() {
  const [count, setCount] = React.useState(0);
  return (
    <div className="container">
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
\`\`\`

\`\`\`css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}
\`\`\`

This creates a styled counter app.
`;

const SAMPLE_NAMED_COMPONENT_RESPONSE = `
\`\`\`tsx
export default function Counter() {
  const [count, setCount] = React.useState(0);
  return <div>{count}</div>;
}
\`\`\`
`;

// -----------------------------------------------------------------------------
// parseGeneratedCode Tests
// -----------------------------------------------------------------------------

describe("parseGeneratedCode", () => {
  test("parses single file response", () => {
    const result = parseGeneratedCode(SAMPLE_SINGLE_FILE_RESPONSE);

    assert({
      given: "single file AI response",
      should: "extract one file",
      actual: result.files.length,
      expected: 1,
    });

    assert({
      given: "single file AI response",
      should: "set App.tsx as entry",
      actual: result.entry,
      expected: "App.tsx",
    });
  });

  test("parses multi-file response", () => {
    const result = parseGeneratedCode(SAMPLE_MULTI_FILE_RESPONSE);

    assert({
      given: "multi-file AI response",
      should: "extract two files",
      actual: result.files.length,
      expected: 2,
    });

    assert({
      given: "multi-file AI response",
      should: "include CSS file",
      actual: result.files.some((f) => f.path.endsWith(".css")),
      expected: true,
    });

    assert({
      given: "multi-file AI response",
      should: "set hasMultipleFiles in metadata",
      actual: result.metadata?.hasMultipleFiles,
      expected: true,
    });
  });

  test("infers component name from export", () => {
    const result = parseGeneratedCode(SAMPLE_NAMED_COMPONENT_RESPONSE);

    assert({
      given: "named component export",
      should: "infer Counter.tsx filename",
      actual: result.files[0].path,
      expected: "Counter.tsx",
    });
  });

  test("handles empty response", () => {
    let error = null;
    try {
      parseGeneratedCode("");
    } catch (e) {
      error = e;
    }

    assert({
      given: "empty response",
      should: "throw GENERATION_PARSE_ERROR",
      actual: error?.cause?.code,
      expected: "GENERATION_PARSE_ERROR",
    });
  });

  test("handles response with no code blocks", () => {
    let error = null;
    try {
      parseGeneratedCode("This is just text with no code blocks.");
    } catch (e) {
      error = e;
    }

    assert({
      given: "response without code blocks",
      should: "throw GENERATION_PARSE_ERROR",
      actual: error?.cause?.code,
      expected: "GENERATION_PARSE_ERROR",
    });
  });

  test("handles null response", () => {
    let error = null;
    try {
      parseGeneratedCode(null);
    } catch (e) {
      error = e;
    }

    assert({
      given: "null response",
      should: "throw GENERATION_PARSE_ERROR",
      actual: error?.cause?.code,
      expected: "GENERATION_PARSE_ERROR",
    });
  });

  test("prefers App.tsx as entry point", () => {
    const responseWithIndex = `
\`\`\`tsx
// file: index.tsx
import App from './App';
export default App;
\`\`\`

\`\`\`tsx
export default function App() {
  return <div>Hello</div>;
}
\`\`\`
`;

    const result = parseGeneratedCode(responseWithIndex);

    assert({
      given: "response with both index.tsx and App.tsx",
      should: "prefer App.tsx as entry",
      actual: result.entry,
      expected: "App.tsx",
    });
  });

  test("includes metadata about parsing", () => {
    const result = parseGeneratedCode(SAMPLE_MULTI_FILE_RESPONSE);

    assert({
      given: "parsed response",
      should: "include total blocks count",
      actual: result.metadata?.totalBlocks,
      expected: 2,
    });

    assert({
      given: "parsed response",
      should: "include code blocks count",
      actual: result.metadata?.codeBlocks,
      expected: 2,
    });
  });
});

// -----------------------------------------------------------------------------
// createDefaultVibe Tests
// -----------------------------------------------------------------------------

describe("createDefaultVibe", () => {
  test("creates default template with title", () => {
    const result = createDefaultVibe({ title: "My Counter" });

    assert({
      given: "title parameter",
      should: "include title in content",
      actual: result.files[0].content.includes("My Counter"),
      expected: true,
    });
  });

  test("sets App.tsx as entry", () => {
    const result = createDefaultVibe({ title: "Test" });

    assert({
      given: "default vibe creation",
      should: "set App.tsx as entry",
      actual: result.entry,
      expected: "App.tsx",
    });
  });

  test("creates single file", () => {
    const result = createDefaultVibe({ title: "Test" });

    assert({
      given: "default vibe creation",
      should: "create one file",
      actual: result.files.length,
      expected: 1,
    });
  });

  test("handles missing title", () => {
    const result = createDefaultVibe({});

    assert({
      given: "missing title",
      should: "use default title",
      actual: result.files[0].content.includes("New Vibe"),
      expected: true,
    });
  });

  test("creates minimal template when requested", () => {
    const defaultResult = createDefaultVibe({ title: "Test" });
    const minimalResult = createDefaultVibe({ title: "Test", minimal: true });

    assert({
      given: "minimal flag",
      should: "create shorter content",
      actual:
        minimalResult.files[0].content.length <
        defaultResult.files[0].content.length,
      expected: true,
    });

    assert({
      given: "minimal flag",
      should: "set template type in metadata",
      actual: minimalResult.metadata?.template,
      expected: "minimal",
    });
  });

  test("includes metadata about generation", () => {
    const result = createDefaultVibe({ title: "Test Vibe" });

    assert({
      given: "default vibe creation",
      should: "set generated false in metadata",
      actual: result.metadata?.generated,
      expected: false,
    });

    assert({
      given: "default vibe creation",
      should: "include title in metadata",
      actual: result.metadata?.title,
      expected: "Test Vibe",
    });
  });
});

// -----------------------------------------------------------------------------
// generateVibeCode Tests
// -----------------------------------------------------------------------------

describe("generateVibeCode", () => {
  test("returns default template without generateFn", async () => {
    const result = await generateVibeCode({
      prompt: "Create a counter app",
    });

    assert({
      given: "no generateFn provided",
      should: "return placeholder result",
      actual: result.metadata?.placeholder,
      expected: true,
    });

    assert({
      given: "no generateFn provided",
      should: "include files array",
      actual: result.files.length > 0,
      expected: true,
    });
  });

  test("infers title from prompt", async () => {
    const result = await generateVibeCode({
      prompt: "Create a bouncing ball animation",
    });

    assert({
      given: "descriptive prompt",
      should: "infer title from prompt",
      // Title is capitalized and inserted into template
      actual: result.files[0].content.includes("Bouncing ball animation"),
      expected: true,
    });
  });

  test("uses provided generateFn", async () => {
    const mockGenerateFn = async () => SAMPLE_SINGLE_FILE_RESPONSE;

    const result = await generateVibeCode({
      prompt: "Create something",
      generateFn: mockGenerateFn,
    });

    assert({
      given: "generateFn provided",
      should: "set generated true in metadata",
      actual: result.metadata?.generated,
      expected: true,
    });
  });

  test("handles generateFn errors", async () => {
    const failingGenerateFn = async () => {
      throw new Error("API error");
    };

    let error = null;
    try {
      await generateVibeCode({
        prompt: "Create something",
        generateFn: failingGenerateFn,
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "generateFn that throws",
      should: "throw GENERATION_FAILED",
      actual: error?.cause?.code,
      expected: "GENERATION_FAILED",
    });
  });

  test("supports verbose logging", async () => {
    const logs = [];
    const mockLogger = (msg) => logs.push(msg);

    await generateVibeCode({
      prompt: "Create an app",
      verbose: true,
      logger: mockLogger,
    });

    assert({
      given: "verbose flag",
      should: "log messages",
      actual: logs.length > 0,
      expected: true,
    });
  });

  test("includes prompt in metadata", async () => {
    const result = await generateVibeCode({
      prompt: "Create a very specific app with unique features",
    });

    assert({
      given: "prompt provided",
      should: "include truncated prompt in metadata",
      actual: result.metadata?.prompt?.includes("very specific"),
      expected: true,
    });
  });

  test("handles non-string prompt input gracefully", async () => {
    // The function accesses prompt.slice(), so non-string input will cause an error
    // This tests the edge case of passing invalid prompt types
    let error = null;
    try {
      await generateVibeCode({
        prompt: 12345, // number instead of string
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "non-string prompt (number)",
      should: "throw an error",
      actual: error !== null,
      expected: true,
    });
  });

  test("handles null prompt input", async () => {
    let error = null;
    try {
      await generateVibeCode({
        prompt: null,
      });
    } catch (e) {
      error = e;
    }

    assert({
      given: "null prompt",
      should: "throw an error",
      actual: error !== null,
      expected: true,
    });
  });
});

// -----------------------------------------------------------------------------
// validateGeneratedFiles Tests
// -----------------------------------------------------------------------------

describe("validateGeneratedFiles", () => {
  test("validates clean files", () => {
    const files = [
      { path: "App.tsx", content: "export default function App() {}" },
      { path: "styles.css", content: ".container { display: flex; }" },
    ];

    const result = validateGeneratedFiles(files);

    assert({
      given: "clean files",
      should: "return valid true",
      actual: result.valid,
      expected: true,
    });

    assert({
      given: "clean files",
      should: "have no errors",
      actual: result.errors.length,
      expected: 0,
    });
  });

  test("detects forbidden file patterns", () => {
    const files = [
      { path: "entry.tsx", content: "export default function App() {}" },
    ];

    const result = validateGeneratedFiles(files);

    assert({
      given: "forbidden entry.tsx file",
      should: "return valid false",
      actual: result.valid,
      expected: false,
    });

    assert({
      given: "forbidden entry.tsx file",
      should: "include error about pattern",
      actual: result.errors.some((e) => e.includes("entry.tsx")),
      expected: true,
    });
  });

  test("detects _vibecodr_ prefix", () => {
    const files = [{ path: "_vibecodr_config.json", content: "{}" }];

    const result = validateGeneratedFiles(files);

    assert({
      given: "_vibecodr_ prefixed file",
      should: "return valid false",
      actual: result.valid,
      expected: false,
    });
  });

  test("detects node_modules", () => {
    const files = [
      { path: "node_modules/react/index.js", content: "module.exports = {}" },
    ];

    const result = validateGeneratedFiles(files);

    assert({
      given: "node_modules file",
      should: "return valid false",
      actual: result.valid,
      expected: false,
    });
  });

  test("warns about potential API keys", () => {
    const files = [
      {
        path: "App.tsx",
        content: `const api_key = "sk-abc123xyz";`,
      },
    ];

    const result = validateGeneratedFiles(files);

    assert({
      given: "file with API key pattern",
      should: "include warning",
      actual: result.warnings.some((w) => w.includes("API key")),
      expected: true,
    });
  });

  test("warns about large bundles", () => {
    const largeContent = "x".repeat(6 * 1024 * 1024); // 6MB
    const files = [{ path: "App.tsx", content: largeContent }];

    const result = validateGeneratedFiles(files);

    assert({
      given: "bundle over 5MB",
      should: "include size warning",
      // Warning message mentions "Bundle size" (capitalized)
      actual: result.warnings.some((w) => w.includes("Bundle size")),
      expected: true,
    });
  });

  test("calculates stats correctly", () => {
    const files = [
      { path: "App.tsx", content: "x".repeat(1000) },
      { path: "styles.css", content: "y".repeat(500) },
    ];

    const result = validateGeneratedFiles(files);

    assert({
      given: "multiple files",
      should: "count files correctly",
      actual: result.stats.fileCount,
      expected: 2,
    });

    assert({
      given: "multiple files",
      should: "sum total size correctly",
      actual: result.stats.totalSize,
      expected: 1500,
    });
  });

  test("detects too many files", () => {
    const files = Array.from({ length: 101 }, (_, i) => ({
      path: `file${i}.tsx`,
      content: "export default () => null;",
    }));

    const result = validateGeneratedFiles(files);

    assert({
      given: "over 100 files",
      should: "return valid false",
      actual: result.valid,
      expected: false,
    });

    assert({
      given: "over 100 files",
      should: "include file count error",
      actual: result.errors.some((e) => e.includes("Too many files")),
      expected: true,
    });
  });
});
