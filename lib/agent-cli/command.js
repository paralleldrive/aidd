import process from "process";
import chalk from "chalk";

import { resolveAgentConfig } from "./config.js";
import { handleAgentErrors } from "./errors.js";
import { runAgent } from "./runner.js";

// @ts-expect-error -- Commander program type is not declared in this JS module
const registerAgentCommand = (program) => {
  program
    .command("agent")
    .description("Run an AI agent with a prompt")
    .option("--prompt <text>", "Prompt text to pass to the agent")
    .option(
      "--agentConfig <name|path>",
      "Agent to use (name, YAML path, or config object)",
    )
    // @ts-expect-error -- Commander action callback parameters are untyped
    .action(async ({ prompt, agentConfig }) => {
      if (!prompt) {
        console.error(
          chalk.red("error: missing required option '--prompt <text>'"),
        );
        process.exit(1);
        return;
      }

      const cwd = process.cwd();

      try {
        const resolvedConfig = await resolveAgentConfig({
          cwd,
          value: agentConfig,
        });
        await runAgent({ agentConfig: resolvedConfig, cwd, prompt });
      } catch (err) {
        try {
          handleAgentErrors({
            AgentConfigParseError: ({ message }) => {
              console.error(chalk.red(`\n❌ Agent config error: ${message}`));
            },
            AgentConfigReadError: ({ message }) => {
              console.error(chalk.red(`\n❌ Agent config error: ${message}`));
            },
            AgentConfigValidationError: ({ message }) => {
              console.error(chalk.red(`\n❌ Agent config error: ${message}`));
            },
          })(/** @type {Error} */ (err));
        } catch {
          // @ts-expect-error
          console.error(chalk.red(`\n❌ Agent failed: ${err.message}`));
        }
        process.exit(1);
      }
    });
};

export { registerAgentCommand };
