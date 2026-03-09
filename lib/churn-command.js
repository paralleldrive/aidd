import { spawnSync } from "child_process";
import chalk from "chalk";

import { asyncPipe } from "../utils/async-pipe.js";
import { collectChurn, handleChurnErrors } from "./churn-collector.js";
import { filterSourceFiles } from "./churn-filters.js";
import { formatJson, formatTable } from "./churn-formatter.js";
import { scoreFiles } from "./churn-scorer.js";
import { collectFileMetrics } from "./file-metrics-collector.js";

/**
 * @typedef {{ key: string, flag: string, min: number }} OptionRule
 */

/** @type {OptionRule[]} */
const optionRules = [
  { flag: "--days", key: "days", min: 1 },
  { flag: "--top", key: "top", min: 1 },
  { flag: "--min-loc", key: "minLoc", min: 0 },
];

/**
 * @param {Record<string, string>} opts
 * @param {OptionRule} rule
 * @returns {string | null}
 */
const validateRule = (opts, { key, flag, min }) => {
  const n = Number(opts[key]);
  const label = min > 0 ? "positive" : "non-negative";
  return !Number.isFinite(n) || !Number.isInteger(n) || n < min
    ? `${flag} must be a ${label} integer (got "${opts[key]}")`
    : null;
};

/**
 * Validates CLI option strings against the option rules.
 * Returns the first error message string on failure, null on success.
 * @param {{ days: string, top: string, minLoc: string }} opts
 * @returns {string | null}
 */
export const validateChurnOptions = (opts) => {
  for (const rule of optionRules) {
    const error = validateRule(opts, rule);
    if (error) return error;
  }
  return null;
};

/** @param {import('commander').Command} program */
export const addChurnCommand = (program) => {
  program
    .command("churn")
    .description("rank files by hotspot score (LoC × churn × complexity)")
    .addHelpText(
      "after",
      "\nSee ai/skills/aidd-churn/README.md for metric definitions and interpretation guide.\n",
    )
    .option("--days <n>", "git log window in days", "90")
    .option("--top <n>", "max results to show", "20")
    .option("--min-loc <n>", "minimum lines of code to include", "50")
    .option("--json", "output raw JSON")
    .action(({ days, top, minLoc, json }) => {
      const validationError = validateChurnOptions({ days, minLoc, top });
      if (validationError) {
        console.error(chalk.red(`❌ ${validationError}`));
        process.exit(1);
      }

      const cwd = process.cwd();
      const daysNum = Number(days);
      const topNum = Number(top);
      const minLocNum = Number(minLoc);

      const run = asyncPipe(
        ({ cwd, days }) => collectChurn({ cwd, days }),
        (churnMap) => {
          const allFiles = [...churnMap.keys()];
          const files = filterSourceFiles(allFiles);
          // Resolve file paths from the git root so they are correct when
          // the command is run from a subdirectory of the repository.
          const gitRootResult = spawnSync(
            "git",
            ["rev-parse", "--show-toplevel"],
            { cwd, encoding: "utf8" },
          );
          const gitRoot =
            gitRootResult?.status === 0 ? gitRootResult.stdout.trim() : cwd;
          const metricsMap = collectFileMetrics({ cwd: gitRoot, files });
          return { churnMap, files, metricsMap };
        },
        ({ churnMap, metricsMap }) =>
          scoreFiles(churnMap, metricsMap, {
            minLoc: minLocNum,
            top: topNum,
          }),
        (results) =>
          console.log(json ? formatJson(results) : formatTable(results)),
      );

      run({ cwd, days: daysNum }).catch((err) => {
        try {
          handleChurnErrors({
            GitError: (err) => {
              const anyErr = /** @type {any} */ (err);
              const detail =
                anyErr?.cause?.cause?.message ??
                anyErr?.cause?.message ??
                anyErr?.message ??
                "unknown error";
              console.error(chalk.red(`❌ Git error: ${detail}`));
              process.exit(1);
            },
            NotAGitRepo: () => {
              console.error(
                chalk.red("❌ Not a git repository. Run inside a git repo."),
              );
              process.exit(1);
            },
          })(/** @type {Error} */ (err));
        } catch {
          // unrecognised error type — fall through to generic handler
        }
        console.error(chalk.red(`❌ Unexpected error: ${err?.message ?? err}`));
        process.exit(1);
      });
    });
  return program;
};
