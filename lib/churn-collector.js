import { execSync } from "child_process";
import { createError, errorCauses } from "error-causes";

const [churnErrors, handleChurnErrors] = errorCauses({
  GitError: { message: "git command failed" },
  NotAGitRepo: { message: "not a git repository" },
});

export { handleChurnErrors, churnErrors };

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
  try {
    const output = execSync(
      `git log --since="${days} days ago" --name-only --pretty=format: --diff-filter=ACMR`,
      { cwd, encoding: "utf8" },
    );
    return parseChurnOutput(output);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    const isNotRepo = message.includes("not a git repository");
    const errorDef = isNotRepo ? churnErrors.NotAGitRepo : churnErrors.GitError;
    throw createError({ ...errorDef, cause });
  }
};
