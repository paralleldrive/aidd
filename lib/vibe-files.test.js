/**
 * Tests for vibe-files module.
 * Uses Riteway assertion format with Vitest.
 */

import { assert } from "riteway/vitest";
import { describe, test } from "vitest";

import {
  validateFileName,
  validateBundle,
  createFileEntry,
  collectGeneratedFiles,
  calculateBundleSize,
  vibeFileErrors,
  defaults,
} from "./vibe-files.js";

// -----------------------------------------------------------------------------
// validateFileName Tests
// -----------------------------------------------------------------------------

describe("validateFileName", () => {
  test("rejects forbidden file names - entry.tsx", () => {
    assert({
      given: "entry.tsx (reserved by Vibecodr runtime)",
      should: "return invalid",
      actual: validateFileName("entry.tsx").valid,
      expected: false,
    });
  });

  test("rejects forbidden file names - _vibecodr__ prefix", () => {
    assert({
      given: "a file starting with _vibecodr__",
      should: "return invalid",
      actual: validateFileName("_vibecodr__config.js").valid,
      expected: false,
    });
  });

  test("rejects forbidden file names - __VCSHIM prefix", () => {
    assert({
      given: "a file starting with __VCSHIM",
      should: "return invalid",
      actual: validateFileName("__VCSHIM_runtime.js").valid,
      expected: false,
    });
  });

  test("rejects forbidden file names - node_modules path", () => {
    assert({
      given: "a path inside node_modules",
      should: "return invalid",
      actual: validateFileName("node_modules/react/index.js").valid,
      expected: false,
    });
  });

  test("rejects forbidden file names - package.json", () => {
    assert({
      given: "package.json",
      should: "return invalid",
      actual: validateFileName("package.json").valid,
      expected: false,
    });
  });

  test("rejects forbidden file names - package-lock.json", () => {
    assert({
      given: "package-lock.json",
      should: "return invalid",
      actual: validateFileName("package-lock.json").valid,
      expected: false,
    });
  });

  test("rejects forbidden file names - .env files", () => {
    assert({
      given: ".env",
      should: "return invalid",
      actual: validateFileName(".env").valid,
      expected: false,
    });

    assert({
      given: ".env.local",
      should: "return invalid",
      actual: validateFileName(".env.local").valid,
      expected: false,
    });

    assert({
      given: ".env.production",
      should: "return invalid",
      actual: validateFileName(".env.production").valid,
      expected: false,
    });
  });

  test("accepts valid file names", () => {
    assert({
      given: "App.tsx",
      should: "return valid",
      actual: validateFileName("App.tsx").valid,
      expected: true,
    });
  });

  test("accepts valid file names - various extensions", () => {
    const validFiles = [
      "index.html",
      "styles.css",
      "main.js",
      "utils.ts",
      "components/Button.tsx",
      "assets/logo.png",
      "README.md",
    ];

    for (const file of validFiles) {
      assert({
        given: `valid file "${file}"`,
        should: "return valid",
        actual: validateFileName(file).valid,
        expected: true,
      });
    }
  });

  test("accepts entry.ts (not entry.tsx)", () => {
    assert({
      given: "entry.ts (not the reserved entry.tsx)",
      should: "return valid",
      actual: validateFileName("entry.ts").valid,
      expected: true,
    });
  });

  test("rejects empty file names", () => {
    assert({
      given: "empty string",
      should: "return invalid",
      actual: validateFileName("").valid,
      expected: false,
    });
  });

  test("provides reason for invalid files", () => {
    const result = validateFileName("entry.tsx");

    assert({
      given: "invalid file name",
      should: "include reason in result",
      actual: typeof result.reason === "string" && result.reason.length > 0,
      expected: true,
    });
  });
});

// -----------------------------------------------------------------------------
// validateBundle Tests
// -----------------------------------------------------------------------------

describe("validateBundle", () => {
  test("validates a valid bundle", () => {
    const files = [
      { path: "App.tsx", content: "export const App = () => <div />" },
      { path: "index.html", content: "<html></html>" },
    ];

    const result = validateBundle(files);

    assert({
      given: "a bundle with valid files under limits",
      should: "return valid true",
      actual: result.valid,
      expected: true,
    });
  });

  test("calculates total size correctly", () => {
    const files = [
      { path: "a.txt", content: "hello" }, // 5 bytes
      { path: "b.txt", content: "world" }, // 5 bytes
    ];

    const result = validateBundle(files);

    assert({
      given: "files with known content sizes",
      should: "return correct total size",
      actual: result.totalSize,
      expected: 10,
    });
  });

  test("returns file count", () => {
    const files = [
      { path: "a.txt", content: "a" },
      { path: "b.txt", content: "b" },
      { path: "c.txt", content: "c" },
    ];

    const result = validateBundle(files);

    assert({
      given: "3 files",
      should: "return fileCount of 3",
      actual: result.fileCount,
      expected: 3,
    });
  });

  test("rejects bundles over size limit", () => {
    // Create files totaling > 5MB
    const largeContent = "x".repeat(3 * 1024 * 1024); // 3MB each
    const files = [
      { path: "big1.txt", content: largeContent },
      { path: "big2.txt", content: largeContent },
    ];

    let thrown = false;
    let errorCode = null;

    try {
      validateBundle(files);
    } catch (error) {
      thrown = true;
      // error-causes stores code in error.cause.code
      errorCode = error.cause?.code;
    }

    assert({
      given: "files totaling > 5MB",
      should: "throw an error",
      actual: thrown,
      expected: true,
    });

    assert({
      given: "files totaling > 5MB",
      should: "throw BUNDLE_TOO_LARGE error",
      actual: errorCode,
      expected: "BUNDLE_TOO_LARGE",
    });
  });

  test("rejects bundles with custom size limit", () => {
    const files = [{ path: "test.txt", content: "x".repeat(1000) }];

    let thrown = false;

    try {
      validateBundle(files, { maxSize: 500 });
    } catch {
      thrown = true;
    }

    assert({
      given: "files exceeding custom maxSize of 500 bytes",
      should: "throw an error",
      actual: thrown,
      expected: true,
    });
  });

  test("rejects bundles with too many files", () => {
    // Create > 100 files
    const files = Array.from({ length: 101 }, (_, i) => ({
      path: `file${i}.txt`,
      content: "x",
    }));

    let thrown = false;
    let errorCode = null;

    try {
      validateBundle(files);
    } catch (error) {
      thrown = true;
      // error-causes stores code in error.cause.code
      errorCode = error.cause?.code;
    }

    assert({
      given: "> 100 files",
      should: "throw an error",
      actual: thrown,
      expected: true,
    });

    assert({
      given: "> 100 files",
      should: "throw TOO_MANY_FILES error",
      actual: errorCode,
      expected: "TOO_MANY_FILES",
    });
  });

  test("rejects bundles with custom file limit", () => {
    const files = Array.from({ length: 11 }, (_, i) => ({
      path: `file${i}.txt`,
      content: "x",
    }));

    let thrown = false;

    try {
      validateBundle(files, { maxFiles: 10 });
    } catch {
      thrown = true;
    }

    assert({
      given: "11 files with maxFiles of 10",
      should: "throw an error",
      actual: thrown,
      expected: true,
    });
  });

  test("rejects bundles containing forbidden file names", () => {
    const files = [
      { path: "App.tsx", content: "valid" },
      { path: "entry.tsx", content: "forbidden" },
    ];

    let thrown = false;
    let errorCode = null;

    try {
      validateBundle(files);
    } catch (error) {
      thrown = true;
      // error-causes stores code in error.cause.code
      errorCode = error.cause?.code;
    }

    assert({
      given: "bundle containing entry.tsx",
      should: "throw an error",
      actual: thrown,
      expected: true,
    });

    assert({
      given: "bundle containing entry.tsx",
      should: "throw FORBIDDEN_FILE_NAME error",
      actual: errorCode,
      expected: "FORBIDDEN_FILE_NAME",
    });
  });

  test("accepts empty bundle", () => {
    const result = validateBundle([]);

    assert({
      given: "empty array of files",
      should: "return valid with zero counts",
      actual: result,
      expected: { valid: true, totalSize: 0, fileCount: 0 },
    });
  });

  test("uses size property if provided", () => {
    const files = [{ path: "test.txt", content: "short", size: 1000 }];

    const result = validateBundle(files);

    assert({
      given: "file with explicit size property",
      should: "use provided size instead of content length",
      actual: result.totalSize,
      expected: 1000,
    });
  });
});

// -----------------------------------------------------------------------------
// createFileEntry Tests
// -----------------------------------------------------------------------------

describe("createFileEntry", () => {
  test("creates file entry with correct path", () => {
    const entry = createFileEntry({ path: "App.tsx", content: "content" });

    assert({
      given: "path and content",
      should: "preserve the path",
      actual: entry.path,
      expected: "App.tsx",
    });
  });

  test("calculates size from string content", () => {
    const entry = createFileEntry({ path: "test.txt", content: "hello" });

    assert({
      given: "string content 'hello'",
      should: "calculate size as 5",
      actual: entry.size,
      expected: 5,
    });
  });

  test("calculates size from Buffer content", () => {
    const buffer = Buffer.from("hello");
    const entry = createFileEntry({ path: "test.bin", content: buffer });

    assert({
      given: "Buffer content",
      should: "calculate size from buffer length",
      actual: entry.size,
      expected: 5,
    });
  });

  test("handles UTF-8 characters correctly", () => {
    const entry = createFileEntry({ path: "test.txt", content: "héllo" });

    assert({
      given: "UTF-8 content with accented character",
      should: "calculate byte size correctly (6 bytes for héllo)",
      actual: entry.size,
      expected: 6, // 'é' is 2 bytes in UTF-8
    });
  });

  test("detects text type for string content", () => {
    const entry = createFileEntry({
      path: "test.txt",
      content: "text content",
    });

    assert({
      given: "string content",
      should: "set type to text",
      actual: entry.type,
      expected: "text",
    });
  });

  test("detects text type for text Buffer", () => {
    const buffer = Buffer.from("text content");
    const entry = createFileEntry({ path: "test.txt", content: buffer });

    assert({
      given: "Buffer without null bytes",
      should: "set type to text",
      actual: entry.type,
      expected: "text",
    });
  });

  test("detects binary type for Buffer with null bytes", () => {
    const buffer = Buffer.from([0x00, 0x01, 0x02, 0x00]);
    const entry = createFileEntry({ path: "test.bin", content: buffer });

    assert({
      given: "Buffer with null bytes",
      should: "set type to binary",
      actual: entry.type,
      expected: "binary",
    });
  });

  test("detects binary in middle of file (not just header)", () => {
    // Create a buffer with text header, null bytes in middle
    const textHeader = Buffer.from("This is a text header\n".repeat(500));
    const binaryMiddle = Buffer.alloc(1000, 0); // null bytes
    const textFooter = Buffer.from("This is a text footer\n".repeat(100));
    const buffer = Buffer.concat([textHeader, binaryMiddle, textFooter]);

    const entry = createFileEntry({ path: "test.bin", content: buffer });

    assert({
      given: "Buffer with binary content in middle (text header)",
      should: "detect as binary by sampling middle section",
      actual: entry.type,
      expected: "binary",
    });
  });

  test("detects binary at end of file", () => {
    // Create a buffer with text at start, null bytes at end
    const textStart = Buffer.from("Normal text content\n".repeat(1000));
    const binaryEnd = Buffer.alloc(5000, 0); // null bytes at end
    const buffer = Buffer.concat([textStart, binaryEnd]);

    const entry = createFileEntry({ path: "test.bin", content: buffer });

    assert({
      given: "Buffer with binary content at end only",
      should: "detect as binary by sampling end section",
      actual: entry.type,
      expected: "binary",
    });
  });

  test("detects text for pure text content", () => {
    // Large text-only file
    const textContent = "Hello world! This is pure text.\n".repeat(1000);
    const buffer = Buffer.from(textContent);

    const entry = createFileEntry({ path: "test.txt", content: buffer });

    assert({
      given: "Large text-only buffer",
      should: "detect as text",
      actual: entry.type,
      expected: "text",
    });
  });

  test("preserves content in entry", () => {
    const content = "const x = 1;";
    const entry = createFileEntry({ path: "test.js", content });

    assert({
      given: "content string",
      should: "preserve content in entry",
      actual: entry.content,
      expected: content,
    });
  });
});

// -----------------------------------------------------------------------------
// collectGeneratedFiles Tests
// -----------------------------------------------------------------------------

describe("collectGeneratedFiles", () => {
  test("handles null input", () => {
    assert({
      given: "null input",
      should: "return empty array",
      actual: collectGeneratedFiles(null),
      expected: [],
    });
  });

  test("handles undefined input", () => {
    assert({
      given: "undefined input",
      should: "return empty array",
      actual: collectGeneratedFiles(undefined),
      expected: [],
    });
  });

  test("handles array of file objects", () => {
    const input = [
      { path: "App.tsx", content: "code1" },
      { path: "index.html", content: "code2" },
    ];

    const result = collectGeneratedFiles(input);

    assert({
      given: "array of file objects",
      should: "return same number of entries",
      actual: result.length,
      expected: 2,
    });

    assert({
      given: "array of file objects",
      should: "create proper file entries with size",
      actual: result[0].size,
      expected: 5,
    });
  });

  test("handles object with files array", () => {
    const input = {
      files: [
        { path: "App.tsx", content: "code" },
        { path: "style.css", content: "css" },
      ],
    };

    const result = collectGeneratedFiles(input);

    assert({
      given: "object with files array",
      should: "extract files from the array",
      actual: result.length,
      expected: 2,
    });

    assert({
      given: "object with files array",
      should: "preserve file paths",
      actual: result.map((f) => f.path),
      expected: ["App.tsx", "style.css"],
    });
  });

  test("handles single file object", () => {
    const input = { path: "App.tsx", content: "single file content" };

    const result = collectGeneratedFiles(input);

    assert({
      given: "single file object with path and content",
      should: "return array with one entry",
      actual: result.length,
      expected: 1,
    });

    assert({
      given: "single file object",
      should: "preserve path",
      actual: result[0].path,
      expected: "App.tsx",
    });
  });

  test("handles string with code block markers", () => {
    const input = `Here is the code:
\`\`\`App.tsx
export const App = () => <div>Hello</div>
\`\`\`
`;

    const result = collectGeneratedFiles(input);

    assert({
      given: "string with code block and filename",
      should: "extract the file",
      actual: result.length,
      expected: 1,
    });

    assert({
      given: "string with code block",
      should: "use filename from code block",
      actual: result[0].path,
      expected: "App.tsx",
    });

    assert({
      given: "string with code block",
      should: "extract content correctly",
      actual: result[0].content,
      expected: "export const App = () => <div>Hello</div>",
    });
  });

  test("handles multiple code blocks", () => {
    const input = `
\`\`\`App.tsx
component code
\`\`\`

\`\`\`styles.css
css code
\`\`\`
`;

    const result = collectGeneratedFiles(input);

    assert({
      given: "string with multiple code blocks",
      should: "extract all files",
      actual: result.length,
      expected: 2,
    });

    assert({
      given: "string with multiple code blocks",
      should: "preserve paths for all files",
      actual: result.map((f) => f.path),
      expected: ["App.tsx", "styles.css"],
    });
  });

  test("ignores generic code blocks without filenames", () => {
    const input = `
\`\`\`javascript
// This is just example code
\`\`\`

\`\`\`App.tsx
real file content
\`\`\`
`;

    const result = collectGeneratedFiles(input);

    assert({
      given: "string with generic code block and named code block",
      should: "only extract named file",
      actual: result.length,
      expected: 1,
    });

    assert({
      given: "string with mixed code blocks",
      should: "extract the named file",
      actual: result[0].path,
      expected: "App.tsx",
    });
  });

  test("handles empty object", () => {
    assert({
      given: "empty object",
      should: "return empty array",
      actual: collectGeneratedFiles({}),
      expected: [],
    });
  });

  test("handles string without code blocks", () => {
    assert({
      given: "plain string without markers",
      should: "return empty array",
      actual: collectGeneratedFiles("just plain text"),
      expected: [],
    });
  });
});

// -----------------------------------------------------------------------------
// calculateBundleSize Tests
// -----------------------------------------------------------------------------

describe("calculateBundleSize", () => {
  test("calculates total size", () => {
    const files = [
      { path: "a.txt", content: "hello" }, // 5 bytes
      { path: "b.txt", content: "world!" }, // 6 bytes
    ];

    const result = calculateBundleSize(files);

    assert({
      given: "files with content",
      should: "sum up total size",
      actual: result.totalSize,
      expected: 11,
    });
  });

  test("uses size property if available", () => {
    const files = [
      { path: "a.txt", size: 100 },
      { path: "b.txt", size: 200 },
    ];

    const result = calculateBundleSize(files);

    assert({
      given: "files with size property",
      should: "use provided sizes",
      actual: result.totalSize,
      expected: 300,
    });
  });

  test("returns file count", () => {
    const files = [
      { path: "a.txt", size: 1 },
      { path: "b.txt", size: 1 },
      { path: "c.txt", size: 1 },
    ];

    const result = calculateBundleSize(files);

    assert({
      given: "3 files",
      should: "return fileCount of 3",
      actual: result.fileCount,
      expected: 3,
    });
  });

  test("provides breakdown by extension", () => {
    const files = [
      { path: "app.tsx", size: 100 },
      { path: "utils.tsx", size: 50 },
      { path: "styles.css", size: 200 },
    ];

    const result = calculateBundleSize(files);

    assert({
      given: "files with different extensions",
      should: "group sizes by extension",
      actual: result.breakdown[".tsx"],
      expected: 150,
    });

    assert({
      given: "files with different extensions",
      should: "include all extensions",
      actual: result.breakdown[".css"],
      expected: 200,
    });
  });

  test("handles files without extension", () => {
    const files = [
      { path: "Makefile", size: 100 },
      { path: "Dockerfile", size: 50 },
    ];

    const result = calculateBundleSize(files);

    assert({
      given: "files without extension",
      should: "group under (no ext)",
      actual: result.breakdown["(no ext)"],
      expected: 150,
    });
  });

  test("handles empty array", () => {
    const result = calculateBundleSize([]);

    assert({
      given: "empty array",
      should: "return zero totals",
      actual: result,
      expected: { totalSize: 0, fileCount: 0, breakdown: {} },
    });
  });

  test("handles non-array input", () => {
    const result = calculateBundleSize(null);

    assert({
      given: "null input",
      should: "return zero totals",
      actual: result,
      expected: { totalSize: 0, fileCount: 0, breakdown: {} },
    });
  });

  test("handles nested paths", () => {
    const files = [
      { path: "src/components/Button.tsx", size: 100 },
      { path: "src/utils/helpers.ts", size: 50 },
    ];

    const result = calculateBundleSize(files);

    assert({
      given: "nested paths",
      should: "extract extension correctly",
      actual: result.breakdown[".tsx"],
      expected: 100,
    });

    assert({
      given: "nested paths",
      should: "handle multiple extensions",
      actual: result.breakdown[".ts"],
      expected: 50,
    });
  });
});

// -----------------------------------------------------------------------------
// Error Types and Constants Tests
// -----------------------------------------------------------------------------

describe("vibeFileErrors", () => {
  test("exports ForbiddenFileName error definition", () => {
    assert({
      given: "vibeFileErrors export",
      should: "contain ForbiddenFileName with correct code",
      actual: vibeFileErrors.ForbiddenFileName.code,
      expected: "FORBIDDEN_FILE_NAME",
    });
  });

  test("exports BundleTooLarge error definition", () => {
    assert({
      given: "vibeFileErrors export",
      should: "contain BundleTooLarge with correct code",
      actual: vibeFileErrors.BundleTooLarge.code,
      expected: "BUNDLE_TOO_LARGE",
    });
  });

  test("exports TooManyFiles error definition", () => {
    assert({
      given: "vibeFileErrors export",
      should: "contain TooManyFiles with correct code",
      actual: vibeFileErrors.TooManyFiles.code,
      expected: "TOO_MANY_FILES",
    });
  });
});

describe("defaults", () => {
  test("exports maxSize constant", () => {
    assert({
      given: "defaults export",
      should: "contain maxSize",
      actual: defaults.maxSize,
      expected: 5 * 1024 * 1024,
    });
  });

  test("exports maxFiles constant", () => {
    assert({
      given: "defaults export",
      should: "contain maxFiles",
      actual: defaults.maxFiles,
      expected: 100,
    });
  });

  test("exports forbiddenPatterns array", () => {
    assert({
      given: "defaults export",
      should: "contain forbiddenPatterns as array",
      actual: Array.isArray(defaults.forbiddenPatterns),
      expected: true,
    });

    assert({
      given: "defaults.forbiddenPatterns",
      should: "contain entry.tsx pattern",
      actual: defaults.forbiddenPatterns.some((p) => p.test("entry.tsx")),
      expected: true,
    });
  });
});
