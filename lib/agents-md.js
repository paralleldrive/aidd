import path from "path";
import { createError, errorCauses } from "error-causes";
import fs from "fs-extra";

// Error causes for AGENTS.md operations
const [{ AgentsFileError }] = errorCauses({
  AgentsFileError: {
    code: "AGENTS_FILE_ERROR",
    message: "AGENTS.md file operation failed",
  },
});

// The required directives that must be present in AGENTS.md
// These are keyword patterns that indicate the directive is present
const REQUIRED_DIRECTIVES = [
  "ai/", // References to ai/ directory
  "index.md", // References to index files
  "root index", // Progressive discovery starting from root
  "vision", // Vision document requirement
  "conflict", // Conflict resolution
  "generated", // Auto-generated files warning
];

// The content for AGENTS.md
const AGENTS_MD_CONTENT = `# AI Agent Guidelines

This project uses AI-assisted development with structured guidance in the \`ai/\` directory.

## Directory Structure

Agents should examine the \`ai/*\` directory listings to understand the available commands, rules, and workflows.

## Index Files

Each folder in the \`ai/\` directory contains an \`index.md\` file that describes the purpose and contents of that folder. Agents can read these index files to learn the function of files in each folder without needing to read every file.

**Important:** The \`ai/**/index.md\` files are auto-generated from frontmatter. Do not create or edit these files manually—they will be overwritten by the pre-commit hook.

## Progressive Discovery

Agents should only consume the root index until they need subfolder contents. For example:
- If the project is Python, there is no need to read JavaScript-specific folders
- If working on backend logic, frontend UI folders can be skipped
- Only drill into subfolders when the task requires that specific domain knowledge

This approach minimizes context consumption and keeps agent responses focused.

## Vision Document Requirement

**Before creating or running any task, agents must first read the vision document (\`vision.md\`) in the project root.**

The vision document serves as the source of truth for:
- Project goals and objectives
- Key constraints and non-negotiables
- Architectural decisions and rationale
- User experience principles
- Success criteria

## Conflict Resolution

If any conflicts are detected between a requested task and the vision document, agents must:

1. Stop and identify the specific conflict
2. Explain how the task conflicts with the stated vision
3. Ask the user to clarify how to resolve the conflict before proceeding

Never proceed with a task that contradicts the vision without explicit user approval.
`;

/**
 * Check if AGENTS.md exists at the target path
 */
const agentsFileExists = async (targetBase) => {
  const agentsPath = path.join(targetBase, "AGENTS.md");
  return fs.pathExists(agentsPath);
};

/**
 * Read existing AGENTS.md content
 */
const readAgentsFile = async (targetBase) => {
  const agentsPath = path.join(targetBase, "AGENTS.md");
  try {
    return await fs.readFile(agentsPath, "utf-8");
  } catch (originalError) {
    throw createError({
      ...AgentsFileError,
      cause: originalError,
      message: `Failed to read AGENTS.md: ${agentsPath}`,
    });
  }
};

/**
 * Check if the content contains all required directives
 */
const hasAllDirectives = (content) => {
  const lowerContent = content.toLowerCase();
  return REQUIRED_DIRECTIVES.every((directive) =>
    lowerContent.includes(directive.toLowerCase()),
  );
};

/**
 * Get list of missing directives from content
 */
const getMissingDirectives = (content) => {
  const lowerContent = content.toLowerCase();
  return REQUIRED_DIRECTIVES.filter(
    (directive) => !lowerContent.includes(directive.toLowerCase()),
  );
};

/**
 * Write AGENTS.md file
 */
const writeAgentsFile = async (targetBase, content) => {
  const agentsPath = path.join(targetBase, "AGENTS.md");
  try {
    await fs.writeFile(agentsPath, content, "utf-8");
  } catch (originalError) {
    throw createError({
      ...AgentsFileError,
      cause: originalError,
      message: `Failed to write AGENTS.md: ${agentsPath}`,
    });
  }
};

/**
 * Append directives to existing AGENTS.md
 */
const appendDirectives = async (targetBase, existingContent) => {
  const appendContent = `

---

## AIDD Agent Directives (Auto-appended)

The following directives were added by the AIDD CLI to ensure proper agent behavior.

### Directory Structure

Agents should examine the \`ai/*\` directory listings to understand the available commands, rules, and workflows.

### Index Files

Each folder in the \`ai/\` directory contains an \`index.md\` file that describes the purpose and contents of that folder. Agents can read these index files to learn the function of files in each folder.

**Important:** The \`ai/**/index.md\` files are auto-generated from frontmatter. Do not create or edit these files manually—they will be overwritten by the pre-commit hook.

### Progressive Discovery

Agents should only consume the root index until they need subfolder contents. For example:
- If the project is Python, there is no need to read JavaScript-specific folders
- Only drill into subfolders when the task requires that specific domain knowledge

### Vision Document Requirement

**Before creating or running any task, agents must first read the vision document (\`vision.md\`) in the project root.**

### Conflict Resolution

If any conflicts are detected between a requested task and the vision document, agents must ask the user to clarify how to resolve the conflict before proceeding.
`;

  await writeAgentsFile(targetBase, existingContent + appendContent);
};

/**
 * Main function to ensure AGENTS.md exists with required directives
 * Returns an object indicating what action was taken
 */
const ensureAgentsMd = async (targetBase) => {
  const exists = await agentsFileExists(targetBase);

  if (!exists) {
    // Create new AGENTS.md
    await writeAgentsFile(targetBase, AGENTS_MD_CONTENT);
    return {
      action: "created",
      message: "Created AGENTS.md with required directives",
    };
  }

  // File exists - check if it has all required directives
  const existingContent = await readAgentsFile(targetBase);
  const hasAll = hasAllDirectives(existingContent);

  if (hasAll) {
    return {
      action: "unchanged",
      message: "AGENTS.md already contains all required directives",
    };
  }

  // Append missing directives
  const missing = getMissingDirectives(existingContent);
  await appendDirectives(targetBase, existingContent);
  return {
    action: "appended",
    message: `Appended missing directives to AGENTS.md: ${missing.join(", ")}`,
  };
};

export {
  ensureAgentsMd,
  agentsFileExists,
  readAgentsFile,
  hasAllDirectives,
  getMissingDirectives,
  writeAgentsFile,
  appendDirectives,
  AGENTS_MD_CONTENT,
  REQUIRED_DIRECTIVES,
};
