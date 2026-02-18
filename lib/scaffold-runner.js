import { spawn } from "child_process";
import fs from "fs-extra";
import matter from "gray-matter";

const defaultExecStep = (command, cwd) =>
  new Promise((resolve, reject) => {
    console.log(`> ${command}`);
    const child = spawn(command, { cwd, shell: true, stdio: "inherit" });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}: ${command}`));
      } else {
        resolve();
      }
    });
    child.on("error", reject);
  });

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
      await execStep(step.run, folder);
    } else if (step.prompt !== undefined) {
      await execStep(`${agent} "${step.prompt}"`, folder);
    }
  }

  if (extensionJsPath) {
    const exists = await fs.pathExists(extensionJsPath);
    if (exists) {
      await execStep(`node "${extensionJsPath}"`, folder);
    }
  }
};

export { parseManifest, runManifest };
