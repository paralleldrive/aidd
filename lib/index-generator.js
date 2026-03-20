import path from "path";
import { createError, errorCauses } from "error-causes";
import fs from "fs-extra";
import matter from "gray-matter";

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
const forbiddenKeys = ["__proto__", "prototype", "constructor"];

/**
 * Escape markdown special characters in link text
 * Characters that break markdown link syntax: [ ] ( ) `
 */
const escapeMarkdownLink = (str) => str.replace(/([[\]()\\`])/g, "\\$1");

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
      if (!forbiddenKeys.includes(key)) {
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
  const escapedFilename = escapeMarkdownLink(filename);

  let entry = `### ${escapeMarkdownLink(title)}\n\n`;
  entry += `**File:** \`${escapedFilename}\`\n\n`;

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
  const escaped = escapeMarkdownLink(subdirName);
  return `### 📁 ${escaped}/\n\nSee [\`${escaped}/index.md\`](./${escaped}/index.md) for contents.\n\n`;
};

/**
 * Check if a directory is a skills directory
 * (named "skills" or contains subdirectories with SKILL.md files)
 */
const isSkillsDirectory = async (dirPath) => {
  if (path.basename(dirPath) === "skills") return true;
  const subdirs = await getSubdirectories(dirPath);
  if (subdirs.length === 0) return false;
  for (const subdir of subdirs) {
    const skillPath = path.join(dirPath, subdir, "SKILL.md");
    if (await fs.pathExists(skillPath)) return true;
  }
  return false;
};

/**
 * Generate a simple bullet entry for a skill from its SKILL.md frontmatter
 */
const generateSkillEntry = async (dirPath, subdirName) => {
  const skillPath = path.join(dirPath, subdirName, "SKILL.md");
  const exists = await fs.pathExists(skillPath);
  if (!exists) return null;

  const content = await fs.readFile(skillPath, "utf-8");
  const frontmatter = parseFrontmatter(content);
  const name = frontmatter?.name || subdirName;
  const description = frontmatter?.description?.trim();

  if (!description) return `- ${name} - *No description available*\n`;
  return `- ${name} - ${description}\n`;
};

/**
 * Generate skills index content with simple bullet format
 */
const generateSkillsIndexContent = async (dirPath) => {
  const subdirs = await getSubdirectories(dirPath);

  let content = `## Skills Index\n\n`;

  for (const subdir of subdirs) {
    const entry = await generateSkillEntry(dirPath, subdir);
    if (entry) content += entry;
  }

  if (subdirs.length === 0) {
    content += `*No skills available.*\n`;
  }

  return content;
};

/**
 * Generate index.md content for a directory
 */
const generateIndexContent = async (dirPath) => {
  // Skills directories get a simple bullet list format
  if (await isSkillsDirectory(dirPath)) {
    return generateSkillsIndexContent(dirPath);
  }

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
        // Use code block to prevent markdown injection
        content += `### \`${file}\`\n\n\`\`\`\n${msg}\n\`\`\`\n\n`;
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
      cause: originalError,
      message: `Failed to write index.md: ${indexPath}`,
    });
  }
};

const maxRecursionDepth = 10;

/**
 * Recursively generate index.md files for all subdirectories
 * Includes symlink and depth protection
 * Skips recursion into skill directories (they get a flat bullet list)
 */
const generateIndexRecursive = async (dirPath, results = [], depth = 0) => {
  if (depth > maxRecursionDepth) {
    return results;
  }

  // Generate index for current directory
  const result = await writeIndex(dirPath);
  results.push(result);

  // Skills directories get a flat index — don't recurse into skill subdirs
  if (await isSkillsDirectory(dirPath)) {
    return results;
  }

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
 * Main function to generate all index files for ai/ and aidd-custom/ directories
 */
const generateAllIndexes = async (targetBase) => {
  const aiPath = path.join(targetBase, "ai");

  // Check if ai/ directory exists
  const exists = await fs.pathExists(aiPath);
  if (!exists) {
    return {
      error: { message: `ai/ directory not found at ${aiPath}` },
      indexes: [],
      success: false,
    };
  }

  try {
    const results = await generateIndexRecursive(aiPath);

    // Also index aidd-custom/ if it exists
    const customPath = path.join(targetBase, "aidd-custom");
    const customExists = await fs.pathExists(customPath);
    if (customExists) {
      // Scaffold aidd-custom/skills/ if it doesn't exist
      const customSkillsPath = path.join(customPath, "skills");
      await fs.ensureDir(customSkillsPath);
      await generateIndexRecursive(customPath, results);
    }

    return {
      indexes: results,
      message: `Generated ${results.length} index file(s)`,
      success: true,
    };
  } catch (error) {
    return {
      error: {
        cause: error?.cause,
        message: error?.message || String(error),
      },
      indexes: [],
      success: false,
    };
  }
};

export {
  extractTitle,
  generateAllIndexes,
  generateFileEntry,
  generateIndexContent,
  generateIndexRecursive,
  generateSkillEntry,
  generateSkillsIndexContent,
  generateSubdirEntry,
  getIndexableFiles,
  getSubdirectories,
  isSkillsDirectory,
  parseFrontmatter,
  validateFilename,
  writeIndex,
};
