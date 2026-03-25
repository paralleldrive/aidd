import { spawnSync } from "child_process";
import { createError, errorCauses } from "error-causes";

const [churnErrors, handleChurnErrors] = errorCauses({
  GitError: { message: "git command failed" },
  NotAGitRepo: { message: "not a git repository" },
});

export { churnErrors, handleChurnErrors };

/**
 * Pure: parse raw `git log --name-only` output into a touch-count map.
 * @param {string} output
 * @returns {Map<string, number>}
 */
export const parseChurnOutput = (output) =>
  output
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean)
    .reduce((map, file) => map.set(file, (map.get(file) ?? 0) + 1), new Map());

/**
 * Returns a Map of filePath -> commit touch count for files changed
 * within the given day window.
 * @param {{ cwd?: string, days?: number }} [options]
 * @returns {Map<string, number>}
 */
export const collectChurn = ({ cwd = process.cwd(), days = 90 } = {}) => {
  const mergeBase = spawnSync("git", ["merge-base", "HEAD", "origin/main"], {
    cwd,
    encoding: "utf8",
  });
  const revision = mergeBase.status === 0 ? mergeBase.stdout.trim() : "HEAD";

  const { stdout, stderr, status } = spawnSync(
    "git",
    [
      "log",
      revision,
      `--since=${days} days ago`,
      "--name-only",
      "--pretty=format:",
      "--diff-filter=ACMR",
    ],
    { cwd, encoding: "utf8" },
  );

  if (status !== 0) {
    const message = stderr ?? "";
    const isNotRepo = message.includes("not a git repository");
    const errorDef = isNotRepo ? churnErrors.NotAGitRepo : churnErrors.GitError;
    throw createError({ ...errorDef, cause: new Error(message) });
  }

  return parseChurnOutput(stdout ?? "");
};
