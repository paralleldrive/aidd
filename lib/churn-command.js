import chalk from "chalk";

import { collectChurn, handleChurnErrors } from "./churn-collector.js";
import { formatJson, formatTable } from "./churn-formatter.js";
import { scoreFiles } from "./churn-scorer.js";
import { collectFileMetrics } from "./file-metrics-collector.js";

/**
 * Validates CLI option strings. Returns an error message string on failure, null on success.
 * @param {{ days: string, top: string, minLoc: string }} opts
 * @returns {string | null}
 */
export const validateChurnOptions = ({ days, top, minLoc }) => {
  const daysNum = Number(days);
  if (!Number.isFinite(daysNum) || !Number.isInteger(daysNum) || daysNum <= 0)
    return `--days must be a positive integer (got "${days}")`;

  const topNum = Number(top);
  if (!Number.isFinite(topNum) || !Number.isInteger(topNum) || topNum <= 0)
    return `--top must be a positive integer (got "${top}")`;

  const minLocNum = Number(minLoc);
  if (
    !Number.isFinite(minLocNum) ||
    !Number.isInteger(minLocNum) ||
    minLocNum < 0
  )
    return `--min-loc must be a non-negative integer (got "${minLoc}")`;

  return null;
};

/** @param {import('commander').Command} program */
export const addChurnCommand = (program) => {
  program
    .command("churn")
    .description("rank files by hotspot score (LoC × churn × complexity)")
    .addHelpText(
      "after",
      "\nSee ai/skills/aidd-churn/SKILL.md for metric definitions and interpretation guide.\n",
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

      const run = () => {
        const churnMap = collectChurn({ cwd, days: Number(days) });
        const files = [...churnMap.keys()];
        const metricsMap = collectFileMetrics({ cwd, files });
        const results = scoreFiles(churnMap, metricsMap, {
          minLoc: Number(minLoc),
          top: Number(top),
        });
        console.log(json ? formatJson(results) : formatTable(results));
      };

      Promise.resolve()
        .then(run)
        .catch(
          handleChurnErrors({
            GitError: ({ message }) =>
              console.error(chalk.red(`❌ Git error: ${message}`)),
            NotAGitRepo: () =>
              console.error(
                chalk.red("❌ Not a git repository. Run inside a git repo."),
              ),
          }),
        )
        .catch(() => process.exit(1));
    });
  return program;
};
