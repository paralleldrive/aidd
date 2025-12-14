import path from "path";
import fs from "fs-extra";
import matter from "gray-matter";
import { errorCauses, createError } from "error-causes";

// Error causes for index generation operations
const [{ IndexGenerationError }] = errorCauses({
  IndexGenerationError: {
    code: "INDEX_GENERATION_ERROR",
    message: "Index generation failed",
  },
});

/**
 * Validate filename to prevent path traversal attacks
 * Throws if filename contains .. or is an absolute path
 */
const validateFilename = (filename) => {
  if (filename.includes("..") || path.isAbsolute(filename)) {
    throw createError({
      ...IndexGenerationError,
      message: `Invalid filename: ${filename}`,
    });
  }
  return true;
};

// Keys that could cause prototype pollution
const FORBIDDEN_KEYS = ["__proto__", "prototype", "constructor"];

/**
 * Parse YAML frontmatter from file content using gray-matter
 * Returns null if no frontmatter found
 */
const parseFrontmatter = (content) => {
  try {
    const { data, isEmpty } = matter(content);
    if (isEmpty || Object.keys(data).length === 0) {
      return null;
    }
    // Filter out prototype pollution keys
    const safe = Object.create(null);
    for (const [key, value] of Object.entries(data)) {
      if (!FORBIDDEN_KEYS.includes(key)) {
        safe[key] = value;
      }
    }
    return safe;
  } catch {
    return null;
  }
};

/**
 * Get the title from file content
 * Looks for first # heading or uses filename
 */
const extractTitle = (content, filename) => {
  // Look for first markdown heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  // Fall back to filename without extension
  return path.basename(filename, path.extname(filename));
};

/**
 * Get all indexable files in a directory (non-recursive)
 */
const getIndexableFiles = async (dirPath) => {
  const items = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const item of items) {
    if (item.isFile()) {
      const ext = path.extname(item.name).toLowerCase();
      // Include markdown and SudoLang files, exclude index.md itself
      if ((ext === ".md" || ext === ".mdc") && item.name !== "index.md") {
        files.push(item.name);
      }
    }
  }

  return files.sort();
};

/**
 * Get all subdirectories in a directory
 */
const getSubdirectories = async (dirPath) => {
  const items = await fs.readdir(dirPath, { withFileTypes: true });
  const dirs = [];

  for (const item of items) {
    if (item.isDirectory()) {
      dirs.push(item.name);
    }
  }

  return dirs.sort();
};

/**
 * Generate file entry for index
 */
const generateFileEntry = async (dirPath, filename) => {
  validateFilename(filename);
  const filePath = path.join(dirPath, filename);
  const content = await fs.readFile(filePath, "utf-8");
  const frontmatter = parseFrontmatter(content);
  const title = extractTitle(content, filename);

  let entry = `### ${title}\n\n`;
  entry += `**File:** \`${filename}\`\n\n`;

  if (frontmatter) {
    if (frontmatter.description) {
      entry += `${frontmatter.description}\n\n`;
    }
    if (frontmatter.globs) {
      entry += `**Applies to:** \`${frontmatter.globs}\`\n\n`;
    }
    if (frontmatter.alwaysApply === true) {
      entry += `**Always active**\n\n`;
    }
  } else {
    // No frontmatter - just note the file exists
    entry += `*No description available*\n\n`;
  }

  return entry;
};

/**
 * Generate subdirectory entry for index
 */
const generateSubdirEntry = (subdirName) => {
  validateFilename(subdirName);
  return `### 📁 ${subdirName}/\n\nSee [\`${subdirName}/index.md\`](./${subdirName}/index.md) for contents.\n\n`;
};

/**
 * Generate index.md content for a directory
 */
const generateIndexContent = async (dirPath) => {
  const dirName = path.basename(dirPath);
  const files = await getIndexableFiles(dirPath);
  const subdirs = await getSubdirectories(dirPath);

  let content = `# ${dirName}\n\n`;
  content += `This index provides an overview of the contents in this directory.\n\n`;

  if (subdirs.length > 0) {
    content += `## Subdirectories\n\n`;
    for (const subdir of subdirs) {
      content += generateSubdirEntry(subdir);
    }
  }

  if (files.length > 0) {
    content += `## Files\n\n`;
    for (const file of files) {
      try {
        const entry = await generateFileEntry(dirPath, file);
        content += entry;
      } catch (error) {
        const msg = error?.message || String(error);
        content += `### ${file}\n\n*Error reading file: ${msg}*\n\n`;
      }
    }
  }

  if (files.length === 0 && subdirs.length === 0) {
    content += `*This directory is empty.*\n`;
  }

  return content;
};

/**
 * Write index.md to a directory
 */
const writeIndex = async (dirPath) => {
  const indexPath = path.join(dirPath, "index.md");
  const content = await generateIndexContent(dirPath);

  try {
    await fs.writeFile(indexPath, content, "utf-8");
    return { path: indexPath, success: true };
  } catch (originalError) {
    throw createError({
      ...IndexGenerationError,
      message: `Failed to write index.md: ${indexPath}`,
      cause: originalError,
    });
  }
};

const MAX_RECURSION_DEPTH = 10;

/**
 * Recursively generate index.md files for all subdirectories
 * Includes symlink and depth protection
 */
const generateIndexRecursive = async (dirPath, results = [], depth = 0) => {
  if (depth > MAX_RECURSION_DEPTH) {
    return results;
  }

  // Generate index for current directory
  const result = await writeIndex(dirPath);
  results.push(result);

  // Process subdirectories
  const subdirs = await getSubdirectories(dirPath);
  for (const subdir of subdirs) {
    const subdirPath = path.join(dirPath, subdir);
    // Skip symlinks to prevent infinite recursion
    const stats = await fs.lstat(subdirPath);
    if (!stats.isSymbolicLink()) {
      await generateIndexRecursive(subdirPath, results, depth + 1);
    }
  }

  return results;
};

/**
 * Main function to generate all index files for the ai/ directory
 */
const generateAllIndexes = async (targetBase) => {
  const aiPath = path.join(targetBase, "ai");

  // Check if ai/ directory exists
  const exists = await fs.pathExists(aiPath);
  if (!exists) {
    return {
      success: false,
      error: `ai/ directory not found at ${aiPath}`,
      indexes: [],
    };
  }

  try {
    const results = await generateIndexRecursive(aiPath);
    return {
      success: true,
      message: `Generated ${results.length} index file(s)`,
      indexes: results,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      indexes: [],
    };
  }
};

export {
  generateAllIndexes,
  generateIndexRecursive,
  generateIndexContent,
  writeIndex,
  parseFrontmatter,
  extractTitle,
  getIndexableFiles,
  getSubdirectories,
  generateFileEntry,
  generateSubdirEntry,
  validateFilename,
};
