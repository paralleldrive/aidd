import path from "path";
import fs from "fs-extra";
import { errorCauses, createError } from "error-causes";

// Error causes for index generation operations
const [indexErrors] = errorCauses({
  IndexGenerationError: {
    code: "INDEX_GENERATION_ERROR",
    message: "Index generation failed",
  },
});

const { IndexGenerationError } = indexErrors;

/**
 * Parse YAML frontmatter from file content
 * Returns null if no frontmatter found
 */
const parseFrontmatter = (content) => {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return null;
  }

  const frontmatterStr = match[1];
  const frontmatter = {};

  // Parse simple YAML key: value pairs
  const lines = frontmatterStr.split(/\r?\n/);
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();

      // Handle boolean values
      if (value === "true") value = true;
      else if (value === "false") value = false;

      frontmatter[key] = value;
    }
  }

  return frontmatter;
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
  return `### 📁 ${subdirName}/\n\nSee [\`${subdirName}/index.md\`](./${subdirName}/index.md) for contents.\n\n`;
};

/**
 * Generate index.md content for a directory
 */
const generateIndexContent = async (dirPath, relativePath = "") => {
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
        content += `### ${file}\n\n*Error reading file*\n\n`;
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

/**
 * Recursively generate index.md files for all subdirectories
 */
const generateIndexRecursive = async (dirPath, results = []) => {
  // Generate index for current directory
  const result = await writeIndex(dirPath);
  results.push(result);

  // Process subdirectories
  const subdirs = await getSubdirectories(dirPath);
  for (const subdir of subdirs) {
    const subdirPath = path.join(dirPath, subdir);
    await generateIndexRecursive(subdirPath, results);
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
};
