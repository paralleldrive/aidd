import os from "os";
import path from "path";
import fs from "fs-extra";
import yaml from "js-yaml";
import { assert } from "riteway/vitest";
import { afterEach, beforeEach, describe, onTestFinished, test } from "vitest";

import { getAgentConfig, resolveAgentConfig } from "./config.js";

const createTempDir = async () => {
  const dir = path.join(
    os.tmpdir(),
    `aidd-agent-config-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  await fs.ensureDir(dir);
  onTestFinished(async () => fs.remove(dir));
  return dir;
};

describe("getAgentConfig", () => {
  test("claude preset", () => {
    assert({
      given: "agent name 'claude'",
      should: "return the claude preset config",
      actual: getAgentConfig("claude"),
      expected: { command: "claude", args: ["-p"] },
    });
  });

  test("opencode preset", () => {
    assert({
      given: "agent name 'opencode'",
      should: "return the opencode preset config",
      actual: getAgentConfig("opencode"),
      expected: { command: "opencode", args: ["run"] },
    });
  });

  test("cursor preset", () => {
    assert({
      given: "agent name 'cursor'",
      should: "return the cursor preset config",
      actual: getAgentConfig("cursor"),
      expected: { command: "agent", args: ["--print"] },
    });
  });

  test("default preset", () => {
    assert({
      given: "no argument",
      should: "default to the claude preset config",
      actual: getAgentConfig(),
      expected: { command: "claude", args: ["-p"] },
    });
  });

  test("case-insensitive agent name resolution", () => {
    assert({
      given: "agent name 'Claude' with capital C",
      should: "resolve to the claude preset case-insensitively",
      actual: getAgentConfig("Claude"),
      expected: { command: "claude", args: ["-p"] },
    });
  });

  test("returns a distinct object on each call", () => {
    const result1 = getAgentConfig("claude");
    const result2 = getAgentConfig("claude");

    assert({
      given: "getAgentConfig called twice with the same name",
      should: "return a distinct object each time (not the same reference)",
      actual: result1 === result2,
      expected: false,
    });
  });

  test("mutating returned args does not affect subsequent calls", () => {
    const result1 = getAgentConfig("claude");
    const originalLength = result1.args?.length ?? 0;
    result1.args?.push("--extra");

    assert({
      given: "args array from first call is mutated",
      should: "not change the args length returned by a subsequent call",
      actual: getAgentConfig("claude").args?.length ?? 0,
      expected: originalLength,
    });
  });

  test("unknown agent name", () => {
    let error;
    try {
      getAgentConfig("unknown-agent");
    } catch (e) {
      error = /** @type {any} */ (e);
    }

    assert({
      given: "an unknown agent name",
      should: "throw an AgentConfigValidationError",
      actual: error?.cause?.name,
      expected: "AgentConfigValidationError",
    });

    assert({
      given: "an unknown agent name",
      should: "include all supported agent names in the error message",
      actual:
        error?.message?.includes("claude") &&
        error?.message?.includes("opencode") &&
        error?.message?.includes("cursor"),
      expected: true,
    });
  });
});

describe("resolveAgentConfig", () => {
  let savedEnv = /** @type {string | undefined} */ (undefined);

  beforeEach(() => {
    savedEnv = process.env.AIDD_AGENT_CONFIG;
    delete process.env.AIDD_AGENT_CONFIG;
  });

  afterEach(() => {
    if (savedEnv !== undefined) {
      process.env.AIDD_AGENT_CONFIG = savedEnv;
    } else {
      delete process.env.AIDD_AGENT_CONFIG;
    }
  });

  test("plain object value used directly", async () => {
    const config = { command: "my-agent", args: ["--run"] };

    assert({
      given: "a plain object { command, args }",
      should: "return the object directly as the agent config",
      actual: await resolveAgentConfig({ value: config }),
      expected: config,
    });
  });

  test("plain agent name string delegates to getAgentConfig", async () => {
    assert({
      given: "agent name string 'opencode'",
      should: "return the opencode preset config",
      actual: await resolveAgentConfig({ value: "opencode" }),
      expected: { command: "opencode", args: ["run"] },
    });
  });

  test("YAML file value (.yml) loads and returns agent config", async () => {
    const tempDir = await createTempDir();
    const configFile = path.join(tempDir, "agent.yml");
    await fs.writeFile(
      configFile,
      yaml.dump({ command: "my-agent", args: ["--flag"] }),
      "utf-8",
    );

    assert({
      given: "a value ending in .yml pointing to a valid agent config file",
      should: "load and return the agent config",
      actual: await resolveAgentConfig({ value: configFile }),
      expected: { command: "my-agent", args: ["--flag"] },
    });
  });

  test("YAML file value (.yaml) loads and returns agent config", async () => {
    const tempDir = await createTempDir();
    const configFile = path.join(tempDir, "agent.yaml");
    await fs.writeFile(
      configFile,
      yaml.dump({ command: "my-agent", args: ["--go"] }),
      "utf-8",
    );

    assert({
      given: "a value ending in .yaml pointing to a valid agent config file",
      should: "load and return the agent config",
      actual: await resolveAgentConfig({ value: configFile }),
      expected: { command: "my-agent", args: ["--go"] },
    });
  });

  test("YAML file read failure throws AgentConfigReadError", async () => {
    let error;
    try {
      await resolveAgentConfig({ value: "/nonexistent/path/agent.yml" });
    } catch (e) {
      error = /** @type {any} */ (e);
    }

    assert({
      given: "a .yml path that cannot be read",
      should: "throw an AgentConfigReadError",
      actual: error?.cause?.name,
      expected: "AgentConfigReadError",
    });
  });

  test("YAML file with invalid YAML throws AgentConfigParseError", async () => {
    const tempDir = await createTempDir();
    const configFile = path.join(tempDir, "bad.yml");
    await fs.writeFile(configFile, "key: [unclosed bracket", "utf-8");

    let error;
    try {
      await resolveAgentConfig({ value: configFile });
    } catch (e) {
      error = /** @type {any} */ (e);
    }

    assert({
      given: "a .yml path containing invalid YAML",
      should: "throw an AgentConfigParseError",
      actual: error?.cause?.name,
      expected: "AgentConfigParseError",
    });
  });

  test("YAML agent config missing command throws AgentConfigValidationError", async () => {
    const tempDir = await createTempDir();
    const configFile = path.join(tempDir, "no-command.yml");
    await fs.writeFile(configFile, yaml.dump({ args: ["--flag"] }), "utf-8");

    let error;
    try {
      await resolveAgentConfig({ value: configFile });
    } catch (e) {
      error = /** @type {any} */ (e);
    }

    assert({
      given: "a YAML agent config file missing the 'command' field",
      should: "throw an AgentConfigValidationError",
      actual: error?.cause?.name,
      expected: "AgentConfigValidationError",
    });
  });

  test("AIDD_AGENT_CONFIG env var with agent name", async () => {
    process.env.AIDD_AGENT_CONFIG = "opencode";

    assert({
      given: "AIDD_AGENT_CONFIG set to an agent name",
      should: "resolve using the env var agent name",
      actual: await resolveAgentConfig(),
      expected: { command: "opencode", args: ["run"] },
    });
  });

  test("AIDD_AGENT_CONFIG env var with YAML path", async () => {
    const tempDir = await createTempDir();
    const configFile = path.join(tempDir, "agent.yml");
    await fs.writeFile(
      configFile,
      yaml.dump({ command: "custom-agent", args: ["--go"] }),
      "utf-8",
    );
    process.env.AIDD_AGENT_CONFIG = configFile;

    assert({
      given: "AIDD_AGENT_CONFIG set to a YAML file path",
      should: "load and return the agent config from the YAML file",
      actual: await resolveAgentConfig(),
      expected: { command: "custom-agent", args: ["--go"] },
    });
  });

  test("agent-config key in aidd-custom/config.yml", async () => {
    const tempDir = await createTempDir();
    const aiddCustomDir = path.join(tempDir, "aidd-custom");
    await fs.ensureDir(aiddCustomDir);
    await fs.writeFile(
      path.join(aiddCustomDir, "config.yml"),
      yaml.dump({ "agent-config": "cursor" }),
      "utf-8",
    );

    assert({
      given: "agent-config key set to 'cursor' in aidd-custom/config.yml",
      should: "resolve using the agent-config key from the config file",
      actual: await resolveAgentConfig({ cwd: tempDir }),
      expected: { command: "agent", args: ["--print"] },
    });
  });

  test("inline object in aidd-custom/config.yml used as agent config", async () => {
    const tempDir = await createTempDir();
    const aiddCustomDir = path.join(tempDir, "aidd-custom");
    await fs.ensureDir(aiddCustomDir);
    await fs.writeFile(
      path.join(aiddCustomDir, "config.yml"),
      yaml.dump({ "agent-config": { command: "myagent", args: ["--run"] } }),
      "utf-8",
    );

    assert({
      given:
        "agent-config in aidd-custom/config.yml is a YAML mapping with a command field",
      should: "use it as the agent config",
      actual: await resolveAgentConfig({ cwd: tempDir }),
      expected: { command: "myagent", args: ["--run"] },
    });
  });

  test("null value throws AgentConfigValidationError", async () => {
    let error;
    try {
      await resolveAgentConfig({ value: /** @type {any} */ (null) });
    } catch (e) {
      error = /** @type {any} */ (e);
    }

    assert({
      given: "value is null",
      should: "throw AgentConfigValidationError",
      actual: error?.cause?.name,
      expected: "AgentConfigValidationError",
    });
  });

  test("array value throws AgentConfigValidationError", async () => {
    let error;
    try {
      await resolveAgentConfig({ value: /** @type {any} */ (["myagent"]) });
    } catch (e) {
      error = /** @type {any} */ (e);
    }

    assert({
      given: "value is an array",
      should: "throw AgentConfigValidationError",
      actual: error?.cause?.name,
      expected: "AgentConfigValidationError",
    });
  });

  test("relative YAML path in aidd-custom/config.yml resolves from cwd", async () => {
    const tempDir = await createTempDir();
    const aiddCustomDir = path.join(tempDir, "aidd-custom");
    await fs.ensureDir(aiddCustomDir);
    await fs.writeFile(
      path.join(aiddCustomDir, "config.yml"),
      yaml.dump({ "agent-config": "./agent.yml" }),
      "utf-8",
    );
    await fs.writeFile(
      path.join(tempDir, "agent.yml"),
      yaml.dump({ command: "myagent" }),
      "utf-8",
    );

    assert({
      given:
        "agent-config is a relative .yml path in aidd-custom/config.yml and the file exists in cwd",
      should: "load it regardless of which directory the CLI was invoked from",
      actual: await resolveAgentConfig({ cwd: tempDir }),
      expected: { command: "myagent" },
    });
  });

  test("no value, no env var, no config file defaults to claude", async () => {
    const tempDir = await createTempDir();

    assert({
      given:
        "no value, no AIDD_AGENT_CONFIG env var, and no aidd-custom/config.yml",
      should: "default to the claude preset",
      actual: await resolveAgentConfig({ cwd: tempDir }),
      expected: { command: "claude", args: ["-p"] },
    });
  });
});
