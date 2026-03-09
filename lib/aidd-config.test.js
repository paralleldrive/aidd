// @ts-nocheck
import os from "os";
import path from "path";
import fs from "fs-extra";
import yaml from "js-yaml";
import { assert } from "riteway/vitest";
import { describe, onTestFinished, test } from "vitest";

import { readConfig, writeConfig } from "./aidd-config.js";

const createTempDir = async () => {
  const dir = path.join(
    os.tmpdir(),
    `aidd-config-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  await fs.ensureDir(dir);
  onTestFinished(async () => fs.remove(dir));
  return dir;
};

describe("readConfig", () => {
  test("returns empty object when config file does not exist", async () => {
    const tempDir = await createTempDir();
    const configFile = path.join(tempDir, "config.yml");

    const result = await readConfig({ configFile });

    assert({
      given: "no config.yml at the given path",
      should: "return an empty object",
      actual: result,
      expected: {},
    });
  });

  test("returns parsed YAML when config file exists", async () => {
    const tempDir = await createTempDir();
    const configFile = path.join(tempDir, "config.yml");
    await fs.writeFile(
      configFile,
      yaml.dump({ "create-uri": "https://github.com/org/scaffold" }),
      "utf-8",
    );

    const result = await readConfig({ configFile });

    assert({
      given: "a valid config.yml",
      should: "return the parsed config object",
      actual: result["create-uri"],
      expected: "https://github.com/org/scaffold",
    });
  });

  test("returns empty object when config file contains invalid YAML", async () => {
    const tempDir = await createTempDir();
    const configFile = path.join(tempDir, "config.yml");
    await fs.writeFile(configFile, "key: [unclosed bracket", "utf-8");

    const result = await readConfig({ configFile });

    assert({
      given: "a malformed config.yml",
      should: "return an empty object without throwing",
      actual: result,
      expected: {},
    });
  });

  test("returns empty object when config file contains a YAML-specific tag", async () => {
    const tempDir = await createTempDir();
    const configFile = path.join(tempDir, "config.yml");
    await fs.writeFile(configFile, 'key: !!binary "aGVsbG8="', "utf-8");

    const result = await readConfig({ configFile });

    assert({
      given: "a config.yml with a YAML-specific tag (!!binary)",
      should: "return an empty object without throwing",
      actual: result,
      expected: {},
    });
  });
});

describe("writeConfig", () => {
  test("creates config file with given updates as YAML", async () => {
    const tempDir = await createTempDir();
    const configFile = path.join(tempDir, "config.yml");

    await writeConfig({
      configFile,
      updates: { "create-uri": "https://github.com/org/scaffold" },
    });

    const content = await fs.readFile(configFile, "utf-8");
    const parsed = yaml.load(content);

    assert({
      given: "writeConfig called with create-uri",
      should: "write the value as YAML to the config file",
      actual: parsed["create-uri"],
      expected: "https://github.com/org/scaffold",
    });
  });

  test("creates parent directory if it does not exist", async () => {
    const tempDir = await createTempDir();
    const nestedConfig = path.join(tempDir, "nested", "config.yml");

    await writeConfig({
      configFile: nestedConfig,
      updates: { "create-uri": "https://github.com/org/scaffold" },
    });

    const exists = await fs.pathExists(nestedConfig);

    assert({
      given: "writeConfig with a configFile in a non-existent directory",
      should: "create the directory and write the file",
      actual: exists,
      expected: true,
    });
  });

  test("merges new updates into existing config without losing other keys", async () => {
    const tempDir = await createTempDir();
    const configFile = path.join(tempDir, "config.yml");
    await fs.writeFile(
      configFile,
      yaml.dump({ "other-key": "keep-me" }),
      "utf-8",
    );

    await writeConfig({
      configFile,
      updates: { "create-uri": "https://github.com/org/scaffold" },
    });

    const content = await fs.readFile(configFile, "utf-8");
    const parsed = yaml.load(content);

    assert({
      given: "existing config with other-key and writeConfig adding create-uri",
      should: "preserve other-key",
      actual: parsed["other-key"],
      expected: "keep-me",
    });

    assert({
      given: "existing config with other-key and writeConfig adding create-uri",
      should: "include the new create-uri value",
      actual: parsed["create-uri"],
      expected: "https://github.com/org/scaffold",
    });
  });

  test("returns the merged config object", async () => {
    const tempDir = await createTempDir();
    const configFile = path.join(tempDir, "config.yml");

    const result = await writeConfig({
      configFile,
      updates: { "create-uri": "https://github.com/org/scaffold" },
    });

    assert({
      given: "writeConfig called",
      should: "return the merged config",
      actual: result["create-uri"],
      expected: "https://github.com/org/scaffold",
    });
  });

  test("overwrites existing value for the same key", async () => {
    const tempDir = await createTempDir();
    const configFile = path.join(tempDir, "config.yml");

    await writeConfig({
      configFile,
      updates: { "create-uri": "https://github.com/org/old" },
    });
    await writeConfig({
      configFile,
      updates: { "create-uri": "https://github.com/org/new" },
    });

    const content = await fs.readFile(configFile, "utf-8");
    const parsed = yaml.load(content);

    assert({
      given: "writeConfig called twice with the same key",
      should: "use the most recent value",
      actual: parsed["create-uri"],
      expected: "https://github.com/org/new",
    });
  });
});
