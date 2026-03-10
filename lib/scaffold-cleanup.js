import path from "path";
import fs from "fs-extra";

const scaffoldCleanup = async ({ folder = process.cwd() } = {}) => {
  const aiDdDir = path.join(folder, ".aidd");
  const exists = await fs.pathExists(aiDdDir);

  if (!exists) {
    return {
      action: "not-found",
      message: `Nothing to clean up: ${aiDdDir} does not exist.`,
    };
  }

  await fs.remove(aiDdDir);
  return { action: "removed", message: `Removed ${aiDdDir}` };
};

export { scaffoldCleanup };
