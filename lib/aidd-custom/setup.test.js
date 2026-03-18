// @ts-check
import os from "os";
import path from "path";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test } from "vitest";

import { createAiddCustomAgentsMd, createAiddCustomConfig } from "./setup.js";

describe("createAiddCustomConfig", () => {
  let tempDir = "";

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-config-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("creates aidd-custom/config.yml when it does not exist", async () => {
    const result = await createAiddCustomConfig({ targetBase: tempDir })();

    assert({
      given: "a target directory without aidd-custom/config.yml",
      should: "return created: true",
      actual: result.created,
      expected: true,
    });

    const exists = await fs.pathExists(
      path.join(tempDir, "aidd-custom", "config.yml"),
    );

    assert({
      given: "a target directory without aidd-custom/config.yml",
      should: "write the config file",
      actual: exists,
      expected: true,
    });
  });

  test("config.yml contains e2eBeforeCommit: false by default", async () => {
    await createAiddCustomConfig({ targetBase: tempDir })();
    const content = await fs.readFile(
      path.join(tempDir, "aidd-custom", "config.yml"),
      "utf-8",
    );

    assert({
      given: "a newly created config.yml",
      should: "default e2eBeforeCommit to false",
      actual: content.includes("e2eBeforeCommit: false"),
      expected: true,
    });
  });

  test("skips creation when config.yml already exists", async () => {
    await fs.ensureDir(path.join(tempDir, "aidd-custom"));
    await fs.writeFile(
      path.join(tempDir, "aidd-custom", "config.yml"),
      "e2eBeforeCommit: true\n",
      "utf-8",
    );

    const result = await createAiddCustomConfig({ targetBase: tempDir })();

    assert({
      given: "an existing config.yml",
      should: "return created: false",
      actual: result.created,
      expected: false,
    });

    const content = await fs.readFile(
      path.join(tempDir, "aidd-custom", "config.yml"),
      "utf-8",
    );

    assert({
      given: "an existing config.yml",
      should: "preserve the original content",
      actual: content,
      expected: "e2eBeforeCommit: true\n",
    });
  });
});

describe("createAiddCustomAgentsMd", () => {
  let tempDir = "";

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-agents-md-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("provides users a place to override agent instructions", async () => {
    const result = await createAiddCustomAgentsMd({ targetBase: tempDir })();

    assert({
      given: "users need a place to add project-specific agent instructions",
      should: "create aidd-custom/AGENTS.md on first install",
      actual: result.created,
      expected: true,
    });

    const exists = await fs.pathExists(
      path.join(tempDir, "aidd-custom", "AGENTS.md"),
    );

    assert({
      given: "users need a place to add project-specific agent instructions",
      should: "write the scaffold file to aidd-custom/",
      actual: exists,
      expected: true,
    });
  });

  test("helps users understand how to use the override file", async () => {
    await createAiddCustomAgentsMd({ targetBase: tempDir })();
    const content = await fs.readFile(
      path.join(tempDir, "aidd-custom", "AGENTS.md"),
      "utf-8",
    );

    assert({
      given: "users need to know the file overrides root AGENTS.md",
      should: "include override instruction in scaffold",
      actual: content.toLowerCase().includes("override"),
      expected: true,
    });
  });

  test("preserves user customizations on subsequent installs", async () => {
    await fs.ensureDir(path.join(tempDir, "aidd-custom"));
    await fs.writeFile(
      path.join(tempDir, "aidd-custom", "AGENTS.md"),
      "# My Custom Agents\n",
      "utf-8",
    );

    const result = await createAiddCustomAgentsMd({ targetBase: tempDir })();

    assert({
      given: "users have customized their aidd-custom/AGENTS.md",
      should: "not overwrite existing file",
      actual: result.created,
      expected: false,
    });

    const content = await fs.readFile(
      path.join(tempDir, "aidd-custom", "AGENTS.md"),
      "utf-8",
    );

    assert({
      given: "users have customized their aidd-custom/AGENTS.md",
      should: "preserve their customizations exactly",
      actual: content,
      expected: "# My Custom Agents\n",
    });
  });
});
