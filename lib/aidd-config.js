import os from "os";
import path from "path";
import fs from "fs-extra";
import yaml from "js-yaml";

const AIDD_HOME = path.join(os.homedir(), ".aidd");
const CONFIG_FILE = path.join(AIDD_HOME, "config.yml");

/**
 * Read ~/.aidd/config.yml (or a custom path for testing).
 * Returns {} if the file does not exist or cannot be parsed.
 */
const readConfig = async ({ configFile = CONFIG_FILE } = {}) => {
  try {
    const content = await fs.readFile(configFile, "utf-8");
    return yaml.load(content) ?? {};
  } catch {
    return {};
  }
};

/**
 * Merge `updates` into the existing config and write back to disk as YAML.
 * Returns the merged config object.
 */
const writeConfig = async ({ updates = {}, configFile = CONFIG_FILE } = {}) => {
  await fs.ensureDir(path.dirname(configFile));
  const existing = await readConfig({ configFile });
  const merged = { ...existing, ...updates };
  await fs.writeFile(configFile, yaml.dump(merged), "utf-8");
  return merged;
};

export { AIDD_HOME, CONFIG_FILE, readConfig, writeConfig };
