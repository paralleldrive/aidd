import os from "os";
import path from "path";
import fs from "fs-extra";
import yaml from "js-yaml";
import { assert } from "riteway/vitest";
import {
  afterEach,
  beforeEach,
  describe,
  onTestFinished,
  test,
  vi,
} from "vitest";

import { resolveAgentConfig } from "./config.js";

const createTempDir = async () => {
  const dir = path.join(
    os.tmpdir(),
    `aidd-agent-config-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  await fs.ensureDir(dir);
  onTestFinished(async () => fs.remove(dir));
  return dir;
};

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

  test("invalid agent name in aidd-custom/config.yml warns and falls back to claude", async () => {
    const tempDir = await createTempDir();
    const aiddCustomDir = path.join(tempDir, "aidd-custom");
    await fs.ensureDir(aiddCustomDir);
    await fs.writeFile(
      path.join(aiddCustomDir, "config.yml"),
      yaml.dump({ "agent-config": "openncode" }),
      "utf-8",
    );

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    onTestFinished(() => warnSpy.mockRestore());

    const result = await resolveAgentConfig({ cwd: tempDir });

    assert({
      given:
        "agent-config in aidd-custom/config.yml contains an unknown agent name (typo)",
      should: "warn to stderr with a helpful message",
      actual: warnSpy.mock.calls.length > 0,
      expected: true,
    });

    assert({
      given:
        "agent-config in aidd-custom/config.yml contains an unknown agent name (typo)",
      should: "fall through to the claude default",
      actual: result,
      expected: { command: "claude", args: ["-p"] },
    });
  });

  test("agent-config references a missing YAML file warns with read-specific message", async () => {
    const tempDir = await createTempDir();
    const aiddCustomDir = path.join(tempDir, "aidd-custom");
    await fs.ensureDir(aiddCustomDir);
    await fs.writeFile(
      path.join(aiddCustomDir, "config.yml"),
      yaml.dump({ "agent-config": "./nonexistent-agent.yml" }),
      "utf-8",
    );

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    onTestFinished(() => warnSpy.mockRestore());

    const result = await resolveAgentConfig({ cwd: tempDir });

    assert({
      given:
        "agent-config in aidd-custom/config.yml references a missing YAML file",
      should: "warn with a message specific to the read failure",
      actual: warnSpy.mock.calls[0]?.[0]?.includes(
        "cannot read referenced file",
      ),
      expected: true,
    });

    assert({
      given:
        "agent-config in aidd-custom/config.yml references a missing YAML file",
      should: "fall through to the claude default",
      actual: result,
      expected: { command: "claude", args: ["-p"] },
    });
  });

  test("agent-config references a file with invalid YAML warns with parse-specific message", async () => {
    const tempDir = await createTempDir();
    const aiddCustomDir = path.join(tempDir, "aidd-custom");
    await fs.ensureDir(aiddCustomDir);
    await fs.writeFile(
      path.join(tempDir, "agent.yml"),
      "key: [unclosed bracket",
      "utf-8",
    );
    await fs.writeFile(
      path.join(aiddCustomDir, "config.yml"),
      yaml.dump({ "agent-config": "./agent.yml" }),
      "utf-8",
    );

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    onTestFinished(() => warnSpy.mockRestore());

    const result = await resolveAgentConfig({ cwd: tempDir });

    assert({
      given:
        "agent-config in aidd-custom/config.yml references a file with invalid YAML",
      should: "warn with a message specific to the YAML parse failure",
      actual: warnSpy.mock.calls[0]?.[0]?.includes("invalid YAML"),
      expected: true,
    });

    assert({
      given:
        "agent-config in aidd-custom/config.yml references a file with invalid YAML",
      should: "fall through to the claude default",
      actual: result,
      expected: { command: "claude", args: ["-p"] },
    });
  });

  test("agent-config references a YAML file missing command warns with validation-specific message", async () => {
    const tempDir = await createTempDir();
    const aiddCustomDir = path.join(tempDir, "aidd-custom");
    await fs.ensureDir(aiddCustomDir);
    await fs.writeFile(
      path.join(tempDir, "agent.yml"),
      yaml.dump({ args: ["--flag"] }),
      "utf-8",
    );
    await fs.writeFile(
      path.join(aiddCustomDir, "config.yml"),
      yaml.dump({ "agent-config": "./agent.yml" }),
      "utf-8",
    );

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    onTestFinished(() => warnSpy.mockRestore());

    const result = await resolveAgentConfig({ cwd: tempDir });

    assert({
      given:
        "agent-config in aidd-custom/config.yml references a YAML file missing the command field",
      should: "warn with a validation-specific message",
      actual: warnSpy.mock.calls[0]?.[0]?.includes(
        "must contain a 'command' field",
      ),
      expected: true,
    });

    assert({
      given:
        "agent-config in aidd-custom/config.yml references a YAML file missing the command field",
      should: "fall through to the claude default",
      actual: result,
      expected: { command: "claude", args: ["-p"] },
    });
  });

  test("ENOENT for missing aidd-custom/config.yml does not warn", async () => {
    const tempDir = await createTempDir();

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    onTestFinished(() => warnSpy.mockRestore());

    await resolveAgentConfig({ cwd: tempDir });

    assert({
      given: "no aidd-custom/config.yml file present",
      should: "not call console.warn",
      actual: warnSpy.mock.calls.length,
      expected: 0,
    });
  });
});
