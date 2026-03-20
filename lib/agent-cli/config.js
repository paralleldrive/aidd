import path from "path";
import { createError } from "error-causes";
import fs from "fs-extra";
import yaml from "js-yaml";

import {
  AgentConfigParseError,
  AgentConfigReadError,
  AgentConfigValidationError,
  handleAgentErrors,
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
  const content = await fs
    .readFile(filePath, "utf-8")
    .catch((cause) =>
      Promise.reject(createError({ ...AgentConfigReadError, cause })),
    );

  const parsed = await Promise.resolve()
    .then(() => yaml.load(content, { schema: yaml.JSON_SCHEMA }))
    .catch((cause) =>
      Promise.reject(createError({ ...AgentConfigParseError, cause })),
    );

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

/** @type {Record<string, (v: unknown, rp: (p: string) => string) => Promise<{ command: string, args?: string[] }>>} */
const valueKindHandlers = {
  inline: (v) =>
    Promise.resolve(/** @type {{ command: string, args?: string[] }} */ (v)),
  invalid: () =>
    Promise.reject(
      createError({
        ...AgentConfigValidationError,
        message: `Invalid agent config: expected a string, object with command, or YAML path`,
      }),
    ),
  preset: (v) => Promise.resolve(getAgentConfig(/** @type {string} */ (v))),
  yaml: (v, rp) => loadYamlConfig(rp(/** @type {string} */ (v))),
};

/**
 * @param {unknown} value
 * @param {(p: string) => string} resolveYamlPath
 * @returns {Promise<{ command: string, args?: string[] }>}
 */
const resolveByKind = (value, resolveYamlPath) => {
  const kind =
    value === null || Array.isArray(value)
      ? "invalid"
      : isYamlPath(value)
        ? "yaml"
        : typeof value === "object"
          ? "inline"
          : "preset";
  return valueKindHandlers[kind](value, resolveYamlPath);
};

/**
 * @param {unknown} value
 * @returns {Promise<{ command: string, args?: string[] }>}
 */
const resolveExplicitValue = (value) => resolveByKind(value, (p) => p);

/**
 * @param {unknown} configValue
 * @param {string} cwd
 * @returns {Promise<{ command: string, args?: string[] }>}
 */
const resolveConfigEntry = (configValue, cwd) =>
  resolveByKind(configValue, (p) =>
    path.isAbsolute(p) ? p : path.resolve(cwd, p),
  );

/**
 * Reads aidd-custom/config.yml and returns the raw `agent-config` value,
 * or null if the file is absent or the key is not set.
 * Throws on genuine read/parse errors (not ENOENT).
 * @param {string} configFile
 * @returns {Promise<unknown>}
 */
const readAiddCustomAgentConfig = async (configFile) => {
  const content = await fs.readFile(configFile, "utf-8").catch((err) => {
    if (/** @type {any} */ (err)?.code === "ENOENT") return null;
    throw err;
  });
  if (content === null) return null;
  const parsed = yaml.load(content, { schema: yaml.JSON_SCHEMA });
  return typeof parsed === "object" && parsed !== null
    ? /** @type {any} */ (parsed)["agent-config"] || null
    : null;
};

/**
 * Dispatches typed agent config errors to distinct warn messages, falling
 * back to a generic message for unrecognised error types.
 * @param {string} configFile
 * @param {unknown} err
 */
const warnAgentConfigError = (configFile, err) => {
  try {
    handleAgentErrors({
      AgentConfigParseError: ({ message }) =>
        console.warn(
          `[aidd] ${configFile}: invalid YAML — ${message}. Falling back to claude.`,
        ),
      AgentConfigReadError: ({ message }) =>
        console.warn(
          `[aidd] ${configFile}: cannot read referenced file — ${message}. Falling back to claude.`,
        ),
      AgentConfigValidationError: ({ message }) =>
        console.warn(
          `[aidd] ${configFile}: ${message}. Falling back to claude.`,
        ),
    })(err);
  } catch {
    console.warn(
      `[aidd] ${configFile}: unexpected error — ${/** @type {any} */ (err)?.message ?? err}. Falling back to claude.`,
    );
  }
};

/**
 * Resolves agent config from aidd-custom/config.yml, or returns null if the
 * file is absent, the key is unset, or any error is encountered (with a warn).
 * @param {string} configFile
 * @param {string} cwd
 * @returns {Promise<{ command: string, args?: string[] } | null>}
 */
const resolveFromConfigFile = async (configFile, cwd) => {
  try {
    const agentConfigValue = await readAiddCustomAgentConfig(configFile);
    if (agentConfigValue !== null)
      return await resolveConfigEntry(agentConfigValue, cwd);
  } catch (err) {
    warnAgentConfigError(configFile, err);
  }
  return null;
};

/**
 * @param {{ value?: string | { command: string, args?: string[] }, cwd?: string }} [options]
 * @returns {Promise<{ command: string, args?: string[] }>}
 */
const resolveAgentConfig = async ({ value, cwd = process.cwd() } = {}) => {
  if (value !== undefined) return resolveExplicitValue(value);
  const envValue = process.env.AIDD_AGENT_CONFIG;
  if (envValue)
    return isYamlPath(envValue)
      ? loadYamlConfig(envValue)
      : getAgentConfig(envValue);
  const configFile = path.join(cwd, "aidd-custom", "config.yml");
  return (
    (await resolveFromConfigFile(configFile, cwd)) ?? getAgentConfig("claude")
  );
};

export { getAgentConfig, resolveAgentConfig };
