import { spawn } from "child_process";
import { createError } from "error-causes";
import fs from "fs-extra";
import yaml from "js-yaml";

import { resolveAgentConfig } from "./agent-cli/config.js";
import { runAgent } from "./agent-cli/runner.js";
import {
  ScaffoldStepError,
  ScaffoldValidationError,
} from "./scaffold-errors.js";

// Accepts a string (shell command) or [cmd, ...args] array (no-shell spawn).
// Using an array avoids shell injection for untrusted input such as prompt text.
/**
 * @param {string | string[]} commandOrArgs
 * @param {string} cwd
 * @returns {Promise<void>}
 */
const defaultExecStep = (commandOrArgs, cwd) => {
  const isArray = Array.isArray(commandOrArgs);
  const [cmd, ...args] = isArray ? commandOrArgs : [commandOrArgs];
  const display = isArray ? commandOrArgs.join(" ") : commandOrArgs;

  return new Promise((resolve, reject) => {
    console.log(`> ${display}`);
    const child = spawn(cmd, args, {
      cwd,
      shell: !isArray,
      stdio: "inherit",
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          createError({
            ...ScaffoldStepError,
            message: `Command failed with exit code ${code}: ${display}`,
          }),
        );
      } else {
        resolve();
      }
    });
    child.on("error", (spawnErr) => {
      const { code } = /** @type {NodeJS.ErrnoException} */ (spawnErr);
      if (code === "E2BIG" || code === "ENOBUFS") {
        reject(
          createError({
            ...ScaffoldStepError,
            message: `Argument list too long for spawn: ${display}`,
          }),
        );
      } else {
        reject(
          createError({
            ...ScaffoldStepError,
            cause: spawnErr,
            message: `Failed to spawn command: ${display}`,
          }),
        );
      }
    });
  });
};

const KNOWN_STEP_KEYS = new Set(["run", "prompt"]);

/** @param {string} content */
const parseManifest = (content) => {
  // Use JSON_SCHEMA to restrict parsing to plain JSON types (strings, numbers,
  // booleans, null, arrays, objects). This prevents YAML-specific extensions
  // like !!binary or !!timestamp from being accepted in untrusted manifests.
  const data = yaml.load(content, { schema: yaml.JSON_SCHEMA });
  const steps = /** @type {any} */ (data)?.steps;

  // No steps key — treat as an empty manifest (backward-compatible default).
  if (steps === undefined || steps === null) return [];

  // Validate that steps is an array. A string or plain object means the YAML
  // was written incorrectly and would silently iterate unexpected values.
  if (!Array.isArray(steps)) {
    throw createError({
      ...ScaffoldValidationError,
      message: `Manifest 'steps' must be an array, got ${typeof steps}`,
    });
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    if (step === null || typeof step !== "object" || Array.isArray(step)) {
      throw createError({
        ...ScaffoldValidationError,
        message: `Manifest step ${i + 1} must be an object, got ${
          step === null ? "null" : Array.isArray(step) ? "array" : typeof step
        }`,
      });
    }

    const knownKeys = Object.keys(step).filter((k) => KNOWN_STEP_KEYS.has(k));

    if (knownKeys.length === 0) {
      const found = Object.keys(step).join(", ") || "(empty)";
      throw createError({
        ...ScaffoldValidationError,
        message: `Manifest step ${i + 1} has no recognized keys (run, prompt). Found: ${found}`,
      });
    }

    if (knownKeys.length > 1) {
      throw createError({
        ...ScaffoldValidationError,
        message: `Manifest step ${i + 1} has ambiguous keys: ${knownKeys.join(" and ")}. Each step must have exactly one of: run, prompt`,
      });
    }

    const key = knownKeys[0];
    const value = step[key];
    if (typeof value !== "string") {
      throw createError({
        ...ScaffoldValidationError,
        message: `Manifest step ${i + 1} '${key}' must be a string, got ${Array.isArray(value) ? "array" : typeof value}`,
      });
    }
  }

  const firstAiddRunIndex = steps.findIndex((s) => s.run?.includes("aidd"));
  const firstPromptIndex = steps.findIndex((s) => s.prompt !== undefined);

  if (
    firstPromptIndex !== -1 &&
    (firstAiddRunIndex === -1 || firstPromptIndex < firstAiddRunIndex)
  ) {
    throw createError({
      ...ScaffoldValidationError,
      message:
        "A run: step invoking aidd (e.g. run: npx aidd .) must precede any prompt: step",
    });
  }

  return steps;
};

/**
 * @param {{ manifestPath: string, folder: string, agentConfig?: string | { command: string, args?: string[] }, execStep?: typeof defaultExecStep }} options
 */
const runManifest = async ({
  manifestPath,
  folder,
  agentConfig = "claude",
  execStep = defaultExecStep,
}) => {
  const content = await fs.readFile(manifestPath, "utf-8");
  const steps = parseManifest(content);

  const hasPromptStep = steps.some((s) => s.prompt !== undefined);
  const agentCfg = hasPromptStep
    ? await resolveAgentConfig({ cwd: folder, value: agentConfig })
    : undefined;

  for (const step of steps) {
    if (step.run !== undefined) {
      await execStep(step.run, folder);
    } else if (step.prompt !== undefined) {
      await runAgent({
        agentConfig: /** @type {NonNullable<typeof agentCfg>} */ (agentCfg),
        cwd: folder,
        prompt: step.prompt,
      });
    }
  }
};

export { defaultExecStep, parseManifest, runManifest };
