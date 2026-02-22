#!/usr/bin/env node

import { readFileSync } from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { Command } from "commander";

import { executeClone, handleCliErrors } from "../lib/cli-core.js";
import { generateAllIndexes } from "../lib/index-generator.js";
import { scaffoldCleanup } from "../lib/scaffold-cleanup.js";
import { resolveCreateArgs, runCreate } from "../lib/scaffold-create.js";
import { handleScaffoldErrors } from "../lib/scaffold-errors.js";
import { runVerifyScaffold } from "../lib/scaffold-verify-cmd.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(path.join(__dirname, "../package.json"), "utf-8"),
);

const createCli = () => {
  const program = new Command();

  program
    .name("aidd")
    .description("AI Driven Development - Install the AIDD Framework")
    .version(packageJson.version)
    .argument(
      "[target-directory]",
      "target directory to install ai/ folder",
      ".",
    )
    .option("-f, --force", "overwrite existing files")
    .option("-d, --dry-run", "show what would be copied without copying")
    .option("-v, --verbose", "provide detailed output")
    .option(
      "-c, --cursor",
      "create .cursor symlink for Cursor editor integration",
    )
    .option(
      "-i, --index",
      "generate index.md files from frontmatter in ai/ subfolders",
    )
    .addHelpText(
      "before",
      `
AIDD Framework
The standard framework for AI Driven Development.

Includes:
- AIDD CLI – project bootstrap and automation
- Agent Runtime – workflows from product discovery to commit and release
- SudoLang Prompt Language – typed pseudocode for AI orchestration
- Server Framework – composable backend for Node and Next.js
- Utilities & Component Library – common patterns and reusable recipes to accelerate your app development

AI-Driven Development (AIDD) is a methodology where AI systems take primary
responsibility for generating, testing, and documenting code, automating most of
the software creation process so humans can focus on the big picture and 10× their
productivity.

SudoLang is a pseudocode language for prompting large language models with clear
structure, strong typing, and explicit control flow.

🚀 Server Framework: Import from 'aidd/server' for composable, type-safe server development.
   See documentation: https://github.com/paralleldrive/aidd#-aidd-server-framework

🚀 AI Workflow Commands (use in your AI assistant chat):
- /discover - what to build
- /task - planning
- /execute - task epics with TDD
- /review - the results
- /user-test - generate human and AI agent test scripts from user journeys
- /log - activity logging
- /commit - commit changes

After installation, ask your AI agent: /help
For help with /commands, use /help [command] in your AI agent chat, e.g. /help discover
`,
    )
    .addHelpText(
      "after",
      `
Quick Start

To install for Cursor:

  npx aidd --cursor

Install without Cursor integration:

  npx aidd my-project
`,
    )
    .addHelpText(
      "after",
      `
Need help building your app?

https://paralleldrive.com
`,
    )
    .action(
      async (targetDirectory, { force, dryRun, verbose, cursor, index }) => {
        // Handle --index option separately
        if (index) {
          const targetPath = path.resolve(process.cwd(), targetDirectory);

          if (dryRun) {
            console.log(
              chalk.cyan(
                "Dry run - would generate index.md files in ai/ subfolders",
              ),
            );
            process.exit(0);
            return;
          }

          console.log(chalk.blue("Generating index.md files..."));

          const result = await generateAllIndexes(targetPath);

          if (result.success) {
            console.log(chalk.green(`✅ ${result.message}`));
            if (verbose) {
              result.indexes.forEach((idx) => {
                console.log(chalk.gray(`  - ${idx.path}`));
              });
            }
            process.exit(0);
          } else {
            console.error(chalk.red(`❌ ${result.error}`));
            process.exit(1);
          }
          return;
        }

        const result = await executeClone({
          cursor,
          dryRun,
          force,
          targetDirectory,
          verbose,
        });

        if (!result.success) {
          try {
            handleCliErrors({
              CloneError: ({ message, cause }) => {
                console.error(`❌ Clone Error: ${message}`);
                console.error(
                  "💡 Check source directory and target permissions",
                );
                if (verbose && cause) {
                  console.error("🔍 Caused by:", cause.message || cause);
                }
              },
              FileSystemError: ({ message, cause }) => {
                console.error(`❌ File System Error: ${message}`);
                console.error(
                  "💡 Check file permissions and available disk space",
                );
                if (verbose && cause) {
                  console.error("🔍 Caused by:", cause.message || cause);
                }
              },
              ValidationError: ({ message }) => {
                console.error(`❌ Validation Error: ${message}`);
                console.error(
                  "💡 Try using --force to overwrite existing files",
                );
              },
            })(result.error);
          } catch {
            // Fallback for unexpected errors (e.g. an error without a cause code)
            console.error(`❌ Unexpected Error: ${result.error?.message}`);
            if (verbose && result.error?.cause) {
              console.error("🔍 Caused by:", result.error.cause);
            }
          }
        }

        process.exit(result.success ? 0 : 1);
      },
    );

  // create subcommand
  //
  // Argument parsing rationale:
  //   create scaffold-example my-project  → typeOrFolder="scaffold-example", folder="my-project"
  //   create my-project                   → typeOrFolder="my-project",       folder=undefined
  //   create                              → typeOrFolder=undefined  → manual error
  //
  // Commander cannot parse `[type] <folder>` correctly when type is omitted and
  // only the folder is given — it would assign the single value to `type` and
  // report folder as missing. Using two optional args and validating manually
  // handles all three cases cleanly.
  program
    .command("create [typeOrFolder] [folder]")
    .description(
      "Scaffold a new app using a manifest-driven extension (default: next-shadcn)",
    )
    // Override the auto-generated usage so help shows the intended calling
    // convention rather than the internal [typeOrFolder] [folder] names.
    .usage("[options] [type] <folder>")
    .addHelpText(
      "after",
      `
Arguments:
  <folder>  (required) directory to create the new project in
  [type]    scaffold name, file:// URI, or https:// URL
            defaults to AIDD_CUSTOM_CREATE_URI env var, then "next-shadcn"

Examples:
  $ npx aidd create my-project
  $ npx aidd create scaffold-example my-project
  $ npx aidd create https://github.com/org/scaffold my-project
  $ npx aidd create file:///path/to/scaffold my-project
`,
    )
    .option("--agent <name>", "agent CLI to use for prompt steps", "claude")
    .action(async (typeOrFolder, folder, { agent }) => {
      const args = resolveCreateArgs(typeOrFolder, folder);
      if (!args) {
        console.error("error: missing required argument 'folder'");
        process.exit(1);
        return;
      }

      const { type, folderPath } = args;
      console.log(chalk.blue(`\nScaffolding new project in ${folderPath}...`));

      try {
        const result = await runCreate({
          agent,
          folder: folderPath,
          packageRoot: __dirname,
          type,
        });

        console.log(chalk.green("\n✅ Scaffold complete!"));
        if (result.cleanupTip) {
          console.log(
            chalk.yellow(
              `\n💡 Tip: Run \`${result.cleanupTip}\` to remove the downloaded extension files.`,
            ),
          );
        }
        process.exit(0);
      } catch (err) {
        try {
          handleScaffoldErrors({
            ScaffoldCancelledError: ({ message }) => {
              console.log(chalk.yellow(`\nℹ️  ${message}`));
              process.exit(0); // graceful cancellation — not an error
            },
            ScaffoldNetworkError: ({ message, cause }) => {
              console.error(chalk.red(`\n❌ Network Error: ${message}`));
              console.error(
                chalk.yellow("💡 Check your internet connection and try again"),
              );
              if (cause?.cause) {
                console.error(
                  chalk.gray(`   Caused by: ${cause.cause.message}`),
                );
              }
            },
            ScaffoldStepError: ({ message }) => {
              console.error(chalk.red(`\n❌ Step failed: ${message}`));
              console.error(
                chalk.yellow(
                  "💡 Check the scaffold manifest steps and try again",
                ),
              );
            },
            ScaffoldValidationError: ({ message }) => {
              console.error(chalk.red(`\n❌ Invalid scaffold: ${message}`));
              console.error(
                chalk.yellow(
                  "💡 Run `npx aidd verify-scaffold` to diagnose the manifest",
                ),
              );
            },
          })(err);
        } catch {
          console.error(chalk.red(`\n❌ Scaffold failed: ${err.message}`));
        }
        process.exit(1);
      }
    });

  // verify-scaffold subcommand
  program
    .command("verify-scaffold [type]")
    .description(
      "Validate a scaffold manifest before running it (named, file://, or HTTP/HTTPS)",
    )
    .action(async (type) => {
      try {
        const result = await runVerifyScaffold({
          packageRoot: __dirname,
          type,
        });

        if (result.valid) {
          console.log(chalk.green("✅ Scaffold is valid"));
          process.exit(0);
        } else {
          console.error(chalk.red("❌ Scaffold validation failed:"));
          for (const err of result.errors) {
            console.error(chalk.red(`   • ${err}`));
          }
          process.exit(1);
        }
      } catch (err) {
        try {
          handleScaffoldErrors({
            ScaffoldCancelledError: ({ message }) => {
              console.log(chalk.yellow(`\nℹ️  ${message}`));
              process.exit(0); // graceful cancellation — not an error
            },
            ScaffoldNetworkError: ({ message }) => {
              console.error(chalk.red(`\n❌ Network Error: ${message}`));
            },
            ScaffoldStepError: ({ message }) => {
              console.error(chalk.red(`\n❌ Step failed: ${message}`));
            },
            ScaffoldValidationError: ({ message }) => {
              console.error(chalk.red(`\n❌ Invalid scaffold: ${message}`));
            },
          })(err);
        } catch {
          console.error(chalk.red(`\n❌ Verification failed: ${err.message}`));
        }
        process.exit(1);
      }
    });

  // scaffold-cleanup subcommand
  program
    .command("scaffold-cleanup [folder]")
    .description(
      "Remove the .aidd/ working directory created during scaffolding",
    )
    .action(async (folder) => {
      const folderPath = folder
        ? path.resolve(process.cwd(), folder)
        : process.cwd();

      try {
        const result = await scaffoldCleanup({ folder: folderPath });

        if (result.action === "removed") {
          console.log(chalk.green(`✅ ${result.message}`));
        } else {
          console.log(chalk.yellow(`ℹ️  ${result.message}`));
        }
        process.exit(0);
      } catch (err) {
        console.error(chalk.red(`❌ Cleanup failed: ${err.message}`));
        process.exit(1);
      }
    });

  // set subcommand — print the shell export statement for a known setting
  program
    .command("set <key> <value>")
    .description(
      "Print the shell export statement for a configuration value (pipe to eval to apply)",
    )
    .addHelpText(
      "after",
      `
Valid keys:
  create-uri  Default scaffold URI used by \`npx aidd create\`
              (equivalent to setting AIDD_CUSTOM_CREATE_URI)

Usage:
  Apply in current shell:
    eval "$(npx aidd set create-uri <uri>)"

  Make permanent — add the printed export to your shell profile (~/.bashrc, ~/.zshrc, etc.)

Examples:
  $ npx aidd set create-uri https://github.com/org/scaffold
  $ npx aidd set create-uri file:///path/to/my-scaffold
`,
    )
    .action((key, value) => {
      const KEY_TO_ENV = {
        "create-uri": "AIDD_CUSTOM_CREATE_URI",
      };

      if (!KEY_TO_ENV[key]) {
        process.stderr.write(
          chalk.red(
            `❌ Unknown setting: "${key}". Valid settings: ${Object.keys(KEY_TO_ENV).join(", ")}\n`,
          ),
        );
        process.exit(1);
        return;
      }

      const envVar = KEY_TO_ENV[key];
      // Machine-readable export to stdout — safe to pipe to eval
      process.stdout.write(`export ${envVar}=${value}\n`);
      // Human guidance to stderr so it doesn't pollute eval
      process.stderr.write(
        chalk.green(
          `# To apply in the current shell:\n#   eval "$(npx aidd set ${key} ${value})"\n`,
        ),
      );
      process.exit(0);
    });

  return program;
};

createCli().parse();
