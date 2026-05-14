// @ts-check
/** @typedef {{ targetBase: string; dryRun?: boolean }} SymlinkOptions */

import path from "path";
import fs from "fs-extra";

const AGENTS_SKILLS_DIR = path.join(".agents", "skills");
const AI_SKILLS_DIR = path.join("ai", "skills");

/**
 * Resolve all aidd-* skill directory names under ai/skills/.
 * Returns an empty array when the directory does not exist.
 */
/**
 * @param {string} targetBase
 */
const getAiddSkillNames = async (targetBase) => {
  const skillsDir = path.join(targetBase, AI_SKILLS_DIR);
  const exists = await fs.pathExists(skillsDir);
  if (!exists) return [];

  const entries = await fs.readdir(skillsDir);
  const results = [];
  for (const entry of entries) {
    if (!entry.startsWith("aidd-")) continue;
    const entryPath = path.join(skillsDir, entry);
    const stat = await fs.stat(entryPath);
    if (stat.isDirectory()) results.push(entry);
  }
  return results;
};

/**
 * Determine whether a path is already a symlink.
 */
/**
 * @param {string} filePath
 */
const isSymlink = async (filePath) => {
  try {
    const lstat = await fs.lstat(filePath);
    return lstat.isSymbolicLink();
  } catch {
    return false;
  }
};

/**
 * Symlink all aidd-* skills from ai/skills/ into .agents/skills/.
 *
 * Rules:
 *  - Creates .agents/skills/ if absent (unless dryRun).
 *  - For each aidd-* folder in ai/skills/, creates a relative symlink at
 *    .agents/skills/<name> → ../../ai/skills/<name>.
 *  - Skips entries that already exist (symlinks or real files/directories).
 *  - Never overwrites real (non-symlink) entries so consumers can override.
 *
 * Returns:
 *  { created: number, skipped: number, wouldCreate: string[] }
 *
 * `wouldCreate` is populated only in dry-run mode and lists the skill names
 * that would have been symlinked.
 */
/**
 * @param {SymlinkOptions} options
 */
const symlinkAgentsSkills = async ({ targetBase, dryRun = false }) => {
  const skillNames = await getAiddSkillNames(targetBase);

  if (dryRun) {
    const agentsSkillsDir = path.join(targetBase, AGENTS_SKILLS_DIR);
    const wouldCreate = [];

    for (const name of skillNames) {
      const dest = path.join(agentsSkillsDir, name);
      const exists = await fs.pathExists(dest);
      const alreadySymlink = await isSymlink(dest);
      if (!exists || alreadySymlink) {
        wouldCreate.push(name);
      }
    }

    return { created: 0, skipped: 0, wouldCreate };
  }

  if (skillNames.length === 0) {
    return { created: 0, skipped: 0, wouldCreate: [] };
  }

  const agentsSkillsDir = path.join(targetBase, AGENTS_SKILLS_DIR);
  await fs.ensureDir(agentsSkillsDir);

  let created = 0;
  let skipped = 0;

  for (const name of skillNames) {
    const dest = path.join(agentsSkillsDir, name);
    const existsAlready = await fs.pathExists(dest);

    if (existsAlready) {
      const alreadySymlink = await isSymlink(dest);
      if (!alreadySymlink) {
        // Real file/directory — consumer override, leave it alone.
        skipped++;
        continue;
      }
      // Already a symlink — idempotent, nothing to do.
      skipped++;
      continue;
    }

    // Relative path from .agents/skills/<name> to ai/skills/<name>
    const symlinkTarget = path.join("..", "..", AI_SKILLS_DIR, name);
    await fs.symlink(symlinkTarget, dest);
    created++;
  }

  return { created, skipped, wouldCreate: [] };
};

export { symlinkAgentsSkills };
