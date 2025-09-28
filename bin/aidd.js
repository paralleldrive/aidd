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
  readFileSync(path.join(__dirname, "../package.json"), "utf-8")
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
      "AI Driven Development - Install SudoLang AI agent orchestration system"
    )
    .version(packageJson.version)
    .argument(
      "[target-directory]",
      "target directory to install ai/ folder",
      "."
    )
    .option("-f, --force", "overwrite existing files")
    .option("-d, --dry-run", "show what would be copied without copying")
    .option("-v, --verbose", "provide detailed output")
    .option(
      "-c, --cursor",
      "create .cursor symlink for Cursor editor integration"
    )
    .addHelpText(
      "before",
      `
AIDD with SudoLang.ai

The standard library for AI Driven Development.

🚀 AI-Powered Development Workflow:
• /discover - what to build
• /task - planning  
• /execute - task epics with TDD
• /review - the results

Use /help [command] to learn how to use individual commands

A public collection of reusable metaprograms, agent scripts, and prompt modules.

SudoLang is a pseudocode language for prompting large language models with clear structure, strong typing, and explicit control flow.
`
    )
    .addHelpText(
      "after",
      `
Getting Started

1. Recommended: Creates ai/ folder + .cursor symlink for automatic integration
   npx aidd --cursor my-project

2. Alternative: Just the ai/ folder (manual integration required)
   npx aidd my-project

3. Explore the structure:
   cd my-project
   ls ai/                    # See available components
   cat ai/rules/please.mdc   # Read the main orchestrator

Examples

Basic usage:
  npx aidd                    # Current directory
  npx aidd my-project         # Specific directory

Preview and force options:
  npx aidd --dry-run          # See what would be copied
  npx aidd --force --verbose  # Overwrite with details

Cursor editor integration:
  npx aidd --cursor           # Create .cursor symlink
  npx aidd my-project --cursor --verbose

Multiple projects:
  npx aidd frontend-app
  npx aidd backend-api

Recommended:

- Install Cursor
- Cursor: Open New Agent Chat
- /help to learn how to use the system
- Watch: https://www.youtube.com/watch?v=ybbfwu0Ykyg
`
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
`
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
                "💡 Check file permissions and available disk space"
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
