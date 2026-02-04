#!/usr/bin/env node

/**
 * CLI for querying the aidd index.
 * Usage: node ai/tools/cli/query-cli.js <query> [options]
 */

import { program } from "commander";
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";

import { createDatabase, closeDatabase } from "../db/connection.js";
import { fanOutSearch } from "../search/fan-out.js";
import { searchFts5 } from "../search/fts5.js";
import { searchMetadata } from "../search/metadata.js";

const DEFAULT_DB_PATH = ".aidd/index.db";

/**
 * Format search results for console output.
 */
export const formatResults = (results, options) => {
  if (options.json) {
    return JSON.stringify(results, null, 2);
  }

  if (results.length === 0) {
    return chalk.yellow("No results found.");
  }

  const lines = [
    chalk.blue(`Found ${results.length} result(s):\n`),
    ...results.flatMap((result) => [
      chalk.white(`  ${result.path}`),
      chalk.gray(`    Type: ${result.type}`),
      ...(result.relevanceScore !== undefined
        ? [chalk.gray(`    Score: ${result.relevanceScore.toFixed(3)}`)]
        : []),
      ...(result.frontmatter?.description
        ? [chalk.gray(`    ${result.frontmatter.description}`)]
        : []),
      ...(result.snippet && options.snippets
        ? [chalk.gray(`    ...${result.snippet.trim().slice(0, 100)}...`)]
        : []),
      "",
    ]),
  ];

  return lines.join("\n");
};

program
  .name("aidd-query")
  .description("Query the aidd index")
  .argument("<query>", "Search query")
  .option("-d, --db <path>", "Database path", DEFAULT_DB_PATH)
  .option("-r, --root <path>", "Root directory", process.cwd())
  .option("-t, --type <type>", "Filter by document type")
  .option("-l, --limit <n>", "Maximum results", "20")
  .option("--json", "Output as JSON")
  .option("--snippets", "Include content snippets")
  .option("--fts-only", "Use only FTS5 search")
  .option("--metadata-only", "Use only metadata search")
  .action(async (query, options) => {
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

      const limit = parseInt(options.limit, 10);
      let results;

      if (options.ftsOnly) {
        results = searchFts5(db, query, { type: options.type, limit });
      } else if (options.metadataOnly) {
        const filters = options.type ? { type: options.type } : {};
        results = searchMetadata(db, filters, { limit });
      } else {
        results = await fanOutSearch(db, query, {
          type: options.type,
          limit,
        });
      }

      console.log(formatResults(results, options));

      closeDatabase(db);
      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Only parse when run directly, not when imported for testing
if (process.argv[1]?.endsWith("query-cli.js")) {
  program.parse();
}
