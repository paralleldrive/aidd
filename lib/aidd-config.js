import path from "path";
import fs from "fs-extra";

const CONFIG_FILENAME = ".aidd-config.json";

/**
 * Read project-level aidd config from <cwd>/.aidd-config.json.
 * Returns {} if the file does not exist or cannot be parsed.
 */
const readConfig = async ({ cwd = process.cwd() } = {}) => {
  const configPath = path.join(cwd, CONFIG_FILENAME);
  try {
    return await fs.readJson(configPath);
  } catch {
    return {};
  }
};

/**
 * Merge `updates` into the existing config and write back to disk.
 * Returns the merged config object.
 */
const writeConfig = async ({ cwd = process.cwd(), updates = {} } = {}) => {
  const configPath = path.join(cwd, CONFIG_FILENAME);
  const existing = await readConfig({ cwd });
  const merged = { ...existing, ...updates };
  await fs.writeJson(configPath, merged, { spaces: 2 });
  return merged;
};

export { CONFIG_FILENAME, readConfig, writeConfig };
