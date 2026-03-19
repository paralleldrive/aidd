import { spawn } from "child_process";
import { createError } from "error-causes";

import { ScaffoldStepError } from "../scaffold-errors.js";

/**
 * @param {{ agentConfig: { command: string, args?: string[] }, prompt: string, cwd: string }} options
 * @returns {Promise<void>}
 */
const runAgent = ({ agentConfig, prompt, cwd }) => {
  const { command, args = [] } = agentConfig;
  const spawnArgs = [...args, prompt];

  return new Promise((resolve, reject) => {
    const child = spawn(command, spawnArgs, {
      cwd,
      shell: false,
      stdio: "inherit",
    });
    child.on("close", (code, signal) => {
      if (signal != null) {
        reject(
          createError({
            ...ScaffoldStepError,
            message: `Agent killed by signal ${signal}: ${[command, ...spawnArgs].join(" ")}`,
          }),
        );
      } else if (code !== 0) {
        reject(
          createError({
            ...ScaffoldStepError,
            message: `Agent exited with code ${code}: ${[command, ...spawnArgs].join(" ")}`,
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
            message: `Argument list too long for spawn: ${[command, ...spawnArgs].join(" ")}`,
          }),
        );
      } else {
        reject(
          createError({
            ...ScaffoldStepError,
            cause: spawnErr,
            message: `Failed to spawn agent: ${[command, ...spawnArgs].join(" ")}`,
          }),
        );
      }
    });
  });
};

export { runAgent };
