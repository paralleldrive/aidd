import path from "path";
import { createError } from "error-causes";
import fs from "fs-extra";
import yaml from "js-yaml";

import {
  AgentConfigParseError,
  AgentConfigReadError,
  AgentConfigValidationError,
} from "./errors.js";

/** @type {Record<string, { command: string, args: string[] }>} */
const agentPresets = {
  claude: { args: ["-p"], command: "claude" },
  cursor: { args: ["--print"], command: "agent" },
  opencode: { args: ["run"], command: "opencode" },
};

/**
 * @param {string} [name]
 * @returns {{ command: string, args?: string[] }}
 */
const getAgentConfig = (name = "claude") => {
  const key = name.toLowerCase();
  const preset = agentPresets[key];
  if (!preset) {
    const supported = Object.keys(agentPresets).join(", ");
    throw createError({
      ...AgentConfigValidationError,
      message: `Unknown agent "${name}". Supported agents: ${supported}`,
    });
  }
  return { args: [...preset.args], command: preset.command };
};

/** @param {unknown} value */
const isYamlPath = (value) =>
  typeof value === "string" &&
  (value.endsWith(".yml") || value.endsWith(".yaml"));

/**
 * @param {string} filePath
 * @returns {Promise<{ command: string, args?: string[] }>}
 */
const loadYamlConfig = async (filePath) => {
  let content;
  try {
    content = await fs.readFile(filePath, "utf-8");
  } catch (cause) {
    throw createError({ ...AgentConfigReadError, cause });
  }

  let parsed;
  try {
    parsed = yaml.load(content, { schema: yaml.JSON_SCHEMA });
  } catch (cause) {
    throw createError({ ...AgentConfigParseError, cause });
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("command" in parsed) ||
    !parsed.command
  ) {
    throw createError({
      ...AgentConfigValidationError,
      message: "Agent config file must contain a 'command' field",
    });
  }

  return /** @type {{ command: string, args?: string[] }} */ (parsed);
};

/**
 * @param {{ value?: string | { command: string, args?: string[] }, cwd?: string }} [options]
 * @returns {Promise<{ command: string, args?: string[] }>}
 */
const resolveAgentConfig = async ({ value, cwd = process.cwd() } = {}) => {
  if (value !== undefined) {
    if (isYamlPath(value)) return loadYamlConfig(/** @type {string} */ (value));
    if (value === null || Array.isArray(value)) {
      throw createError({
        ...AgentConfigValidationError,
        message: `Invalid agent config: expected a string, object with command, or YAML path`,
      });
    }
    if (typeof value === "object") return value;
    return getAgentConfig(/** @type {string} */ (value));
  }

  const envValue = process.env.AIDD_AGENT_CONFIG;
  if (envValue) {
    if (isYamlPath(envValue)) return loadYamlConfig(envValue);
    return getAgentConfig(envValue);
  }

  const configFile = path.join(cwd, "aidd-custom", "config.yml");
  try {
    const content = await fs.readFile(configFile, "utf-8");
    const parsed = yaml.load(content, { schema: yaml.JSON_SCHEMA });
    if (
      parsed &&
      typeof parsed === "object" &&
      "agent-config" in parsed &&
      parsed["agent-config"]
    ) {
      const agentConfigValue = parsed["agent-config"];
      if (isYamlPath(agentConfigValue)) {
        const resolved = path.isAbsolute(
          /** @type {string} */ (agentConfigValue),
        )
          ? /** @type {string} */ (agentConfigValue)
          : path.resolve(cwd, /** @type {string} */ (agentConfigValue));
        return loadYamlConfig(resolved);
      }
      if (
        agentConfigValue !== null &&
        !Array.isArray(agentConfigValue) &&
        typeof agentConfigValue === "object"
      ) {
        return /** @type {{ command: string, args?: string[] }} */ (
          agentConfigValue
        );
      }
      return getAgentConfig(/** @type {string} */ (agentConfigValue));
    }
  } catch {
    // silently skip if the file does not exist or cannot be read
  }

  return getAgentConfig("claude");
};

export { getAgentConfig, resolveAgentConfig };
