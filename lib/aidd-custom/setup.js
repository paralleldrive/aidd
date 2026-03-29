import path from "path";
import { createError, errorCauses } from "error-causes";
import fs from "fs-extra";

// Error causes definition
const [{ FileSystemError }] = errorCauses({
  FileSystemError: {
    code: "FILESYSTEM_ERROR",
    message: "File system operation failed",
  },
});

const aiddCustomConfigContent = `# AIDD Custom Configuration
# Customize the AIDD Framework behavior for this project.
# https://github.com/paralleldrive/aidd

# Run e2e tests before committing (default: false)
# Set to true to enforce e2e test runs locally before each commit.
# When false, e2e tests are deferred to CI.
e2eBeforeCommit: false

# Agent used for prompt: manifest steps and npx aidd agent (default: claude)
# Accepted values: claude | opencode | cursor | path/to/agent.yml
# agent-config: claude
`;

const aiddCustomAgentsMdContent = `# Custom Agent Instructions

Add project-specific agent instructions here. Settings in this file override the root AGENTS.md.
`;

const createAiddCustomConfig =
  ({ targetBase }) =>
  async () => {
    const customDir = path.join(targetBase, "aidd-custom");
    const configPath = path.join(customDir, "config.yml");

    try {
      const exists = await fs.pathExists(configPath);
      if (exists) {
        return {
          created: false,
          message: "aidd-custom/config.yml already exists (skipped)",
        };
      }
      await fs.ensureDir(customDir);
      await fs.writeFile(configPath, aiddCustomConfigContent, "utf-8");
      return { created: true, message: "Created aidd-custom/config.yml" };
    } catch (originalError) {
      throw createError({
        ...FileSystemError,
        cause: originalError,
        message: `Failed to create aidd-custom/config.yml: ${originalError.message}`,
      });
    }
  };

const createAiddCustomAgentsMd =
  ({ targetBase }) =>
  async () => {
    const customDir = path.join(targetBase, "aidd-custom");
    const agentsMdPath = path.join(customDir, "AGENTS.md");

    try {
      const exists = await fs.pathExists(agentsMdPath);
      if (exists) {
        return {
          created: false,
          message: "aidd-custom/AGENTS.md already exists (skipped)",
        };
      }
      await fs.ensureDir(customDir);
      await fs.writeFile(agentsMdPath, aiddCustomAgentsMdContent, "utf-8");
      return { created: true, message: "Created aidd-custom/AGENTS.md" };
    } catch (originalError) {
      throw createError({
        ...FileSystemError,
        cause: originalError,
        message: `Failed to create aidd-custom/AGENTS.md: ${originalError.message}`,
      });
    }
  };

export { createAiddCustomAgentsMd, createAiddCustomConfig };
