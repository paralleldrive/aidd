import { spawn } from "child_process";
import fs from "fs-extra";
import matter from "gray-matter";

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
        reject(new Error(`Command failed with exit code ${code}: ${display}`));
      } else {
        resolve();
      }
    });
    child.on("error", reject);
  });
};

const parseManifest = (content) => {
  const { data } = matter(`---\n${content}\n---`);
  return data.steps || [];
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
