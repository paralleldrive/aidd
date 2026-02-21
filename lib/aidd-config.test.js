import os from "os";
import path from "path";
import fs from "fs-extra";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, test } from "vitest";

import { CONFIG_FILENAME, readConfig, writeConfig } from "./aidd-config.js";

describe("readConfig", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-config-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("returns empty object when config file does not exist", async () => {
    const result = await readConfig({ cwd: tempDir });

    assert({
      given: "no .aidd-config.json in cwd",
      should: "return an empty object",
      actual: result,
      expected: {},
    });
  });

  test("returns parsed JSON when config file exists", async () => {
    await fs.writeJson(path.join(tempDir, CONFIG_FILENAME), {
      "create-uri": "https://github.com/org/scaffold",
    });

    const result = await readConfig({ cwd: tempDir });

    assert({
      given: "a valid .aidd-config.json",
      should: "return the parsed config object",
      actual: result["create-uri"],
      expected: "https://github.com/org/scaffold",
    });
  });

  test("returns empty object when config file contains invalid JSON", async () => {
    await fs.writeFile(
      path.join(tempDir, CONFIG_FILENAME),
      "not valid json",
      "utf-8",
    );

    const result = await readConfig({ cwd: tempDir });

    assert({
      given: "a malformed .aidd-config.json",
      should: "return an empty object without throwing",
      actual: result,
      expected: {},
    });
  });
});

describe("writeConfig", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `aidd-config-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test("creates config file with given updates", async () => {
    await writeConfig({
      cwd: tempDir,
      updates: { "create-uri": "https://github.com/org/scaffold" },
    });

    const written = await fs.readJson(path.join(tempDir, CONFIG_FILENAME));

    assert({
      given: "writeConfig called with create-uri",
      should: "write the value to .aidd-config.json",
      actual: written["create-uri"],
      expected: "https://github.com/org/scaffold",
    });
  });

  test("merges new updates into existing config without losing other keys", async () => {
    await fs.writeJson(path.join(tempDir, CONFIG_FILENAME), {
      "other-key": "keep-me",
    });

    await writeConfig({
      cwd: tempDir,
      updates: { "create-uri": "https://github.com/org/scaffold" },
    });

    const written = await fs.readJson(path.join(tempDir, CONFIG_FILENAME));

    assert({
      given: "existing config with other-key and writeConfig adding create-uri",
      should: "preserve other-key",
      actual: written["other-key"],
      expected: "keep-me",
    });

    assert({
      given: "existing config with other-key and writeConfig adding create-uri",
      should: "include the new create-uri value",
      actual: written["create-uri"],
      expected: "https://github.com/org/scaffold",
    });
  });

  test("returns the merged config object", async () => {
    const result = await writeConfig({
      cwd: tempDir,
      updates: { "create-uri": "https://github.com/org/scaffold" },
    });

    assert({
      given: "writeConfig called",
      should: "return the merged config",
      actual: result["create-uri"],
      expected: "https://github.com/org/scaffold",
    });
  });

  test("overwrites existing value for same key", async () => {
    await writeConfig({
      cwd: tempDir,
      updates: { "create-uri": "https://github.com/org/old" },
    });
    await writeConfig({
      cwd: tempDir,
      updates: { "create-uri": "https://github.com/org/new" },
    });

    const written = await fs.readJson(path.join(tempDir, CONFIG_FILENAME));

    assert({
      given: "writeConfig called twice with the same key",
      should: "use the most recent value",
      actual: written["create-uri"],
      expected: "https://github.com/org/new",
    });
  });
});
