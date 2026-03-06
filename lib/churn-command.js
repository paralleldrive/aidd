import chalk from "chalk";

import { collectChurn, handleChurnErrors } from "./churn-collector.js";
import { formatJson, formatTable } from "./churn-formatter.js";
import { scoreFiles } from "./churn-scorer.js";
import { collectFileMetrics } from "./file-metrics-collector.js";

/** @param {import('commander').Command} program */
export const addChurnCommand = (program) => {
  program
    .command("churn")
    .description("rank files by hotspot score (LoC × churn × complexity)")
    .option("--days <n>", "git log window in days", "90")
    .option("--top <n>", "max results to show", "20")
    .option("--min-loc <n>", "minimum lines of code to include", "50")
    .option("--json", "output raw JSON")
    .action(async ({ days, top, minLoc, json }) => {
      const cwd = process.cwd();
      try {
        const churnMap = collectChurn({ cwd, days: Number(days) });
        const files = [...churnMap.keys()];
        const metricsMap = collectFileMetrics({ cwd, files });
        const results = scoreFiles(churnMap, metricsMap, {
          minLoc: Number(minLoc),
          top: Number(top),
        });
        console.log(json ? formatJson(results) : formatTable(results));
      } catch (err) {
        try {
          handleChurnErrors({
            GitError: ({ message }) =>
              console.error(chalk.red(`❌ Git error: ${message}`)),
            NotAGitRepo: () =>
              console.error(
                chalk.red("❌ Not a git repository. Run inside a git repo."),
              ),
          })(err);
        } catch {
          console.error(chalk.red(`❌ ${err.message}`));
        }
        process.exit(1);
      }
    });
  return program;
};
