#!/usr/bin/env node

import { readFileSync } from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { Command } from "commander";
import fs from "fs-extra";

import { executeClone, handleCliErrors } from "../lib/cli-core.js";
import { generateAllIndexes } from "../lib/index-generator.js";
import { scaffoldCleanup } from "../lib/scaffold-cleanup.js";
import { resolveExtension } from "../lib/scaffold-resolver.js";
import { runManifest } from "../lib/scaffold-runner.js";

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
          // Create a proper error with cause for handleErrors
          const error = new Error(result.error.message, {
            cause: result.error.cause || {
              code: result.error.code || "UNEXPECTED_ERROR",
            },
          });

          // Use handleErrors instead of manual switching
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
            })(error);
          } catch {
            // Fallback for unexpected errors
            console.error(`❌ Unexpected Error: ${result.error.message}`);
            if (verbose && result.error.cause) {
              console.error("🔍 Caused by:", result.error.cause);
            }
          }
        }

        process.exit(result.success ? 0 : 1);
      },
    );

  // create subcommand
  program
    .command("create [type-or-folder] [folder]")
    .description(
      "Scaffold a new app using a manifest-driven extension (default: next-shadcn)",
    )
    .option("--agent <name>", "agent CLI to use for prompt steps", "claude")
    .action(async (typeOrFolder, folder, { agent }) => {
      // If only one positional arg given, treat it as the folder (use default type)
      const type = folder ? typeOrFolder : undefined;
      const folderArg = folder || typeOrFolder;
      const folderPath = path.resolve(process.cwd(), folderArg);

      try {
        console.log(
          chalk.blue(`\nScaffolding new project in ${folderPath}...`),
        );

        await fs.ensureDir(folderPath);

        const paths = await resolveExtension({
          folder: folderPath,
          packageRoot: __dirname,
          type,
        });

        await runManifest({
          agent,
          extensionJsPath: paths.extensionJsPath,
          folder: folderPath,
          manifestPath: paths.manifestPath,
        });

        console.log(chalk.green("\n✅ Scaffold complete!"));
        console.log(
          chalk.yellow(
            "\n💡 Tip: Run `npx aidd scaffold-cleanup " +
              folderArg +
              "` to remove the downloaded extension files.",
          ),
        );
        process.exit(0);
      } catch (err) {
        console.error(chalk.red(`\n❌ Scaffold failed: ${err.message}`));
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

  return program;
};

// Execute CLI
createCli().parse();
