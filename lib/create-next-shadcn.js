import { exec } from "child_process";
import { promisify } from "util";
import { spawn } from "child_process";

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
    // Execute claude with piped prompt instructions using spawn for better output handling
    return new Promise((resolve, reject) => {
      const command = `{ echo "Follow these instructions exactly. Stop when complete." && echo && curl -fsSL "${PROMPT_URL}"; } | claude`;

      const child = spawn("bash", ["-c", command], {
        stdio: "inherit", // Inherit stdio so user sees Claude's output
        shell: true,
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          resolve({
            success: false,
            error: `Claude CLI exited with code ${code}`,
          });
        }
      });

      child.on("error", (error) => {
        resolve({
          success: false,
          error: `Failed to execute claude: ${error.message}`,
        });
      });
    });
  } catch (error) {
    return {
      success: false,
      error: `Failed to execute claude: ${error.message}`,
    };
  }
};
