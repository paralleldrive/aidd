#!/usr/bin/env node

import { Command } from "commander";
import { executeClone } from "../lib/cli-core.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(path.join(__dirname, "../package.json"), "utf-8"),
);

const createCli = () => {
  const program = new Command();

  return program
    .name("aidd")
    .description(
      "AI Driven Development - Clone SudoLang AI agent orchestration system",
    )
    .version(packageJson.version)
    .argument("[target-directory]", "target directory to clone ai/ folder", ".")
    .option("-f, --force", "overwrite existing files")
    .option("-d, --dry-run", "show what would be copied without copying")
    .option("-v, --verbose", "provide detailed output")
    .option(
      "-c, --cursor",
      "create .cursor symlink for Cursor editor integration",
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
        console.error(`Error: ${result.error.message}`);

        if (verbose && result.error.cause) {
          console.error(
            "Caused by:",
            result.error.cause.message || result.error.cause,
          );
        }

        if (verbose && result.error.cause?.code) {
          console.error(`Error code: ${result.error.cause.code}`);
        }
      }

      process.exit(result.success ? 0 : 1);
    });
};

// Execute CLI
createCli().parse();
