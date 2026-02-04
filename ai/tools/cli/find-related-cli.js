#!/usr/bin/env node

/**
 * CLI for finding related files via dependency graph traversal.
 * Usage: node ai/tools/cli/find-related-cli.js <file> [options]
 */

import { program } from "commander";
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";

import { createDatabase, closeDatabase } from "../db/connection.js";
import {
  findRelated,
  getForwardDeps,
  getReverseDeps,
} from "../graph/traverse.js";

const DEFAULT_DB_PATH = ".aidd/index.db";

/**
 * Format related files for console output.
 */
export const formatRelated = (results, options) => {
  if (options.json) {
    return JSON.stringify(results, null, 2);
  }

  if (results.length === 0) {
    return chalk.yellow("No related files found.");
  }

  const lines = [];
  lines.push(chalk.blue(`Found ${results.length} related file(s):\n`));

  // Group by direction if showing both
  const forward = results.filter((r) => r.direction === "forward");
  const reverse = results.filter((r) => r.direction === "reverse");

  if (
    forward.length > 0 &&
    (options.direction === "both" || options.direction === "forward")
  ) {
    lines.push(chalk.white("  Dependencies (imports):"));
    for (const file of forward) {
      const depthIndicator = "  ".repeat(file.depth);
      lines.push(
        chalk.gray(
          `    ${depthIndicator}→ ${file.file} (depth: ${file.depth})`,
        ),
      );
    }
    lines.push("");
  }

  if (
    reverse.length > 0 &&
    (options.direction === "both" || options.direction === "reverse")
  ) {
    lines.push(chalk.white("  Dependents (imported by):"));
    for (const file of reverse) {
      const depthIndicator = "  ".repeat(file.depth);
      lines.push(
        chalk.gray(
          `    ${depthIndicator}← ${file.file} (depth: ${file.depth})`,
        ),
      );
    }
    lines.push("");
  }

  return lines.join("\n");
};

program
  .name("aidd-find-related")
  .description("Find files related through the dependency graph")
  .argument("<file>", "File path to analyze")
  .option("-d, --db <path>", "Database path", DEFAULT_DB_PATH)
  .option("-r, --root <path>", "Root directory", process.cwd())
  .option(
    "--direction <dir>",
    "Traversal direction: forward, reverse, or both",
    "both",
  )
  .option("--depth <n>", "Maximum traversal depth", "3")
  .option("--json", "Output as JSON")
  .action(async (file, options) => {
    try {
      const dbPath = path.resolve(options.root, options.db);

      // Validate database exists
      if (!(await fs.pathExists(dbPath))) {
        console.error(chalk.red(`Error: Database not found at ${dbPath}`));
        console.error(
          chalk.yellow("Run 'npm run aidd:index' first to create the index."),
        );
        process.exit(1);
      }

      const db = createDatabase(dbPath);

      const maxDepth = parseInt(options.depth, 10);
      const direction = options.direction;

      let results;
      if (direction === "forward") {
        results = getForwardDeps(db, file, { maxDepth });
      } else if (direction === "reverse") {
        results = getReverseDeps(db, file, { maxDepth });
      } else {
        results = findRelated(db, file, { direction: "both", maxDepth });
      }

      console.log(formatRelated(results, { ...options, direction }));

      closeDatabase(db);
      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Only parse when run directly, not when imported for testing
if (process.argv[1]?.endsWith("find-related-cli.js")) {
  program.parse();
}
