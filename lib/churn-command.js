import { spawnSync } from "child_process";
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
    .action(({ days, top, minLoc, json }) => {
      const cwd = process.cwd();

      const run = () => {
        const churnMap = collectChurn({ cwd, days: Number(days) });
        const files = [...churnMap.keys()];
        const gitRootResult = spawnSync(
          "git",
          ["rev-parse", "--show-toplevel"],
          { cwd, encoding: "utf8" },
        );
        const gitRoot =
          gitRootResult?.status === 0 ? gitRootResult.stdout.trim() : cwd;
        const metricsMap = collectFileMetrics({ cwd: gitRoot, files });
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
            GitError: ({ message }) => {
              console.error(chalk.red(`❌ Git error: ${message}`));
              process.exit(1);
            },
            NotAGitRepo: () => {
              console.error(
                chalk.red("❌ Not a git repository. Run inside a git repo."),
              );
              process.exit(1);
            },
          }),
        )
        .catch(() => process.exit(1));
    });
  return program;
};
