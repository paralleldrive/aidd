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
 * Detect the default branch ref (e.g. "origin/main", "origin/master").
 *
 * Step 1: ask git which branch origin/HEAD tracks via symbolic-ref.
 * Step 2: if that fails, walk common guesses until one resolves.
 *
 * @param {string} cwd
 * @returns {string | null}
 */
const resolveMainRef = (cwd) => {
  const symResult = spawnSync(
    "git",
    ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"],
    { cwd, encoding: "utf8" },
  );
  if (symResult.status === 0) {
    const ref = symResult.stdout.trim();
    if (ref) return ref;
  }

  for (const ref of ["origin/main", "origin/master", "main", "master"]) {
    const result = spawnSync("git", ["rev-parse", "--verify", "--quiet", ref], {
      cwd,
      encoding: "utf8",
    });
    if (result.status === 0) return ref;
  }
  return null;
};

/**
 * Returns a Map of filePath -> commit touch count for files changed
 * within the given day window.
 *
 * For each file in the current PR diff (git diff mainRef...HEAD), an extra
 * +1 is added to account for the upcoming squash-merge commit on main.
 * Falls back to HEAD-based log when no default branch ref can be resolved.
 *
 * @param {{ cwd?: string, days?: number }} [options]
 * @returns {Map<string, number>}
 */
export const collectChurn = ({ cwd = process.cwd(), days = 90 } = {}) => {
  const mainRef = resolveMainRef(cwd);

  if (mainRef === null) {
    // Neither origin/main nor main is reachable — fall back to HEAD log.
    const { stdout, stderr, status } = spawnSync(
      "git",
      [
        "log",
        "HEAD",
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
      const errorDef = isNotRepo
        ? churnErrors.NotAGitRepo
        : churnErrors.GitError;
      throw createError({ ...errorDef, cause: new Error(message) });
    }

    return parseChurnOutput(stdout ?? "");
  }

  // Step 1: count commits on main branch history within the day window.
  const logResult = spawnSync(
    "git",
    [
      "log",
      mainRef,
      `--since=${days} days ago`,
      "--name-only",
      "--pretty=format:",
      "--diff-filter=ACMR",
    ],
    { cwd, encoding: "utf8" },
  );

  if (logResult.status !== 0) {
    const message = logResult.stderr ?? "";
    const isNotRepo = message.includes("not a git repository");
    const errorDef = isNotRepo ? churnErrors.NotAGitRepo : churnErrors.GitError;
    throw createError({ ...errorDef, cause: new Error(message) });
  }

  const churnMap = parseChurnOutput(logResult.stdout ?? "");

  // Step 2: add +1 for every file touched in this PR (the upcoming squash commit).
  const diffResult = spawnSync(
    "git",
    ["diff", `${mainRef}...HEAD`, "--name-only"],
    { cwd, encoding: "utf8" },
  );

  if (diffResult.status === 0) {
    const prFiles = (diffResult.stdout ?? "")
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    for (const file of prFiles) {
      churnMap.set(file, (churnMap.get(file) ?? 0) + 1);
    }
  }

  return churnMap;
};
