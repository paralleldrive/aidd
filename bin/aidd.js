#!/usr/bin/env node

import { Command } from "commander";
import { executeClone } from "../lib/cli-core.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import process from "process";
import { errorCauses } from "error-causes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(path.join(__dirname, "../package.json"), "utf-8"),
);

// Use the same error causes as the CLI library
const [, handleCliErrors] = errorCauses({
  ValidationError: {
    code: "VALIDATION_ERROR",
    message: "Input validation failed",
  },
  FileSystemError: {
    code: "FILESYSTEM_ERROR",
    message: "File system operation failed",
  },
  CloneError: {
    code: "CLONE_ERROR",
    message: "AI folder cloning failed",
  },
});

const createCli = () => {
  const program = new Command();

  return program
    .name("aidd")
    .description(
      "AI Driven Development - Install SudoLang AI agent orchestration system",
    )
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
    .addHelpText(
      "before",
      `
SudoLang.ai AIDD
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
About the Author

The SudoLang AIDD library was created by Eric Elliott, author of the book,
"The Art of Effortless Programming: Unleashing the Power of AI Driven Development"
(https://leanpub.com/effortless-programming). Eric offers 1:1 mentorship,
consulting, and strategic advisor services for people looking to learn
AI Driven Development. If you're interested, reach out:
https://ericelliottjs.com/support
`,
    )
    .action(async (targetDirectory, { force, dryRun, verbose, cursor }) => {
      const result = await executeClone({
        targetDirectory,
        force,
        dryRun,
        verbose,
        cursor,
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
            ValidationError: ({ message }) => {
              console.error(`❌ Validation Error: ${message}`);
              console.error("💡 Try using --force to overwrite existing files");
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
            CloneError: ({ message, cause }) => {
              console.error(`❌ Clone Error: ${message}`);
              console.error("💡 Check source directory and target permissions");
              if (verbose && cause) {
                console.error("🔍 Caused by:", cause.message || cause);
              }
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
    });
};

// Execute CLI
createCli().parse();
