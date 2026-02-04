#!/usr/bin/env node

/**
 * CLI for indexing aidd files into SQLite.
 * Usage: node ai/tools/cli/index-cli.js [options]
 */

import { program } from "commander";
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";

import { createDatabase, closeDatabase } from "../db/connection.js";
import { initializeSchema } from "../db/schema.js";
import { indexDirectory, indexIncremental } from "../indexers/frontmatter.js";
import { indexAllDependencies } from "../indexers/dependencies.js";

const DEFAULT_DB_PATH = ".aidd/index.db";

/**
 * Ensure database directory exists and initialize schema.
 */
export const ensureDatabase = async (dbPath) => {
  const dir = path.dirname(dbPath);
  await fs.ensureDir(dir);

  const db = createDatabase(dbPath);
  initializeSchema(db);
  return db;
};

/**
 * Format duration for display.
 */
export const formatDuration = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

program
  .name("aidd-index")
  .description("Index aidd files into SQLite for fast querying")
  .option("-d, --db <path>", "Database path", DEFAULT_DB_PATH)
  .option("-r, --root <path>", "Root directory to index", process.cwd())
  .option("--full", "Full reindex (default is incremental)")
  .option("--deps", "Also index dependencies")
  .option("-s, --stats", "Show detailed statistics")
  .option("-q, --quiet", "Suppress output")
  .action(async (options) => {
    const startTime = Date.now();
    const log = options.quiet ? () => {} : console.log;

    try {
      const dbPath = path.resolve(options.root, options.db);
      const rootDir = path.resolve(options.root);

      log(chalk.blue("Indexing aidd files..."));
      log(chalk.gray(`  Database: ${dbPath}`));
      log(chalk.gray(`  Root: ${rootDir}`));

      const db = await ensureDatabase(dbPath);

      // Index frontmatter
      let frontmatterStats;
      if (options.full) {
        log(chalk.yellow("\nPerforming full reindex..."));
        frontmatterStats = await indexDirectory(db, rootDir);
      } else {
        log(chalk.yellow("\nPerforming incremental index..."));
        frontmatterStats = await indexIncremental(db, rootDir);
      }

      // Index dependencies if requested
      let depStats = { indexed: 0, files: 0 };
      if (options.deps) {
        log(chalk.yellow("\nIndexing dependencies..."));
        depStats = await indexAllDependencies(db, rootDir);
      }

      const duration = Date.now() - startTime;

      // Summary
      log(chalk.green("\n✓ Indexing complete"));

      if (options.stats) {
        log(chalk.white("\nStatistics:"));

        if (options.full) {
          log(chalk.gray(`  Documents indexed: ${frontmatterStats.indexed}`));
        } else {
          log(chalk.gray(`  Documents updated: ${frontmatterStats.updated}`));
          log(chalk.gray(`  Documents deleted: ${frontmatterStats.deleted}`));
          log(
            chalk.gray(`  Documents unchanged: ${frontmatterStats.unchanged}`),
          );
        }

        if (options.deps) {
          log(chalk.gray(`  Dependencies indexed: ${depStats.indexed}`));
          log(chalk.gray(`  Files scanned for deps: ${depStats.files}`));
        }

        log(chalk.gray(`  Duration: ${formatDuration(duration)}`));

        // Show any errors
        const errors = [
          ...(frontmatterStats.errors || []),
          ...(depStats.errors || []),
        ];
        if (errors.length > 0) {
          log(chalk.red(`\n  Errors (${errors.length}):`));
          errors.slice(0, 5).forEach((e) => log(chalk.red(`    ${e}`)));
          if (errors.length > 5) {
            log(chalk.red(`    ... and ${errors.length - 5} more`));
          }
        }
      } else {
        if (options.full) {
          log(
            chalk.gray(
              `  ${frontmatterStats.indexed} documents indexed in ${formatDuration(duration)}`,
            ),
          );
        } else {
          log(
            chalk.gray(
              `  ${frontmatterStats.updated} updated, ${frontmatterStats.deleted} deleted in ${formatDuration(duration)}`,
            ),
          );
        }
      }

      closeDatabase(db);
      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      if (options.stats) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

// Only parse when run directly, not when imported for testing
if (process.argv[1]?.endsWith("index-cli.js")) {
  program.parse();
}
