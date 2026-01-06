import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const PROMPT_URL =
  "https://raw.githubusercontent.com/paralleldrive/aidd/main/docs/new-project-setup-nextjs-shadcn.md";

/**
 * Execute the create-next-shadcn command by piping instructions to Claude CLI
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const executeCreateNextShadcn = async () => {
  try {
    // Check if claude CLI is installed
    await execAsync("which claude");
  } catch {
    return {
      success: false,
      error:
        "Claude Code CLI is not installed. Please install it first: https://docs.claude.ai/cli",
    };
  }

  try {
    // Execute claude with piped prompt instructions
    const command = `{ echo "Follow these instructions exactly. Stop when complete." && echo && curl -fsSL "${PROMPT_URL}"; } | claude`;

    await execAsync(command);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to execute claude: ${error.message}`,
    };
  }
};
