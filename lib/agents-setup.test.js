// @ts-check
import os from "os";
import path from "path";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test } from "vitest";

import { setupAgents } from "./agents-setup.js";

describe("setupAgents", () => {
  let tempDir = "";

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-agents-setup-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("runs full agent install phase on the real filesystem", async () => {
    const logger = { info() {}, verbose() {} };

    await setupAgents({ targetBase: tempDir, logger, verbose: false });

    const rootAgents = await fs.pathExists(path.join(tempDir, "AGENTS.md"));
    const configPath = path.join(tempDir, "aidd-custom", "config.yml");
    const customAgents = path.join(tempDir, "aidd-custom", "AGENTS.md");
    const indexPath = path.join(tempDir, "aidd-custom", "index.md");

    assert({
      given: "a fresh target directory",
      should: "create root AGENTS.md",
      actual: rootAgents,
      expected: true,
    });

    assert({
      given: "a fresh target directory",
      should: "create aidd-custom/config.yml",
      actual: await fs.pathExists(configPath),
      expected: true,
    });

    assert({
      given: "a fresh target directory",
      should: "create aidd-custom/AGENTS.md",
      actual: await fs.pathExists(customAgents),
      expected: true,
    });

    assert({
      given: "a fresh target directory",
      should: "generate aidd-custom/index.md",
      actual: await fs.pathExists(indexPath),
      expected: true,
    });
  });

  test("when verbose, logs each setup step", async () => {
    /** @type {{ info: string[]; verbose: string[] }} */
    const logged = { info: [], verbose: [] };
    const logger = {
      info: (/** @type {string} */ msg) => logged.info.push(String(msg)),
      verbose: (/** @type {string} */ msg) => logged.verbose.push(String(msg)),
    };

    await setupAgents({ targetBase: tempDir, logger, verbose: true });

    assert({
      given: "verbose agent setup",
      should: "log AGENTS.md phase",
      actual: logged.info.some((m) => m.includes("AGENTS.md")),
      expected: true,
    });

    assert({
      given: "verbose agent setup",
      should: "log config creation",
      actual: logged.info.some((m) => m.includes("aidd-custom/config.yml")),
      expected: true,
    });

    assert({
      given: "verbose agent setup",
      should: "log custom AGENTS.md creation",
      actual: logged.info.some((m) => m.includes("aidd-custom/AGENTS.md")),
      expected: true,
    });

    assert({
      given: "verbose agent setup",
      should: "log index generation",
      actual: logged.info.some((m) => m.includes("aidd-custom/index.md")),
      expected: true,
    });

    assert({
      given: "verbose agent setup",
      should: "include result messages on verbose channel",
      actual: logged.verbose.length >= 3,
      expected: true,
    });
  });
});
