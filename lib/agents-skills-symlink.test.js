// @ts-check
/** @typedef {import("./agents-skills-symlink.js").SymlinkOptions} SymlinkOptions */
import os from "os";
import path from "path";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test } from "vitest";

import { symlinkAgentsSkills } from "./agents-skills-symlink.js";

describe("symlinkAgentsSkills", () => {
  let tempDir = "";

  beforeEach(async () => {
    tempDir = path.join(
      os.tmpdir(),
      `aidd-agents-skills-symlink-${Date.now()}`,
    );
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  /** @param {string[]} names */
  const createSkillDirs = async (names) => {
    const skillsDir = path.join(tempDir, "ai", "skills");
    await fs.ensureDir(skillsDir);
    for (const name of names) {
      await fs.ensureDir(path.join(skillsDir, name));
    }
    return skillsDir;
  };

  test("creates .agents/skills directory when it does not exist", async () => {
    await createSkillDirs(["aidd-fix", "aidd-review"]);

    await symlinkAgentsSkills({ targetBase: tempDir });

    const agentsSkillsDir = path.join(tempDir, ".agents", "skills");
    const exists = await fs.pathExists(agentsSkillsDir);

    assert({
      given: "a target without .agents/skills",
      should: "create the .agents/skills directory",
      actual: exists,
      expected: true,
    });
  });

  test("creates symlinks for each aidd-* skill", async () => {
    await createSkillDirs(["aidd-fix", "aidd-review", "aidd-tdd"]);

    await symlinkAgentsSkills({ targetBase: tempDir });

    const results = await Promise.all(
      ["aidd-fix", "aidd-review", "aidd-tdd"].map(async (name) => {
        const symlinkPath = path.join(tempDir, ".agents", "skills", name);
        const lstat = await fs.lstat(symlinkPath);
        return lstat.isSymbolicLink();
      }),
    );

    assert({
      given: "aidd-* skill folders in ai/skills/",
      should: "create a symlink for each at .agents/skills/<name>",
      actual: results.every(Boolean),
      expected: true,
    });
  });

  test("symlink points to the correct relative target", async () => {
    await createSkillDirs(["aidd-fix"]);

    await symlinkAgentsSkills({ targetBase: tempDir });

    const symlinkPath = path.join(tempDir, ".agents", "skills", "aidd-fix");
    const linkTarget = await fs.readlink(symlinkPath);

    assert({
      given: "a created symlink",
      should: "point to relative ../../ai/skills/aidd-fix",
      actual: linkTarget,
      expected: "../../ai/skills/aidd-fix",
    });
  });

  test("skips non-aidd-* folders in ai/skills/", async () => {
    await createSkillDirs(["aidd-fix", "custom-skill", "my-tool"]);

    await symlinkAgentsSkills({ targetBase: tempDir });

    const agentsSkillsDir = path.join(tempDir, ".agents", "skills");
    const entries = await fs.readdir(agentsSkillsDir);

    assert({
      given: "a mix of aidd-* and non-aidd-* skills",
      should: "only create symlinks for aidd-* skills",
      actual: entries.sort(),
      expected: ["aidd-fix"],
    });
  });

  test("is idempotent when symlinks already exist", async () => {
    await createSkillDirs(["aidd-fix"]);

    await symlinkAgentsSkills({ targetBase: tempDir });
    await symlinkAgentsSkills({ targetBase: tempDir });

    const symlinkPath = path.join(tempDir, ".agents", "skills", "aidd-fix");
    const lstat = await fs.lstat(symlinkPath);

    assert({
      given: "a symlink already exists",
      should: "still be a symlink after second run",
      actual: lstat.isSymbolicLink(),
      expected: true,
    });
  });

  test("does not overwrite real directories (non-symlinks)", async () => {
    await createSkillDirs(["aidd-fix"]);

    // Pre-create a real directory to simulate consumer override
    const overridePath = path.join(tempDir, ".agents", "skills", "aidd-fix");
    await fs.ensureDir(overridePath);
    await fs.writeFile(path.join(overridePath, "override.md"), "# override");

    await symlinkAgentsSkills({ targetBase: tempDir });

    const lstat = await fs.lstat(overridePath);

    assert({
      given: "a real directory at .agents/skills/aidd-fix",
      should: "not convert it to a symlink",
      actual: lstat.isSymbolicLink(),
      expected: false,
    });

    assert({
      given: "a real directory at .agents/skills/aidd-fix",
      should: "leave the override file intact",
      actual: await fs.pathExists(path.join(overridePath, "override.md")),
      expected: true,
    });
  });

  test("does not overwrite real files (non-symlinks)", async () => {
    await createSkillDirs(["aidd-fix"]);

    const overridePath = path.join(tempDir, ".agents", "skills", "aidd-fix");
    await fs.ensureDir(path.dirname(overridePath));
    await fs.writeFile(overridePath, "# overridden as file");

    await symlinkAgentsSkills({ targetBase: tempDir });

    const lstat = await fs.lstat(overridePath);

    assert({
      given: "a real file at .agents/skills/aidd-fix",
      should: "not convert it to a symlink",
      actual: lstat.isSymbolicLink(),
      expected: false,
    });
  });

  test("returns result summary with created and skipped counts", async () => {
    await createSkillDirs(["aidd-fix", "aidd-review"]);

    const realOverridePath = path.join(
      tempDir,
      ".agents",
      "skills",
      "aidd-fix",
    );
    await fs.ensureDir(realOverridePath);

    const result = await symlinkAgentsSkills({ targetBase: tempDir });

    assert({
      given: "one skill overridden and one new",
      should: "report 1 created",
      actual: result.created,
      expected: 1,
    });

    assert({
      given: "one skill overridden and one new",
      should: "report 1 skipped",
      actual: result.skipped,
      expected: 1,
    });
  });

  test("returns dry run result without creating files", async () => {
    await createSkillDirs(["aidd-fix", "aidd-review"]);

    const result = await symlinkAgentsSkills({
      targetBase: tempDir,
      dryRun: true,
    });

    const agentsSkillsDir = path.join(tempDir, ".agents", "skills");
    const exists = await fs.pathExists(agentsSkillsDir);

    assert({
      given: "dry run mode",
      should: "not create .agents/skills directory",
      actual: exists,
      expected: false,
    });

    assert({
      given: "dry run mode",
      should: "report what would be created",
      actual: result.wouldCreate.length,
      expected: 2,
    });
  });

  test("returns empty result when ai/skills does not exist", async () => {
    const result = await symlinkAgentsSkills({ targetBase: tempDir });

    assert({
      given: "a target without ai/skills",
      should: "return 0 created",
      actual: result.created,
      expected: 0,
    });

    assert({
      given: "a target without ai/skills",
      should: "return 0 skipped",
      actual: result.skipped,
      expected: 0,
    });
  });
});
