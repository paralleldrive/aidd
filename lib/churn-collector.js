import { execSync } from "child_process";
import { createError, errorCauses } from "error-causes";

const [churnErrors, handleChurnErrors] = errorCauses({
  GitError: { message: "git command failed" },
  NotAGitRepo: { message: "not a git repository" },
});

export { handleChurnErrors, churnErrors };

/**
 * Returns a Map of filePath -> commit touch count for files changed
 * within the given day window.
 */
export const collectChurn = ({ cwd = process.cwd(), days = 90 } = {}) => {
  const since = `${days} days ago`;
  let output;

  try {
    output = execSync(
      `git log --since="${since}" --name-only --pretty=format: --diff-filter=ACMR`,
      { cwd, encoding: "utf8" },
    );
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    const isNotRepo = message.includes("not a git repository");
    const errorDef = isNotRepo ? churnErrors.NotAGitRepo : churnErrors.GitError;
    throw createError({ ...errorDef, cause });
  }

  return output
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean)
    .reduce((map, file) => map.set(file, (map.get(file) ?? 0) + 1), new Map());
};
