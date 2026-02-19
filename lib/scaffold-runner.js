import { spawn } from "child_process";
import { createError } from "error-causes";
import fs from "fs-extra";
import yaml from "js-yaml";

import {
  ScaffoldStepError,
  ScaffoldValidationError,
} from "./scaffold-errors.js";

// Accepts a string (shell command) or [cmd, ...args] array (no-shell spawn).
// Using an array avoids shell injection for untrusted input such as prompt text.
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
    child.on("error", (err) => {
      reject(
        createError({
          ...ScaffoldStepError,
          cause: err,
          message: `Failed to spawn command: ${display}`,
        }),
      );
    });
  });
};

const KNOWN_STEP_KEYS = new Set(["run", "prompt"]);

const parseManifest = (content) => {
  // yaml.load() handles the optional YAML document-start marker (---).
  const data = yaml.load(content);
  const steps = data?.steps;

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
  }

  return steps;
};

const runManifest = async ({
  manifestPath,
  extensionJsPath,
  folder,
  agent = "claude",
  execStep = defaultExecStep,
}) => {
  const content = await fs.readFile(manifestPath, "utf-8");
  const steps = parseManifest(content);

  for (const step of steps) {
    if (step.run !== undefined) {
      // run steps are shell commands written by the scaffold author
      await execStep(step.run, folder);
    } else if (step.prompt !== undefined) {
      // prompt steps pass the text as a separate arg to avoid shell injection
      await execStep([agent, step.prompt], folder);
    }
  }

  if (extensionJsPath) {
    const exists = await fs.pathExists(extensionJsPath);
    if (exists) {
      await execStep(["node", extensionJsPath], folder);
    }
  }
};

export { parseManifest, runManifest };
